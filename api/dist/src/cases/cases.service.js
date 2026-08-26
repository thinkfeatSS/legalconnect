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
exports.CasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CasesService = class CasesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLawyerProfile(userId) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Lawyer profile not found');
        return profile;
    }
    async create(userId, dto) {
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
                plaintiff: dto.plaintiff,
                defendant: dto.defendant,
                opposingCounsel: dto.opposingCounsel,
                retainerAmount: dto.retainerAmount ? dto.retainerAmount : undefined,
                notes: dto.notes,
            },
            include: {
                client: { select: { id: true, fullName: true, photoUrl: true } },
                firm: { select: { id: true, name: true } },
            },
        });
    }
    async findAll(userId, filters) {
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
    async findOne(userId, caseId) {
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
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        return caseRecord;
    }
    async findForClient(userId) {
        const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Client profile not found');
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
    async getTimeline(userId, caseId) {
        const profile = await this.getLawyerProfile(userId);
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
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
            ...hearings.map((h) => ({ type: 'HEARING', date: h.hearingDate, data: h })),
            ...documents.map((d) => ({ type: 'DOCUMENT', date: d.createdAt, data: d })),
            ...diaryEntries.map((e) => ({ type: 'DIARY', date: e.createdAt, data: e })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return timeline;
    }
    async update(userId, caseId, dto) {
        const profile = await this.getLawyerProfile(userId);
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
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
                plaintiff: dto.plaintiff,
                defendant: dto.defendant,
                opposingCounsel: dto.opposingCounsel,
                retainerAmount: dto.retainerAmount ? dto.retainerAmount : undefined,
                notes: dto.notes,
            },
            include: {
                client: { select: { id: true, fullName: true, photoUrl: true } },
                firm: { select: { id: true, name: true } },
            },
        });
    }
    async remove(userId, caseId) {
        const profile = await this.getLawyerProfile(userId);
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        return this.prisma.case.update({
            where: { id: caseId },
            data: { status: 'CLOSED' },
        });
    }
};
exports.CasesService = CasesService;
exports.CasesService = CasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CasesService);
