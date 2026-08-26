import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFirmDto,
  InviteMemberDto,
  UpdateFirmDto,
  UpdateMemberRoleDto,
} from './dto/firm.dto';

@Injectable()
export class FirmService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateFirmDto) {
    const existing = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
    if (existing) throw new BadRequestException('You already own a firm');

    const firm = await this.prisma.lawFirm.create({
      data: {
        ownerId: userId,
        name: dto.name,
        registrationNumber: dto.registrationNumber,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        phone: dto.phone,
      },
    });

    // Add owner as OWNER member
    const lawyerProfile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
    if (lawyerProfile) {
      await this.prisma.firmMember.create({
        data: { firmId: firm.id, lawyerId: lawyerProfile.id, role: 'OWNER' },
      });
    }

    return firm;
  }

  async getMyFirm(userId: number) {
    const firm = await this.prisma.lawFirm.findUnique({
      where: { ownerId: userId },
      include: {
        members: {
          include: {
            lawyer: {
              select: { id: true, fullName: true, photoUrl: true, experienceYears: true },
            },
          },
        },
      },
    });

    if (!firm) {
      // Check if user is a member of a firm
      const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
      if (!profile) throw new NotFoundException('No firm found');
      const membership = await this.prisma.firmMember.findFirst({
        where: { lawyerId: profile.id },
        include: {
          firm: {
            include: {
              members: {
                include: {
                  lawyer: {
                    select: { id: true, fullName: true, photoUrl: true, experienceYears: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!membership) throw new NotFoundException('You are not a member of any firm');
      return { ...membership.firm, myRole: membership.role };
    }

    return { ...firm, myRole: 'OWNER' };
  }

  async update(userId: number, dto: UpdateFirmDto) {
    const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
    if (!firm) throw new NotFoundException('Firm not found');

    return this.prisma.lawFirm.update({
      where: { id: firm.id },
      data: {
        name: dto.name,
        registrationNumber: dto.registrationNumber,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        phone: dto.phone,
      },
    });
  }

  async inviteMember(userId: number, dto: InviteMemberDto) {
    const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
    if (!firm) throw new NotFoundException('You do not own a firm');

    const lawyer = await this.prisma.lawyerProfile.findUnique({
      where: { id: dto.lawyerProfileId },
    });
    if (!lawyer) throw new NotFoundException('Lawyer profile not found');

    const existing = await this.prisma.firmMember.findUnique({
      where: { firmId_lawyerId: { firmId: firm.id, lawyerId: lawyer.id } },
    });
    if (existing) throw new BadRequestException('Lawyer is already a member');

    return this.prisma.firmMember.create({
      data: {
        firmId: firm.id,
        lawyerId: lawyer.id,
        role: dto.role ?? 'ASSOCIATE',
      },
      include: {
        lawyer: { select: { id: true, fullName: true, photoUrl: true } },
      },
    });
  }

  async removeMember(userId: number, memberId: number) {
    const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
    if (!firm) throw new NotFoundException('You do not own a firm');

    const member = await this.prisma.firmMember.findUnique({ where: { id: memberId } });
    if (!member || member.firmId !== firm.id) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove the firm owner');

    await this.prisma.firmMember.delete({ where: { id: memberId } });
    return { success: true };
  }

  async updateMemberRole(userId: number, memberId: number, dto: UpdateMemberRoleDto) {
    const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
    if (!firm) throw new NotFoundException('You do not own a firm');

    const member = await this.prisma.firmMember.findUnique({ where: { id: memberId } });
    if (!member || member.firmId !== firm.id) throw new NotFoundException('Member not found');
    if (dto.role === 'OWNER') throw new ForbiddenException('Cannot assign OWNER role this way');

    return this.prisma.firmMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        lawyer: { select: { id: true, fullName: true } },
      },
    });
  }
}
