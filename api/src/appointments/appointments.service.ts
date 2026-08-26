import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AppointmentStatus } from '@prisma/client';
import { calendar } from '@googleapis/calendar';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {}

  async getAvailableSlots(lawyerId: number, date: string) {
    const dayOfWeek = new Date(date).getDay();

    const slots = await this.prisma.availabilitySlot.findMany({
      where: { lawyerId, dayOfWeek, isAvailable: true },
      orderBy: { startTime: 'asc' },
    });

    const booked = await this.prisma.appointment.findMany({
      where: {
        lawyerId,
        appointmentDate: new Date(date),
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
      select: { startTime: true },
    });

    const bookedTimes = new Set(booked.map((b) => b.startTime));
    return slots.filter((s) => !bookedTimes.has(s.startTime));
  }

  async book(clientUserId: number, dto: BookAppointmentDto) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: clientUserId },
    });
    if (!clientProfile) throw new NotFoundException('Client profile not found');

    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({
      where: { id: dto.lawyerId },
      include: { user: { select: { fcmToken: true } } },
    });
    if (!lawyerProfile) throw new NotFoundException('Lawyer not found');

    // Check slot is not already taken
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        lawyerId: dto.lawyerId,
        appointmentDate: new Date(dto.appointmentDate),
        startTime: dto.startTime,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    });
    if (conflict) throw new BadRequestException('Slot already booked');

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

    // Notify lawyer
    if (lawyerProfile.user?.fcmToken) {
      await this.notifications.sendPushNotification(
        lawyerProfile.user.fcmToken,
        'New Appointment Request',
        `${clientProfile.fullName} has requested an appointment on ${dto.appointmentDate} at ${dto.startTime}`,
        { type: 'APPOINTMENT_REQUEST', appointmentId: String(appointment.id) },
      );
    }

    return appointment;
  }

  async getClientAppointments(clientUserId: number) {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!profile) throw new NotFoundException('Client profile not found');

    return this.prisma.appointment.findMany({
      where: { clientId: profile.id },
      include: {
        lawyer: { select: { fullName: true, photoUrl: true, consultationFee: true } },
        review: { select: { id: true } },
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async getLawyerAppointments(lawyerUserId: number) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId: lawyerUserId } });
    if (!profile) throw new NotFoundException('Lawyer profile not found');

    return this.prisma.appointment.findMany({
      where: { lawyerId: profile.id },
      include: {
        client: { select: { fullName: true, photoUrl: true } },
      },
      orderBy: { appointmentDate: 'asc' },
    });
  }

  async updateStatus(appointmentId: number, userId: number, userRole: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        lawyer: { include: { user: { select: { fcmToken: true, id: true } } } },
        client: { include: { user: { select: { fcmToken: true, id: true } } } },
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const isLawyer = appointment.lawyer.user?.id === userId;

    if (dto.status === 'CONFIRMED' && !isLawyer) throw new ForbiddenException();
    if (dto.status === 'COMPLETED' && !isLawyer) throw new ForbiddenException();

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status as AppointmentStatus,
        meetingLink: dto.meetingLink,
      },
    });

    // Google Calendar sync on confirm — tokens are on LawyerProfile directly
    if (dto.status === 'CONFIRMED' && appointment.lawyer.googleAccessToken) {
      try {
        const eventId = await this.createCalendarEvent(appointment, appointment.lawyer);
        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { googleCalendarEventId: eventId },
        });
      } catch (_) {}
    }

    // Notify client
    const clientFcmToken = appointment.client.user?.fcmToken;
    if (clientFcmToken) {
      await this.notifications.sendPushNotification(
        clientFcmToken,
        `Appointment ${dto.status}`,
        `Your appointment on ${appointment.appointmentDate.toDateString()} has been ${dto.status.toLowerCase()}`,
        { type: 'APPOINTMENT_STATUS', appointmentId: String(appointmentId) },
      );
    }

    return updated;
  }

  private async createCalendarEvent(appointment: any, lawyerUser: any): Promise<string> {
    const oauth2Client = new OAuth2Client(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
    );
    oauth2Client.setCredentials({
      access_token: lawyerUser.googleAccessToken,
      refresh_token: lawyerUser.googleRefreshToken,
    });

    const cal = calendar({ version: 'v3', auth: oauth2Client });
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
}
