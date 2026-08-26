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
exports.FirmController = void 0;
const common_1 = require("@nestjs/common");
const firm_service_1 = require("./firm.service");
const firm_dto_1 = require("./dto/firm.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let FirmController = class FirmController {
    firmService;
    constructor(firmService) {
        this.firmService = firmService;
    }
    create(user, dto) {
        return this.firmService.create(user.id, dto);
    }
    getMyFirm(user) {
        return this.firmService.getMyFirm(user.id);
    }
    update(user, dto) {
        return this.firmService.update(user.id, dto);
    }
    inviteMember(user, dto) {
        return this.firmService.inviteMember(user.id, dto);
    }
    removeMember(user, memberId) {
        return this.firmService.removeMember(user.id, memberId);
    }
    updateMemberRole(user, memberId, dto) {
        return this.firmService.updateMemberRole(user.id, memberId, dto);
    }
};
exports.FirmController = FirmController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, firm_dto_1.CreateFirmDto]),
    __metadata("design:returntype", void 0)
], FirmController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FirmController.prototype, "getMyFirm", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, firm_dto_1.UpdateFirmDto]),
    __metadata("design:returntype", void 0)
], FirmController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('invite'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, firm_dto_1.InviteMemberDto]),
    __metadata("design:returntype", void 0)
], FirmController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Delete)('members/:memberId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], FirmController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Patch)('members/:memberId/role'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, firm_dto_1.UpdateMemberRoleDto]),
    __metadata("design:returntype", void 0)
], FirmController.prototype, "updateMemberRole", null);
exports.FirmController = FirmController = __decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Controller)('firm'),
    __metadata("design:paramtypes", [firm_service_1.FirmService])
], FirmController);
