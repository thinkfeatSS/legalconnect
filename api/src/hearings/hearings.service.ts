import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateHearingDto, UpdateHearingDto, AdjournHearingDto } from './dto/hearing.dto';
import { calendar } from '@googleapis/calendar';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class HearingsService {
  private readonly logger = new Logger(HearingsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {}

  private async getLawyerProfile(userId: number) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Lawyer profile not found');
    return profile;
  }

  private async verifyCaseOwnership(lawyerId: number, caseId: number) {
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.lawyerId !== lawyerId) throw new ForbiddenException();
    return caseRecord;
  }

  async create(userId: number, dto: CreateHearingDto) {
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

    // Update case status to HEARING_SCHEDULED
    await this.prisma.case.update({
      where: { id: dto.caseId },
      data: { status: 'HEARING_SCHEDULED' },
    });

    // Sync to Google Calendar if lawyer has tokens
    if (profile.googleAccessToken) {
      try {
        const eventId = await this.createCalendarEvent(hearing, caseRecord, profile);
        await this.prisma.hearingEntry.update({
          where: { id: hearing.id },
          data: { googleCalendarEventId: eventId },
        });
      } catch (e) {
        this.logger.warn(`Calendar sync failed for hearing ${hearing.id}: ${e.message}`);
      }
    }

    return hearing;
  }

  async findByCaseId(userId: number, caseId: number) {
    const profile = await this.getLawyerProfile(userId);
    await this.verifyCaseOwnership(profile.id, caseId);

    return this.prisma.hearingEntry.findMany({
      where: { caseId },
      orderBy: { hearingDate: 'desc' },
    });
  }

  async getUpcoming(userId: number, days = 7) {
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

  async update(userId: number, hearingId: number, dto: UpdateHearingDto) {
    const profile = await this.getLawyerProfile(userId);
    const hearing = await this.prisma.hearingEntry.findUnique({
      where: { id: hearingId },
      include: { case: true },
    });
    if (!hearing) throw new NotFoundException('Hearing not found');
    if (hearing.case.lawyerId !== profile.id) throw new ForbiddenException();

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

  async adjourn(userId: number, hearingId: number, dto: AdjournHearingDto) {
    const profile = await this.getLawyerProfile(userId);
    const hearing = await this.prisma.hearingEntry.findUnique({
      where: { id: hearingId },
      include: { case: true },
    });
    if (!hearing) throw new NotFoundException('Hearing not found');
    if (hearing.case.lawyerId !== profile.id) throw new ForbiddenException();

    // Mark current hearing as adjourned
    const [updatedHearing, nextHearing] = await this.prisma.$transaction([
      this.prisma.hearingEntry.update({
        where: { id: hearingId },
        data: {
          status: 'ADJOURNED',
          nextHearingDate: new Date(dto.nextHearingDate),
          outcome: dto.outcome,
        },
      }),
      // Auto-create the next hearing
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

  async remove(userId: number, hearingId: number) {
    const profile = await this.getLawyerProfile(userId);
    const hearing = await this.prisma.hearingEntry.findUnique({
      where: { id: hearingId },
      include: { case: true },
    });
    if (!hearing) throw new NotFoundException('Hearing not found');
    if (hearing.case.lawyerId !== profile.id) throw new ForbiddenException();

    await this.prisma.hearingEntry.delete({ where: { id: hearingId } });
    return { success: true };
  }

  /** Cron job: fires every day at 8 AM — notifies lawyers about tomorrow's hearings */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
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
      if (!fcmToken) continue;
      await this.notifications.sendPushNotification(
        fcmToken,
        '⚖️ Hearing Tomorrow',
        `Case: ${hearing.case.title} — ${hearing.case.courtName ?? hearing.courtRoom ?? 'Court'}`,
        { type: 'HEARING_REMINDER', hearingId: String(hearing.id), caseId: String(hearing.caseId) },
      );
    }

    this.logger.log(`Sent ${hearings.length} hearing reminder(s)`);
  }

  private async createCalendarEvent(
    hearing: any,
    caseRecord: any,
    profile: any,
  ): Promise<string> {
    const auth = new OAuth2Client(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
    );
    auth.setCredentials({
      access_token: profile.googleAccessToken,
      refresh_token: profile.googleRefreshToken,
    });

    const cal = calendar({ version: 'v3', auth });
    const start = new Date(hearing.hearingDate);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour

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
}
