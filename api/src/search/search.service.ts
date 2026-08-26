import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LawyerSearchDto } from '../lawyers/dto/lawyer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(dto: LawyerSearchDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LawyerProfileWhereInput = {};

    if (dto.q) {
      where.OR = [
        { fullName: { contains: dto.q } },
        { bio: { contains: dto.q } },
        { specializations: { some: { specialization: { name: { contains: dto.q } } } } },
      ];
    }

    if (dto.city) {
      where.cities = { array_contains: dto.city } as Prisma.JsonFilter;
    }

    if (dto.specialization) {
      where.specializations = {
        some: { specialization: { name: dto.specialization } },
      };
    }

    if (dto.minExperience !== undefined) {
      where.experienceYears = { ...(where.experienceYears as object), gte: dto.minExperience };
    }

    if (dto.maxFee !== undefined) {
      where.consultationFee = { lte: dto.maxFee };
    }

    if (dto.minRating !== undefined) {
      where.avgRating = { gte: dto.minRating };
    }

    const [lawyers, total] = await Promise.all([
      this.prisma.lawyerProfile.findMany({
        where,
        orderBy: { avgRating: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          cities: true,
          experienceYears: true,
          consultationFee: true,
          avgRating: true,
          totalReviews: true,
          photoUrl: true,
          barCouncilNumber: true,
          specializations: { select: { specialization: { select: { name: true } } } },
        },
      }),
      this.prisma.lawyerProfile.count({ where }),
    ]);

    const hits = lawyers.map((l) => ({
      ...l,
      specializations: l.specializations.map((s) => s.specialization.name),
    }));

    return { hits, total, page, limit };
  }
}
