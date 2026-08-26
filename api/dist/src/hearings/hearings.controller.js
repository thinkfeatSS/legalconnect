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
exports.HearingsController = void 0;
const common_1 = require("@nestjs/common");
const hearings_service_1 = require("./hearings.service");
const hearing_dto_1 = require("./dto/hearing.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let HearingsController = class HearingsController {
    hearingsService;
    constructor(hearingsService) {
        this.hearingsService = hearingsService;
    }
    create(user, dto) {
        return this.hearingsService.create(user.id, dto);
    }
    getUpcoming(user, days) {
        return this.hearingsService.getUpcoming(user.id, days ? parseInt(days) : 7);
    }
    findByCaseId(user, caseId) {
        return this.hearingsService.findByCaseId(user.id, caseId);
    }
    update(user, id, dto) {
        return this.hearingsService.update(user.id, id, dto);
    }
    adjourn(user, id, dto) {
        return this.hearingsService.adjourn(user.id, id, dto);
    }
    remove(user, id) {
        return this.hearingsService.remove(user.id, id);
    }
};
exports.HearingsController = HearingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, hearing_dto_1.CreateHearingDto]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)('case/:caseId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('caseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "findByCaseId", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, hearing_dto_1.UpdateHearingDto]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/adjourn'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, hearing_dto_1.AdjournHearingDto]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "adjourn", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], HearingsController.prototype, "remove", null);
exports.HearingsController = HearingsController = __decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Controller)('hearings'),
    __metadata("design:paramtypes", [hearings_service_1.HearingsService])
], HearingsController);
