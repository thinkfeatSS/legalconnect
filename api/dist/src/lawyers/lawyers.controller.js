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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawyersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const lawyers_service_1 = require("./lawyers.service");
const lawyer_dto_1 = require("./dto/lawyer.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let LawyersController = class LawyersController {
    lawyersService;
    constructor(lawyersService) {
        this.lawyersService = lawyersService;
    }
    getAllSpecializations() {
        return this.lawyersService.getAllSpecializations();
    }
    getMyProfile(user) {
        return this.lawyersService.getMyProfile(user.id);
    }
    updateProfile(user, dto) {
        return this.lawyersService.updateProfile(user.id, dto);
    }
    uploadPhoto(user, file) {
        return this.lawyersService.uploadPhoto(user.id, file);
    }
    uploadBarCouncilDoc(user, file) {
        return this.lawyersService.uploadBarCouncilDoc(user.id, file);
    }
    getMyAvailability(user) {
        return this.lawyersService.getMyAvailabilitySlots(user.id);
    }
    setAvailability(user, body) {
        return this.lawyersService.setAvailability(user.id, body.slots);
    }
    getProfile(id) {
        return this.lawyersService.getProfile(id);
    }
    getAvailability(id) {
        return this.lawyersService.getAvailability(id);
    }
};
exports.LawyersController = LawyersController;
__decorate([
    (0, common_1.Get)('specializations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "getAllSpecializations", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Patch)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, lawyer_dto_1.UpdateLawyerProfileDto]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Post)('me/photo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Post)('me/bar-council-doc'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "uploadBarCouncilDoc", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Get)('me/availability'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "getMyAvailability", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Post)('me/availability'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "setAvailability", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "getAvailability", null);
exports.LawyersController = LawyersController = __decorate([
    (0, common_1.Controller)('lawyers'),
    __metadata("design:paramtypes", [lawyers_service_1.LawyersService])
], LawyersController);
