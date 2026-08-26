import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
  ) {}

  async getMyProfile(userId: number) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, phone: true } } },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: number, data: { fullName?: string }) {
    return this.prisma.clientProfile.update({
      where: { userId },
      data,
    });
  }

  async uploadPhoto(userId: number, file: Express.Multer.File) {
    const result = await this.uploads.uploadFile(file, 'legalconnect/clients');
    await this.prisma.clientProfile.update({
      where: { userId },
      data: { photoUrl: result.secure_url },
    });
    return { photoUrl: result.secure_url };
  }
}
