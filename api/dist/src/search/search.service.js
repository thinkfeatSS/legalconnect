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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SearchService = class SearchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (dto.q) {
            where.OR = [
                { fullName: { contains: dto.q } },
                { bio: { contains: dto.q } },
                { specializations: { some: { specialization: { name: { contains: dto.q } } } } },
            ];
        }
        if (dto.city) {
            where.cities = { array_contains: dto.city };
        }
        if (dto.specialization) {
            where.specializations = {
                some: { specialization: { name: dto.specialization } },
            };
        }
        if (dto.minExperience !== undefined) {
            where.experienceYears = { ...where.experienceYears, gte: dto.minExperience };
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
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
