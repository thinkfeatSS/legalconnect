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
exports.LawyersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let LawyersService = class LawyersService {
    prisma;
    uploads;
    constructor(prisma, uploads) {
        this.prisma = prisma;
        this.uploads = uploads;
    }
    async getProfile(lawyerProfileId) {
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
        if (!profile)
            throw new common_1.NotFoundException('Lawyer not found');
        return profile;
    }
    async getMyProfile(userId) {
        const profile = await this.prisma.lawyerProfile.findUnique({
            where: { userId },
            include: {
                specializations: { include: { specialization: true } },
                user: { select: { email: true, phone: true } },
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return profile;
    }
    async updateProfile(userId, dto) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
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
    async uploadPhoto(userId, file) {
        const result = await this.uploads.uploadFile(file, 'legalconnect/photos');
        const updated = await this.prisma.lawyerProfile.update({
            where: { userId },
            data: { photoUrl: result.secure_url },
        });
        return { photoUrl: result.secure_url };
    }
    async uploadBarCouncilDoc(userId, file) {
        const result = await this.uploads.uploadFile(file, 'legalconnect/documents');
        await this.prisma.lawyerProfile.update({
            where: { userId },
            data: { barCouncilDocUrl: result.secure_url },
        });
        return { docUrl: result.secure_url };
    }
    async getAvailability(lawyerProfileId) {
        return this.prisma.availabilitySlot.findMany({
            where: { lawyerId: lawyerProfileId, isAvailable: true },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }
    async getMyAvailabilitySlots(userId) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return this.getAvailability(profile.id);
    }
    async setAvailability(userId, slots) {
        const profile = await this.prisma.lawyerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        await this.prisma.availabilitySlot.deleteMany({ where: { lawyerId: profile.id } });
        return this.prisma.availabilitySlot.createMany({
            data: slots.map((s) => ({ ...s, lawyerId: profile.id })),
        });
    }
    async getAllSpecializations() {
        return this.prisma.specialization.findMany({ orderBy: { name: 'asc' } });
    }
};
exports.LawyersService = LawyersService;
exports.LawyersService = LawyersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], LawyersService);
