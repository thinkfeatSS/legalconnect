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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const calendar_1 = require("@googleapis/calendar");
const google_auth_library_1 = require("google-auth-library");
const config_1 = require("@nestjs/config");
let AppointmentsService = class AppointmentsService {
    prisma;
    notifications;
    config;
    constructor(prisma, notifications, config) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.config = config;
    }
    async getAvailableSlots(lawyerId, date) {
        const dayOfWeek = new Date(date).getDay();
        const slots = await this.prisma.availabilitySlot.findMany({
            where: { lawyerId, dayOfWeek, isAvailable: true },
            orderBy: { startTime: 'asc' },
        });
        const booked = await this.prisma.appointment.findMany({
            where: {
                lawyerId,
                appointmentDate: new Date(date),
                status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED] },
            },
            select: { startTime: true },
        });
        const bookedTimes = new Set(booked.map((b) => b.startTime));
        return slots.filter((s) => !bookedTimes.has(s.startTime));
    }
    async book(clientUserId, dto) {
        const clientProfile = await this.prisma.clientProfile.findUnique({
            where: { userId: clientUserId },
        });
        if (!clientProfile)
            throw new common_1.NotFoundException('Client profile not found');
        const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
            where: { id: dto.lawyerId },
            include: { user: { select: { fcmToken: true } } },
        });
        if (!lawyerProfile)
            throw new common_1.NotFoundException('Lawyer not found');
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                lawyerId: dto.lawyerId,
                appointmentDate: new Date(dto.appointmentDate),
                startTime: dto.startTime,
                status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED] },
            },
        });
        if (conflict)
            throw new common_1.BadRequestException('Slot already booked');
        const appointment = await this.prisma.appointment.create({
            data: {
                clientId: clientProfile.id,
                lawyerId: dto.lawyerId,
                appointmentDate: new Date(dto.appointmentDate),
                startTime: dto.startTime,
                endTime: dto.endTime,
                type: dto.type,
                notes: dto.notes,
            },
        });
        if (lawyerProfile.user?.fcmToken) {
            await this.notifications.sendPushNotification(lawyerProfile.user.fcmToken, 'New Appointment Request', `${clientProfile.fullName} has requested an appointment on ${dto.appointmentDate} at ${dto.startTime}`, { type: 'APPOINTMENT_REQUEST', appointmentId: String(appointment.id) });
        }
        return appointment;
    }
    async getClientAppointments(clientUserId) {
        const profile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
        if (!profile)
            throw new common_1.NotFoundException('Client profile not found');
        return this.prisma.appointment.findMany({
            where: { clientId: profile.id },
            include: {
                lawyer: { select: { fullName: true, photoUrl: true, consultationFee: true } },
                review: { select: { id: true } },
            },
            orderBy: { appointmentDate: 'desc' },
        });
    }
    async getLawyerAppointments(lawyerUserId) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId: lawyerUserId } });
        if (!profile)
            throw new common_1.NotFoundException('Lawyer profile not found');
        return this.prisma.appointment.findMany({
            where: { lawyerId: profile.id },
            include: {
                client: { select: { fullName: true, photoUrl: true } },
            },
            orderBy: { appointmentDate: 'asc' },
        });
    }
    async updateStatus(appointmentId, userId, userRole, dto) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                lawyer: { include: { user: { select: { fcmToken: true, id: true } } } },
                client: { include: { user: { select: { fcmToken: true, id: true } } } },
            },
        });
        if (!appointment)
            throw new common_1.NotFoundException('Appointment not found');
        const isLawyer = appointment.lawyer.user?.id === userId;
        if (dto.status === 'CONFIRMED' && !isLawyer)
            throw new common_1.ForbiddenException();
        if (dto.status === 'COMPLETED' && !isLawyer)
            throw new common_1.ForbiddenException();
        const updated = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: dto.status,
                meetingLink: dto.meetingLink,
            },
        });
        if (dto.status === 'CONFIRMED' && appointment.lawyer.googleAccessToken) {
            try {
                const eventId = await this.createCalendarEvent(appointment, appointment.lawyer);
                await this.prisma.appointment.update({
                    where: { id: appointmentId },
                    data: { googleCalendarEventId: eventId },
                });
            }
            catch (_) { }
        }
        const clientFcmToken = appointment.client.user?.fcmToken;
        if (clientFcmToken) {
            await this.notifications.sendPushNotification(clientFcmToken, `Appointment ${dto.status}`, `Your appointment on ${appointment.appointmentDate.toDateString()} has been ${dto.status.toLowerCase()}`, { type: 'APPOINTMENT_STATUS', appointmentId: String(appointmentId) });
        }
        return updated;
    }
    async createCalendarEvent(appointment, lawyerUser) {
        const oauth2Client = new google_auth_library_1.OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'), this.config.get('GOOGLE_CLIENT_SECRET'));
        oauth2Client.setCredentials({
            access_token: lawyerUser.googleAccessToken,
            refresh_token: lawyerUser.googleRefreshToken,
        });
        const cal = (0, calendar_1.calendar)({ version: 'v3', auth: oauth2Client });
        const date = appointment.appointmentDate.toISOString().split('T')[0];
        const event = await cal.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: `Appointment with ${appointment.client.fullName}`,
                description: appointment.notes ?? '',
                start: { dateTime: `${date}T${appointment.startTime}:00`, timeZone: 'Asia/Karachi' },
                end: { dateTime: `${date}T${appointment.endTime}:00`, timeZone: 'Asia/Karachi' },
                conferenceData: appointment.meetingLink
                    ? undefined
                    : { createRequest: { requestId: `lc-${appointment.id}` } },
            },
            conferenceDataVersion: 1,
        });
        return event.data.id ?? '';
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], AppointmentsService);
