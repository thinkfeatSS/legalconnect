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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
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
    async getOverview(userId) {
        const profile = await this.getLawyerProfile(userId);
        const lawyerId = profile.id;
        const now = new Date();
        const [totalCases, openCases, closedCases, totalHearings, upcomingHearings, totalClients, totalDocuments, pendingSignatures, totalAppointments, completedAppointments,] = await Promise.all([
            this.prisma.case.count({ where: { lawyerId } }),
            this.prisma.case.count({ where: { lawyerId, status: { in: ['OPEN', 'IN_PROGRESS', 'HEARING_SCHEDULED'] } } }),
            this.prisma.case.count({ where: { lawyerId, status: { in: ['CLOSED', 'STAYED', 'APPEALED'] } } }),
            this.prisma.hearingEntry.count({ where: { case: { lawyerId } } }),
            this.prisma.hearingEntry.count({
                where: {
                    case: { lawyerId },
                    hearingDate: { gte: now },
                    status: { in: ['SCHEDULED', 'PART_HEARD'] },
                },
            }),
            this.prisma.case.findMany({
                where: { lawyerId, clientId: { not: null } },
                select: { clientId: true },
                distinct: ['clientId'],
            }).then((r) => r.length),
            this.prisma.caseDocument.count({ where: { case: { lawyerId } } }),
            this.prisma.eSignatureRequest.count({
                where: { requestedById: userId, status: 'PENDING' },
            }),
            this.prisma.appointment.count({ where: { lawyerId } }),
            this.prisma.appointment.count({ where: { lawyerId, status: 'COMPLETED' } }),
        ]);
        return {
            totalCases,
            openCases,
            closedCases,
            totalHearings,
            upcomingHearings,
            totalClients,
            totalDocuments,
            pendingSignatures,
            totalAppointments,
            completedAppointments,
            avgRating: profile.avgRating,
            totalReviews: profile.totalReviews,
        };
    }
    async getCasesByType(userId) {
        const profile = await this.getLawyerProfile(userId);
        const results = await this.prisma.case.groupBy({
            by: ['caseType'],
            where: { lawyerId: profile.id },
            _count: { caseType: true },
        });
        return results.map((r) => ({
            caseType: r.caseType,
            count: r._count.caseType,
        }));
    }
    async getCaseStatusDistribution(userId) {
        const profile = await this.getLawyerProfile(userId);
        const results = await this.prisma.case.groupBy({
            by: ['status'],
            where: { lawyerId: profile.id },
            _count: { status: true },
        });
        return results.map((r) => ({
            status: r.status,
            count: r._count.status,
        }));
    }
    async getHearingsThisMonth(userId) {
        const profile = await this.getLawyerProfile(userId);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const hearings = await this.prisma.hearingEntry.findMany({
            where: {
                case: { lawyerId: profile.id },
                hearingDate: { gte: monthStart, lte: monthEnd },
            },
            orderBy: { hearingDate: 'asc' },
            include: {
                case: { select: { id: true, title: true, caseNumber: true } },
            },
        });
        const held = hearings.filter((h) => h.status === 'HELD').length;
        const adjourned = hearings.filter((h) => h.status === 'ADJOURNED').length;
        const scheduled = hearings.filter((h) => h.status === 'SCHEDULED').length;
        return {
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            total: hearings.length,
            held,
            adjourned,
            scheduled,
            hearings,
        };
    }
    async getRecentActivity(userId, limit = 10) {
        const profile = await this.getLawyerProfile(userId);
        const [recentCases, recentHearings, recentDocs, recentAppointments] = await Promise.all([
            this.prisma.case.findMany({
                where: { lawyerId: profile.id },
                orderBy: { updatedAt: 'desc' },
                take: limit,
                select: { id: true, title: true, status: true, updatedAt: true, caseType: true },
            }),
            this.prisma.hearingEntry.findMany({
                where: { case: { lawyerId: profile.id } },
                orderBy: { updatedAt: 'desc' },
                take: limit,
                include: { case: { select: { title: true } } },
            }),
            this.prisma.caseDocument.findMany({
                where: { case: { lawyerId: profile.id } },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: { id: true, title: true, category: true, createdAt: true, caseId: true },
            }),
            this.prisma.appointment.findMany({
                where: { lawyerId: profile.id },
                orderBy: { updatedAt: 'desc' },
                take: limit,
                include: { client: { select: { fullName: true } } },
            }),
        ]);
        const activity = [
            ...recentCases.map((c) => ({
                type: 'CASE_UPDATE',
                date: c.updatedAt,
                title: `Case updated: ${c.title}`,
                meta: { caseId: c.id, status: c.status },
            })),
            ...recentHearings.map((h) => ({
                type: 'HEARING_UPDATE',
                date: h.updatedAt,
                title: `Hearing ${h.status.toLowerCase()}: ${h.case.title}`,
                meta: { hearingId: h.id, caseId: h.caseId, status: h.status },
            })),
            ...recentDocs.map((d) => ({
                type: 'DOCUMENT_ADDED',
                date: d.createdAt,
                title: `Document uploaded: ${d.title}`,
                meta: { documentId: d.id, caseId: d.caseId, category: d.category },
            })),
            ...recentAppointments.map((a) => ({
                type: 'APPOINTMENT_UPDATE',
                date: a.updatedAt,
                title: `Appointment with ${a.client.fullName}: ${a.status}`,
                meta: { appointmentId: a.id, status: a.status },
            })),
        ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);
        return activity;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
