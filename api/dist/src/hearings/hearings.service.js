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
var HearingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HearingsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const calendar_1 = require("@googleapis/calendar");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("@nestjs/config");
const common_2 = require("@nestjs/common");
let HearingsService = HearingsService_1 = class HearingsService {
    prisma;
    notifications;
    config;
    logger = new common_2.Logger(HearingsService_1.name);
    constructor(prisma, notifications, config) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.config = config;
    }
    async getLawyerProfile(userId) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Lawyer profile not found');
        return profile;
    }
    async verifyCaseOwnership(lawyerId, caseId) {
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.lawyerId !== lawyerId)
            throw new common_1.ForbiddenException();
        return caseRecord;
    }
    async create(userId, dto) {
        const profile = await this.getLawyerProfile(userId);
        const caseRecord = await this.verifyCaseOwnership(profile.id, dto.caseId);
        const hearing = await this.prisma.hearingEntry.create({
            data: {
                caseId: dto.caseId,
                hearingDate: new Date(dto.hearingDate),
                courtRoom: dto.courtRoom,
                judge: dto.judge,
                status: 'SCHEDULED',
            },
            include: { case: { select: { title: true, caseNumber: true } } },
        });
        await this.prisma.case.update({
            where: { id: dto.caseId },
            data: { status: 'HEARING_SCHEDULED' },
        });
        if (profile.googleAccessToken) {
            try {
                const eventId = await this.createCalendarEvent(hearing, caseRecord, profile);
                await this.prisma.hearingEntry.update({
                    where: { id: hearing.id },
                    data: { googleCalendarEventId: eventId },
                });
            }
            catch (e) {
                this.logger.warn(`Calendar sync failed for hearing ${hearing.id}: ${e.message}`);
            }
        }
        return hearing;
    }
    async findByCaseId(userId, caseId) {
        const profile = await this.getLawyerProfile(userId);
        await this.verifyCaseOwnership(profile.id, caseId);
        return this.prisma.hearingEntry.findMany({
            where: { caseId },
            orderBy: { hearingDate: 'desc' },
        });
    }
    async getUpcoming(userId, days = 7) {
        const profile = await this.getLawyerProfile(userId);
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + days);
        return this.prisma.hearingEntry.findMany({
            where: {
                case: { lawyerId: profile.id },
                hearingDate: { gte: now, lte: future },
                status: { in: ['SCHEDULED', 'PART_HEARD'] },
            },
            orderBy: { hearingDate: 'asc' },
            include: {
                case: { select: { id: true, title: true, caseNumber: true, courtName: true } },
            },
        });
    }
    async update(userId, hearingId, dto) {
        const profile = await this.getLawyerProfile(userId);
        const hearing = await this.prisma.hearingEntry.findUnique({
            where: { id: hearingId },
            include: { case: true },
        });
        if (!hearing)
            throw new common_1.NotFoundException('Hearing not found');
        if (hearing.case.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        return this.prisma.hearingEntry.update({
            where: { id: hearingId },
            data: {
                hearingDate: dto.hearingDate ? new Date(dto.hearingDate) : undefined,
                courtRoom: dto.courtRoom,
                judge: dto.judge,
                status: dto.status,
                outcome: dto.outcome,
                orderText: dto.orderText,
                orderDocUrl: dto.orderDocUrl,
            },
        });
    }
    async adjourn(userId, hearingId, dto) {
        const profile = await this.getLawyerProfile(userId);
        const hearing = await this.prisma.hearingEntry.findUnique({
            where: { id: hearingId },
            include: { case: true },
        });
        if (!hearing)
            throw new common_1.NotFoundException('Hearing not found');
        if (hearing.case.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        const [updatedHearing, nextHearing] = await this.prisma.$transaction([
            this.prisma.hearingEntry.update({
                where: { id: hearingId },
                data: {
                    status: 'ADJOURNED',
                    nextHearingDate: new Date(dto.nextHearingDate),
                    outcome: dto.outcome,
                },
            }),
            this.prisma.hearingEntry.create({
                data: {
                    caseId: hearing.caseId,
                    hearingDate: new Date(dto.nextHearingDate),
                    courtRoom: dto.courtRoom ?? hearing.courtRoom,
                    judge: dto.judge ?? hearing.judge,
                    status: 'SCHEDULED',
                },
            }),
        ]);
        return { updatedHearing, nextHearing };
    }
    async remove(userId, hearingId) {
        const profile = await this.getLawyerProfile(userId);
        const hearing = await this.prisma.hearingEntry.findUnique({
            where: { id: hearingId },
            include: { case: true },
        });
        if (!hearing)
            throw new common_1.NotFoundException('Hearing not found');
        if (hearing.case.lawyerId !== profile.id)
            throw new common_1.ForbiddenException();
        await this.prisma.hearingEntry.delete({ where: { id: hearingId } });
        return { success: true };
    }
    async sendHearingReminders() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayStart = new Date(tomorrow.setHours(0, 0, 0, 0));
        const dayEnd = new Date(tomorrow.setHours(23, 59, 59, 999));
        const hearings = await this.prisma.hearingEntry.findMany({
            where: {
                hearingDate: { gte: dayStart, lte: dayEnd },
                status: { in: ['SCHEDULED', 'PART_HEARD'] },
            },
            include: {
                case: {
                    include: {
                        lawyer: {
                            include: { user: { select: { fcmToken: true } } },
                        },
                    },
                },
            },
        });
        for (const hearing of hearings) {
            const fcmToken = hearing.case.lawyer.user.fcmToken;
            if (!fcmToken)
                continue;
            await this.notifications.sendPushNotification(fcmToken, '⚖️ Hearing Tomorrow', `Case: ${hearing.case.title} — ${hearing.case.courtName ?? hearing.courtRoom ?? 'Court'}`, { type: 'HEARING_REMINDER', hearingId: String(hearing.id), caseId: String(hearing.caseId) });
        }
        this.logger.log(`Sent ${hearings.length} hearing reminder(s)`);
    }
    async createCalendarEvent(hearing, caseRecord, profile) {
        const auth = new google_auth_library_1.OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'), this.config.get('GOOGLE_CLIENT_SECRET'));
        auth.setCredentials({
            access_token: profile.googleAccessToken,
            refresh_token: profile.googleRefreshToken,
        });
        const cal = (0, calendar_1.calendar)({ version: 'v3', auth });
        const start = new Date(hearing.hearingDate);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const event = await cal.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: `Hearing: ${caseRecord.title}`,
                description: `Case #${caseRecord.caseNumber}\nCourt: ${caseRecord.courtName ?? 'N/A'}`,
                start: { dateTime: start.toISOString() },
                end: { dateTime: end.toISOString() },
            },
        });
        return event.data.id ?? '';
    }
};
exports.HearingsService = HearingsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HearingsService.prototype, "sendHearingReminders", null);
exports.HearingsService = HearingsService = HearingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], HearingsService);
