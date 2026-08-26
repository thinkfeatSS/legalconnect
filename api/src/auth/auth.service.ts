import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdateFcmTokenDto } from './dto/auth.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    const { passwordHash, ...result } = user;
    return result;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    if (dto.role === Role.LAWYER && !dto.barCouncilNumber) {
      throw new BadRequestException('Bar council number is required for lawyers');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        phone: dto.phone,
      },
    });

    if (dto.role === Role.LAWYER) {
      const lawyerProfile = await this.prisma.lawyerProfile.create({
        data: {
          userId: user.id,
          fullName: dto.fullName,
          barCouncilNumber: dto.barCouncilNumber ?? '',
          experienceYears: dto.experienceYears ?? 0,
          consultationFee: dto.consultationFee ?? 0,
          bio: dto.bio,
          cities: dto.cities ?? [],
        },
      });

      if (dto.specializationIds?.length) {
        await this.prisma.lawyerSpecialization.createMany({
          data: dto.specializationIds.map((id) => ({
            lawyerId: lawyerProfile.id,
            specializationId: id,
          })),
          skipDuplicates: true,
        });
      }
    } else {
      await this.prisma.clientProfile.create({
        data: { userId: user.id, fullName: dto.fullName },
      });
    }

    return this.signTokens(user.id, user.email, user.role);
  }

  async login(user: any) {
    return this.signTokens(user.id, user.email, user.role);
  }

  async updateFcmToken(userId: number, dto: UpdateFcmTokenDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: dto.fcmToken },
    });
    return { success: true };
  }

  private signTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload);
    return { accessToken, userId, role };
  }
}
