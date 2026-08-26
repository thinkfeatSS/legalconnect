import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getEvents(userId: number, startDate: string, endDate: string) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Lawyer profile not found');

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
        type: 'HEARING' as const,
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
        type: 'APPOINTMENT' as const,
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
        type: d.type === 'REMINDER' ? ('REMINDER' as const) : ('TASK' as const),
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
}
