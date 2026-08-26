"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FirmService = class FirmService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const existing = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
        if (existing)
            throw new common_1.BadRequestException('You already own a firm');
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
        const lawyerProfile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (lawyerProfile) {
            await this.prisma.firmMember.create({
                data: { firmId: firm.id, lawyerId: lawyerProfile.id, role: 'OWNER' },
            });
        }
        return firm;
    }
    async getMyFirm(userId) {
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
            const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
            if (!profile)
                throw new common_1.NotFoundException('No firm found');
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
            if (!membership)
                throw new common_1.NotFoundException('You are not a member of any firm');
            return { ...membership.firm, myRole: membership.role };
        }
        return { ...firm, myRole: 'OWNER' };
    }
    async update(userId, dto) {
        const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
        if (!firm)
            throw new common_1.NotFoundException('Firm not found');
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
    async inviteMember(userId, dto) {
        const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
        if (!firm)
            throw new common_1.NotFoundException('You do not own a firm');
        const lawyer = await this.prisma.lawyerProfile.findUnique({
            where: { id: dto.lawyerProfileId },
        });
        if (!lawyer)
            throw new common_1.NotFoundException('Lawyer profile not found');
        const existing = await this.prisma.firmMember.findUnique({
            where: { firmId_lawyerId: { firmId: firm.id, lawyerId: lawyer.id } },
        });
        if (existing)
            throw new common_1.BadRequestException('Lawyer is already a member');
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
    async removeMember(userId, memberId) {
        const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
        if (!firm)
            throw new common_1.NotFoundException('You do not own a firm');
        const member = await this.prisma.firmMember.findUnique({ where: { id: memberId } });
        if (!member || member.firmId !== firm.id)
            throw new common_1.NotFoundException('Member not found');
        if (member.role === 'OWNER')
            throw new common_1.ForbiddenException('Cannot remove the firm owner');
        await this.prisma.firmMember.delete({ where: { id: memberId } });
        return { success: true };
    }
    async updateMemberRole(userId, memberId, dto) {
        const firm = await this.prisma.lawFirm.findUnique({ where: { ownerId: userId } });
        if (!firm)
            throw new common_1.NotFoundException('You do not own a firm');
        const member = await this.prisma.firmMember.findUnique({ where: { id: memberId } });
        if (!member || member.firmId !== firm.id)
            throw new common_1.NotFoundException('Member not found');
        if (dto.role === 'OWNER')
            throw new common_1.ForbiddenException('Cannot assign OWNER role this way');
        return this.prisma.firmMember.update({
            where: { id: memberId },
            data: { role: dto.role },
            include: {
                lawyer: { select: { id: true, fullName: true } },
            },
        });
    }
};
exports.FirmService = FirmService;
exports.FirmService = FirmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FirmService);
