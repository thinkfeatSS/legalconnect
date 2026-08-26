import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { CaseStatus, CaseType } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  private async getLawyerProfile(userId: number) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Lawyer profile not found');
    return profile;
  }

  async create(userId: number, dto: CreateCaseDto) {
    const profile = await this.getLawyerProfile(userId);

    return this.prisma.case.create({
      data: {
        lawyerId: profile.id,
        caseNumber: dto.caseNumber,
        title: dto.title,
        description: dto.description,
        caseType: dto.caseType,
        status: dto.status,
        courtName: dto.courtName,
        courtCity: dto.courtCity,
        courtProvince: dto.courtProvince,
        courtType: dto.courtType,
        firNumber: dto.firNumber,
        filingDate: dto.filingDate ? new Date(dto.filingDate) : undefined,
        clientId: dto.clientId,
        plaintiff: dto.plaintiff as any,
        defendant: dto.defendant as any,
        opposingCounsel: dto.opposingCounsel as any,
        retainerAmount: dto.retainerAmount ? dto.retainerAmount : undefined,
        notes: dto.notes,
      },
      include: {
        client: { select: { id: true, fullName: true, photoUrl: true } },
        firm: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(
    userId: number,
    filters: { status?: CaseStatus; caseType?: CaseType; clientId?: number; page?: number; limit?: number },
  ) {
    const profile = await this.getLawyerProfile(userId);
    const { status, caseType, clientId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      lawyerId: profile.id,
      ...(status && { status }),
      ...(caseType && { caseType }),
      ...(clientId && { clientId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: { select: { id: true, fullName: true, photoUrl: true } },
          _count: { select: { hearings: true, documents: true } },
        },
      }),
      this.prisma.case.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(userId: number, caseId: number) {
    const profile = await this.getLawyerProfile(userId);
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: { select: { id: true, fullName: true, photoUrl: true } },
        firm: { select: { id: true, name: true } },
        hearings: { orderBy: { hearingDate: 'desc' } },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { uploadedBy: { select: { id: true } } },
        },
        _count: { select: { hearings: true, documents: true, diaryEntries: true } },
      },
    });

    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.lawyerId !== profile.id) throw new ForbiddenException();

    return caseRecord;
  }

  async findForClient(userId: number) {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Client profile not found');

    return this.prisma.case.findMany({
      where: { clientId: profile.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        lawyer: { select: { id: true, fullName: true, photoUrl: true } },
        hearings: {
          where: { status: { in: ['SCHEDULED', 'PART_HEARD'] } },
          orderBy: { hearingDate: 'asc' },
          take: 1,
        },
        _count: { select: { documents: true } },
      },
    });
  }

  async getTimeline(userId: number, caseId: number) {
    const profile = await this.getLawyerProfile(userId);
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.lawyerId !== profile.id) throw new ForbiddenException();

    const [hearings, documents, diaryEntries] = await Promise.all([
      this.prisma.hearingEntry.findMany({
        where: { caseId },
        orderBy: { hearingDate: 'desc' },
      }),
      this.prisma.caseDocument.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, category: true, createdAt: true, fileUrl: true },
      }),
      this.prisma.diaryEntry.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, type: true, status: true, createdAt: true },
      }),
    ]);

    const timeline = [
      ...hearings.map((h) => ({ type: 'HEARING' as const, date: h.hearingDate, data: h })),
      ...documents.map((d) => ({ type: 'DOCUMENT' as const, date: d.createdAt, data: d })),
      ...diaryEntries.map((e) => ({ type: 'DIARY' as const, date: e.createdAt, data: e })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  async update(userId: number, caseId: number, dto: UpdateCaseDto) {
    const profile = await this.getLawyerProfile(userId);
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.lawyerId !== profile.id) throw new ForbiddenException();

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        title: dto.title,
        description: dto.description,
        caseType: dto.caseType,
        status: dto.status,
        courtName: dto.courtName,
        courtCity: dto.courtCity,
        courtProvince: dto.courtProvince,
        courtType: dto.courtType,
        firNumber: dto.firNumber,
        filingDate: dto.filingDate ? new Date(dto.filingDate) : undefined,
        clientId: dto.clientId,
        plaintiff: dto.plaintiff as any,
        defendant: dto.defendant as any,
        opposingCounsel: dto.opposingCounsel as any,
        retainerAmount: dto.retainerAmount ? dto.retainerAmount : undefined,
        notes: dto.notes,
      },
      include: {
        client: { select: { id: true, fullName: true, photoUrl: true } },
        firm: { select: { id: true, name: true } },
      },
    });
  }

  async remove(userId: number, caseId: number) {
    const profile = await this.getLawyerProfile(userId);
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.lawyerId !== profile.id) throw new ForbiddenException();

    // Soft-close instead of hard delete
    return this.prisma.case.update({
      where: { id: caseId },
      data: { status: 'CLOSED' },
    });
  }
}
