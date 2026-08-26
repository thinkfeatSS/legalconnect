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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
let ClientsService = class ClientsService {
    prisma;
    uploads;
    constructor(prisma, uploads) {
        this.prisma = prisma;
        this.uploads = uploads;
    }
    async getMyProfile(userId) {
        const profile = await this.prisma.clientProfile.findUnique({
            where: { userId },
            include: { user: { select: { email: true, phone: true } } },
        });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return profile;
    }
    async updateProfile(userId, data) {
        return this.prisma.clientProfile.update({
            where: { userId },
            data,
        });
    }
    async uploadPhoto(userId, file) {
        const result = await this.uploads.uploadFile(file, 'legalconnect/clients');
        await this.prisma.clientProfile.update({
            where: { userId },
            data: { photoUrl: result.secure_url },
        });
        return { photoUrl: result.secure_url };
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], ClientsService);
