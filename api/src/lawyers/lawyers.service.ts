import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateLawyerProfileDto } from './dto/lawyer.dto';

@Injectable()
export class LawyersService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
  ) {}

  async getProfile(lawyerProfileId: number) {
    const profile = await this.prisma.lawyerProfile.findUnique({
      where: { id: lawyerProfileId },
      include: {
        specializations: { include: { specialization: true } },
        user: { select: { email: true, phone: true } },
        reviewsReceived: {
          include: { client: { select: { fullName: true, photoUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!profile) throw new NotFoundException('Lawyer not found');
    return profile;
  }

  async getMyProfile(userId: number) {
    const profile = await this.prisma.lawyerProfile.findUnique({
      where: { userId },
      include: {
        specializations: { include: { specialization: true } },
        user: { select: { email: true, phone: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: number, dto: UpdateLawyerProfileDto) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const updated = await this.prisma.lawyerProfile.update({
      where: { userId },
      data: {
        fullName: dto.fullName,
        bio: dto.bio,
        cities: dto.cities,
        experienceYears: dto.experienceYears,
        consultationFee: dto.consultationFee,
      },
    });

    if (dto.specializationIds !== undefined) {
      await this.prisma.lawyerSpecialization.deleteMany({ where: { lawyerId: profile.id } });
      if (dto.specializationIds.length) {
        await this.prisma.lawyerSpecialization.createMany({
          data: dto.specializationIds.map((id) => ({
            lawyerId: profile.id,
            specializationId: id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  }

  async uploadPhoto(userId: number, file: Express.Multer.File) {
    const result = await this.uploads.uploadFile(file, 'legalconnect/photos');
    const updated = await this.prisma.lawyerProfile.update({
      where: { userId },
      data: { photoUrl: result.secure_url },
    });
    return { photoUrl: result.secure_url };
  }

  async uploadBarCouncilDoc(userId: number, file: Express.Multer.File) {
    const result = await this.uploads.uploadFile(file, 'legalconnect/documents');
    await this.prisma.lawyerProfile.update({
      where: { userId },
      data: { barCouncilDocUrl: result.secure_url },
    });
    return { docUrl: result.secure_url };
  }

  async getAvailability(lawyerProfileId: number) {
    return this.prisma.availabilitySlot.findMany({
      where: { lawyerId: lawyerProfileId, isAvailable: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getMyAvailabilitySlots(userId: number) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.getAvailability(profile.id);
  }

  async setAvailability(userId: number, slots: { dayOfWeek: number; startTime: string; endTime: string }[]) {
    const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    await this.prisma.availabilitySlot.deleteMany({ where: { lawyerId: profile.id } });
    return this.prisma.availabilitySlot.createMany({
      data: slots.map((s) => ({ ...s, lawyerId: profile.id })),
    });
  }

  async getAllSpecializations() {
    return this.prisma.specialization.findMany({ orderBy: { name: 'asc' } });
  }
}
