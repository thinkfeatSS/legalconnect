"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let DocumentsService = class DocumentsService {
    prisma;
    uploads;
    notifications;
    constructor(prisma, uploads, notifications) {
        this.prisma = prisma;
        this.uploads = uploads;
        this.notifications = notifications;
    }
    async getLawyerProfile(userId) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Lawyer profile not found');
        return profile;
    }
    async verifyCaseAccess(userId, userRole, caseId) {
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (userRole === client_1.Role.LAWYER) {
            const profile = await this.getLawyerProfile(userId);
            if (caseRecord.lawyerId !== profile.id)
                throw new common_1.ForbiddenException();
        }
        else if (userRole === client_1.Role.CLIENT) {
            const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId } });
            if (!clientProfile || caseRecord.clientId !== clientProfile.id)
                throw new common_1.ForbiddenException();
        }
        return caseRecord;
    }
    async upload(userId, caseId, file, title, category = client_1.DocumentCategory.OTHER, description) {
        const profile = await this.getLawyerProfile(userId);
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
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
    async findByCaseId(userId, userRole, caseId) {
        await this.verifyCaseAccess(userId, userRole, caseId);
        const where = { caseId };
        if (userRole === client_1.Role.CLIENT) {
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
    async update(userId, docId, dto) {
        const doc = await this.prisma.caseDocument.findUnique({
            where: { id: docId },
            include: { case: true },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        const profile = await this.getLawyerProfile(userId);
        if (doc.case.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
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
    async toggleShare(userId, docId) {
        const doc = await this.prisma.caseDocument.findUnique({
            where: { id: docId },
            include: { case: true },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        const profile = await this.getLawyerProfile(userId);
        if (doc.case.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        return this.prisma.caseDocument.update({
            where: { id: docId },
            data: { isSharedWithClient: !doc.isSharedWithClient },
        });
    }
    async remove(userId, docId) {
        const doc = await this.prisma.caseDocument.findUnique({
            where: { id: docId },
            include: { case: true },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        const profile = await this.getLawyerProfile(userId);
        if (doc.case.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        await this.prisma.caseDocument.delete({ where: { id: docId } });
        return { success: true };
    }
    async requestSignature(userId, docId, dto) {
        const doc = await this.prisma.caseDocument.findUnique({
            where: { id: docId },
            include: { case: true },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        const profile = await this.getLawyerProfile(userId);
        if (doc.case.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        const targetUser = await this.prisma.user.findUnique({
            where: { id: dto.requestedToUserId },
        });
        if (!targetUser)
            throw new common_1.NotFoundException('Target user not found');
        const existing = await this.prisma.eSignatureRequest.findFirst({
            where: { documentId: docId, requestedToId: dto.requestedToUserId, status: 'PENDING' },
        });
        if (existing)
            throw new common_1.BadRequestException('A pending signature request already exists');
        const sigRequest = await this.prisma.eSignatureRequest.create({
            data: {
                documentId: docId,
                requestedById: userId,
                requestedToId: dto.requestedToUserId,
                status: 'PENDING',
            },
        });
        if (targetUser.fcmToken) {
            await this.notifications.sendPushNotification(targetUser.fcmToken, '✍️ Signature Required', `Please sign: ${doc.title}`, { type: 'SIGNATURE_REQUEST', signatureRequestId: String(sigRequest.id), documentId: String(docId) });
        }
        return sigRequest;
    }
    async signDocument(userId, requestId, dto) {
        const request = await this.prisma.eSignatureRequest.findUnique({
            where: { id: requestId },
            include: { document: true },
        });
        if (!request)
            throw new common_1.NotFoundException('Signature request not found');
        if (request.requestedToId !== userId)
            throw new common_1.ForbiddenException();
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Request is no longer pending');
        return this.prisma.eSignatureRequest.update({
            where: { id: requestId },
            data: {
                status: 'SIGNED',
                signatureImageUrl: dto.signatureImageUrl,
                signedAt: new Date(),
            },
        });
    }
    async declineSignature(userId, requestId, dto) {
        const request = await this.prisma.eSignatureRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Signature request not found');
        if (request.requestedToId !== userId)
            throw new common_1.ForbiddenException();
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Request is no longer pending');
        return this.prisma.eSignatureRequest.update({
            where: { id: requestId },
            data: { status: 'DECLINED', declinedReason: dto.reason },
        });
    }
    async getMySignatureRequests(userId) {
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
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService,
        notifications_service_1.NotificationsService])
], DocumentsService);
