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
exports.ReviewsService = exports.CreateReviewDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateReviewDto {
    appointmentId;
    rating;
    comment;
}
exports.CreateReviewDto = CreateReviewDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "appointmentId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "comment", void 0);
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(clientUserId, dto) {
        const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
        if (!clientProfile)
            throw new common_1.NotFoundException('Client profile not found');
        const appointment = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId } });
        if (!appointment)
            throw new common_1.NotFoundException('Appointment not found');
        if (appointment.clientId !== clientProfile.id)
            throw new common_1.BadRequestException('Not your appointment');
        if (appointment.status !== client_1.AppointmentStatus.COMPLETED)
            throw new common_1.BadRequestException('Can only review completed appointments');
        const existing = await this.prisma.review.findUnique({ where: { appointmentId: dto.appointmentId } });
        if (existing)
            throw new common_1.BadRequestException('Already reviewed this appointment');
        const review = await this.prisma.review.create({
            data: {
                clientId: clientProfile.id,
                lawyerId: appointment.lawyerId,
                appointmentId: dto.appointmentId,
                rating: dto.rating,
                comment: dto.comment,
            },
        });
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
    async getLawyerReviews(lawyerId, page = 1, limit = 10) {
        return this.prisma.review.findMany({
            where: { lawyerId },
            include: { client: { select: { fullName: true, photoUrl: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
