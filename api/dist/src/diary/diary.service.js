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
exports.DiaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const calendar_1 = require("@googleapis/calendar");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("@nestjs/config");
let DiaryService = class DiaryService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async getEntries(userId, type, status) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return this.prisma.diaryEntry.findMany({
            where: { lawyerId: profile.id, type, status },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getEntry(userId, entryId) {
        const entry = await this.prisma.diaryEntry.findUnique({ where: { id: entryId } });
        if (!entry)
            throw new common_1.NotFoundException('Entry not found');
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (entry.lawyerId !== profile?.id)
            throw new common_1.ForbiddenException();
        return entry;
    }
    async create(userId, dto) {
        const profile = await this.prisma.lawyerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        const entry = await this.prisma.diaryEntry.create({
            data: {
                lawyerId: profile.id,
                type: dto.type,
                title: dto.title,
                content: dto.content,
                hearingDate: dto.hearingDate ? new Date(dto.hearingDate) : undefined,
                reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : undefined,
                clientName: dto.clientName,
                courtName: dto.courtName,
                caseId: dto.caseId,
            },
        });
        if (dto.syncToCalendar && dto.hearingDate && profile.googleAccessToken) {
            try {
                const eventId = await this.createCalendarEvent(entry, profile);
                await this.prisma.diaryEntry.update({
                    where: { id: entry.id },
                    data: { googleCalendarEventId: eventId },
                });
            }
            catch (_) { }
        }
        return entry;
    }
    async update(userId, entryId, dto) {
        await this.getEntry(userId, entryId);
        const profile = await this.prisma.lawyerProfile.findUnique({
            where: { userId },
        });
        const updated = await this.prisma.diaryEntry.update({
            where: { id: entryId },
            data: {
                title: dto.title,
                content: dto.content,
                hearingDate: dto.hearingDate ? new Date(dto.hearingDate) : undefined,
                reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : undefined,
                status: dto.status,
                clientName: dto.clientName,
                courtName: dto.courtName,
                caseId: dto.caseId,
            },
        });
        if (dto.syncToCalendar && updated.hearingDate && profile?.googleAccessToken) {
            try {
                const eventId = await this.createCalendarEvent(updated, profile);
                await this.prisma.diaryEntry.update({
                    where: { id: entryId },
                    data: { googleCalendarEventId: eventId },
                });
            }
            catch (_) { }
        }
        return updated;
    }
    async delete(userId, entryId) {
        await this.getEntry(userId, entryId);
        await this.prisma.diaryEntry.delete({ where: { id: entryId } });
        return { success: true };
    }
    async createCalendarEvent(entry, profile) {
        const oauth2Client = new google_auth_library_1.OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'), this.config.get('GOOGLE_CLIENT_SECRET'));
        oauth2Client.setCredentials({
            access_token: profile.googleAccessToken,
            refresh_token: profile.googleRefreshToken,
        });
        const cal = (0, calendar_1.calendar)({ version: 'v3', auth: oauth2Client });
        const hearingDate = new Date(entry.hearingDate);
        const dateStr = hearingDate.toISOString().split('T')[0];
        const event = await cal.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: `Hearing: ${entry.title}`,
                description: `Court: ${entry.courtName ?? 'N/A'}\nClient: ${entry.clientName ?? 'N/A'}\n\n${entry.content ?? ''}`,
                start: { date: dateStr, timeZone: 'Asia/Karachi' },
                end: { date: dateStr, timeZone: 'Asia/Karachi' },
                reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] },
            },
        });
        return event.data.id ?? '';
    }
};
exports.DiaryService = DiaryService;
exports.DiaryService = DiaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], DiaryService);
