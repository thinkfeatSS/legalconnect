import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiaryEntryDto, UpdateDiaryEntryDto } from './dto/diary.dto';
import { DiaryEntryType, DiaryStatus } from '@prisma/client';
import { calendar } from '@googleapis/calendar';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiaryService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getEntries(userId: number, type?: DiaryEntryType, status?: DiaryStatus) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.diaryEntry.findMany({
      where: { lawyerId: profile.id, type, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEntry(userId: number, entryId: number) {
    const entry = await this.prisma.diaryEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');

    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (entry.lawyerId !== profile?.id) throw new ForbiddenException();

    return entry;
  }

  async create(userId: number, dto: CreateDiaryEntryDto) {
    const profile = await this.prisma.lawyerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

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
      } catch (_) {}
    }

    return entry;
  }

  async update(userId: number, entryId: number, dto: UpdateDiaryEntryDto) {
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
      } catch (_) {}
    }

    return updated;
  }

  async delete(userId: number, entryId: number) {
    await this.getEntry(userId, entryId);
    await this.prisma.diaryEntry.delete({ where: { id: entryId } });
    return { success: true };
  }

  private async createCalendarEvent(entry: any, profile: { googleAccessToken: string | null; googleRefreshToken: string | null }): Promise<string> {
    const oauth2Client = new OAuth2Client(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
    );
    oauth2Client.setCredentials({
      access_token: profile.googleAccessToken,
      refresh_token: profile.googleRefreshToken,
    });

    const cal = calendar({ version: 'v3', auth: oauth2Client });
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
}
