import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export class CreateReviewDto {
  @IsInt()
  @Type(() => Number)
  appointmentId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(clientUserId: number, dto: CreateReviewDto) {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) throw new NotFoundException('Client profile not found');

    const appointment = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.clientId !== clientProfile.id) throw new BadRequestException('Not your appointment');
    if (appointment.status !== AppointmentStatus.COMPLETED) throw new BadRequestException('Can only review completed appointments');

    const existing = await this.prisma.review.findUnique({ where: { appointmentId: dto.appointmentId } });
    if (existing) throw new BadRequestException('Already reviewed this appointment');

    const review = await this.prisma.review.create({
      data: {
        clientId: clientProfile.id,
        lawyerId: appointment.lawyerId,
        appointmentId: dto.appointmentId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    // Recalculate avgRating
    const stats = await this.prisma.review.aggregate({
      where: { lawyerId: appointment.lawyerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.lawyerProfile.update({
      where: { id: appointment.lawyerId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        totalReviews: stats._count.rating,
      },
    });

    return review;
  }

  async getLawyerReviews(lawyerId: number, page = 1, limit = 10) {
    return this.prisma.review.findMany({
      where: { lawyerId },
      include: { client: { select: { fullName: true, photoUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
