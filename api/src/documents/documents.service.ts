import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  DeclineSignatureDto,
  RequestSignatureDto,
  SignDocumentDto,
  UpdateDocumentDto,
} from './dto/document.dto';
import { DocumentCategory, Role } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private notifications: NotificationsService,
  ) {}

  private async getLawyerProfile(userId: number) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Lawyer profile not found');
    return profile;
  }

  private async verifyCaseAccess(userId: number, userRole: Role, caseId: number) {
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');

    if (userRole === Role.LAWYER) {
      const profile = await this.getLawyerProfile(userId);
      if (caseRecord.lawyerId !== profile.id) throw new ForbiddenException();
    } else if (userRole === Role.CLIENT) {
      const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId } });
      if (!clientProfile || caseRecord.clientId !== clientProfile.id)
        throw new ForbiddenException();
    }

    return caseRecord;
  }

  async upload(
    userId: number,
    caseId: number,
    file: Express.Multer.File,
    title: string,
    category: DocumentCategory = DocumentCategory.OTHER,
    description?: string,
  ) {
    const profile = await this.getLawyerProfile(userId);
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.lawyerId !== profile.id) throw new ForbiddenException();

    const result = await this.uploads.uploadFile(file, `legalconnect/cases/${caseId}/documents`);

    return this.prisma.caseDocument.create({
      data: {
        caseId,
        uploadedById: userId,
        title,
        description,
        fileUrl: result.secure_url,
        fileType: file.mimetype,
        fileSizeBytes: file.size,
        category,
      },
    });
  }

  async findByCaseId(userId: number, userRole: Role, caseId: number) {
    await this.verifyCaseAccess(userId, userRole, caseId);

    const where: any = { caseId };
    if (userRole === Role.CLIENT) {
      where.isSharedWithClient = true;
    }

    return this.prisma.caseDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true } },
        signatureRequests: {
          select: { id: true, status: true, requestedToId: true, signedAt: true },
        },
      },
    });
  }

  async update(userId: number, docId: number, dto: UpdateDocumentDto) {
    const doc = await this.prisma.caseDocument.findUnique({
      where: { id: docId },
      include: { case: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const profile = await this.getLawyerProfile(userId);
    if (doc.case.lawyerId !== profile.id) throw new ForbiddenException();

    return this.prisma.caseDocument.update({
      where: { id: docId },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        isSharedWithClient: dto.isSharedWithClient,
      },
    });
  }

  async toggleShare(userId: number, docId: number) {
    const doc = await this.prisma.caseDocument.findUnique({
      where: { id: docId },
      include: { case: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const profile = await this.getLawyerProfile(userId);
    if (doc.case.lawyerId !== profile.id) throw new ForbiddenException();

    return this.prisma.caseDocument.update({
      where: { id: docId },
      data: { isSharedWithClient: !doc.isSharedWithClient },
    });
  }

  async remove(userId: number, docId: number) {
    const doc = await this.prisma.caseDocument.findUnique({
      where: { id: docId },
      include: { case: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const profile = await this.getLawyerProfile(userId);
    if (doc.case.lawyerId !== profile.id) throw new ForbiddenException();

    await this.prisma.caseDocument.delete({ where: { id: docId } });
    return { success: true };
  }

  async requestSignature(userId: number, docId: number, dto: RequestSignatureDto) {
    const doc = await this.prisma.caseDocument.findUnique({
      where: { id: docId },
      include: { case: true },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const profile = await this.getLawyerProfile(userId);
    if (doc.case.lawyerId !== profile.id) throw new ForbiddenException();

    // Check target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.requestedToUserId },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');

    // Check no pending request already exists
    const existing = await this.prisma.eSignatureRequest.findFirst({
      where: { documentId: docId, requestedToId: dto.requestedToUserId, status: 'PENDING' },
    });
    if (existing) throw new BadRequestException('A pending signature request already exists');

    const sigRequest = await this.prisma.eSignatureRequest.create({
      data: {
        documentId: docId,
        requestedById: userId,
        requestedToId: dto.requestedToUserId,
        status: 'PENDING',
      },
    });

    // Notify target
    if (targetUser.fcmToken) {
      await this.notifications.sendPushNotification(
        targetUser.fcmToken,
        '✍️ Signature Required',
        `Please sign: ${doc.title}`,
        { type: 'SIGNATURE_REQUEST', signatureRequestId: String(sigRequest.id), documentId: String(docId) },
      );
    }

    return sigRequest;
  }

  async signDocument(userId: number, requestId: number, dto: SignDocumentDto) {
    const request = await this.prisma.eSignatureRequest.findUnique({
      where: { id: requestId },
      include: { document: true },
    });
    if (!request) throw new NotFoundException('Signature request not found');
    if (request.requestedToId !== userId) throw new ForbiddenException();
    if (request.status !== 'PENDING') throw new BadRequestException('Request is no longer pending');

    return this.prisma.eSignatureRequest.update({
      where: { id: requestId },
      data: {
        status: 'SIGNED',
        signatureImageUrl: dto.signatureImageUrl,
        signedAt: new Date(),
      },
    });
  }

  async declineSignature(userId: number, requestId: number, dto: DeclineSignatureDto) {
    const request = await this.prisma.eSignatureRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Signature request not found');
    if (request.requestedToId !== userId) throw new ForbiddenException();
    if (request.status !== 'PENDING') throw new BadRequestException('Request is no longer pending');

    return this.prisma.eSignatureRequest.update({
      where: { id: requestId },
      data: { status: 'DECLINED', declinedReason: dto.reason },
    });
  }

  async getMySignatureRequests(userId: number) {
    return this.prisma.eSignatureRequest.findMany({
      where: { requestedToId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: { id: true, title: true, fileUrl: true, category: true },
        },
        requestedBy: { select: { id: true } },
      },
    });
  }
}
