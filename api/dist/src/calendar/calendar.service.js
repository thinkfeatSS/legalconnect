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
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CalendarService = class CalendarService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEvents(userId, startDate, endDate) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Lawyer profile not found');
        const start = new Date(startDate);
        const end = new Date(endDate);
        const [hearings, appointments, diaryEntries] = await Promise.all([
            this.prisma.hearingEntry.findMany({
                where: {
                    case: { lawyerId: profile.id },
                    hearingDate: { gte: start, lte: end },
                },
                include: {
                    case: { select: { id: true, title: true, caseNumber: true, courtName: true } },
                },
                orderBy: { hearingDate: 'asc' },
            }),
            this.prisma.appointment.findMany({
                where: {
                    lawyerId: profile.id,
                    appointmentDate: { gte: start, lte: end },
                    status: { not: 'CANCELLED' },
                },
                include: {
                    client: { select: { id: true, fullName: true, photoUrl: true } },
                },
                orderBy: { appointmentDate: 'asc' },
            }),
            this.prisma.diaryEntry.findMany({
                where: {
                    lawyerId: profile.id,
                    OR: [
                        { hearingDate: { gte: start, lte: end } },
                        { reminderDate: { gte: start, lte: end } },
                    ],
                },
                orderBy: { hearingDate: 'asc' },
            }),
        ]);
        const events = [
            ...hearings.map((h) => ({
                id: `hearing-${h.id}`,
                type: 'HEARING',
                title: `Hearing: ${h.case.title}`,
                date: h.hearingDate,
                status: h.status,
                color: '#DC2626',
                meta: {
                    hearingId: h.id,
                    caseId: h.caseId,
                    caseTitle: h.case.title,
                    caseNumber: h.case.caseNumber,
                    courtName: h.case.courtName,
                    courtRoom: h.courtRoom,
                    judge: h.judge,
                },
            })),
            ...appointments.map((a) => ({
                id: `appointment-${a.id}`,
                type: 'APPOINTMENT',
                title: `Appointment: ${a.client.fullName}`,
                date: a.appointmentDate,
                status: a.status,
                color: '#2563EB',
                meta: {
                    appointmentId: a.id,
                    clientName: a.client.fullName,
                    clientPhoto: a.client.photoUrl,
                    startTime: a.startTime,
                    endTime: a.endTime,
                    appointmentType: a.type,
                    meetingLink: a.meetingLink,
                },
            })),
            ...diaryEntries.map((d) => ({
                id: `diary-${d.id}`,
                type: d.type === 'REMINDER' ? 'REMINDER' : 'TASK',
                title: d.title,
                date: d.hearingDate ?? d.reminderDate ?? d.createdAt,
                status: d.status,
                color: d.type === 'REMINDER' ? '#D97706' : '#16A34A',
                meta: {
                    diaryId: d.id,
                    diaryType: d.type,
                    content: d.content,
                    caseId: d.caseId,
                },
            })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return {
            startDate,
            endDate,
            totalEvents: events.length,
            events,
        };
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
