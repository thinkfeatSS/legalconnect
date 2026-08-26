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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const documents_service_1 = require("./documents.service");
const document_dto_1 = require("./dto/document.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let DocumentsController = class DocumentsController {
    documentsService;
    constructor(documentsService) {
        this.documentsService = documentsService;
    }
    upload(user, file, caseId, title, category, description) {
        return this.documentsService.upload(user.id, caseId, file, title, category, description);
    }
    findByCaseId(user, caseId) {
        return this.documentsService.findByCaseId(user.id, user.role, caseId);
    }
    update(user, id, dto) {
        return this.documentsService.update(user.id, id, dto);
    }
    toggleShare(user, id) {
        return this.documentsService.toggleShare(user.id, id);
    }
    remove(user, id) {
        return this.documentsService.remove(user.id, id);
    }
    requestSignature(user, id, dto) {
        return this.documentsService.requestSignature(user.id, id, dto);
    }
    getMySignatureRequests(user) {
        return this.documentsService.getMySignatureRequests(user.id);
    }
    signDocument(user, id, dto) {
        return this.documentsService.signDocument(user.id, id, dto);
    }
    declineSignature(user, id, dto) {
        return this.documentsService.declineSignature(user.id, id, dto);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('caseId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('title')),
    __param(4, (0, common_1.Query)('category')),
    __param(5, (0, common_1.Query)('description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, String, String, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('case/:caseId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('caseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findByCaseId", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, document_dto_1.UpdateDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Post)(':id/share'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "toggleShare", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.LAWYER),
    (0, common_1.Post)(':id/sign-request'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, document_dto_1.RequestSignatureDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "requestSignature", null);
__decorate([
    (0, common_1.Get)('signature-requests/my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getMySignatureRequests", null);
__decorate([
    (0, common_1.Post)('signature-requests/:id/sign'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, document_dto_1.SignDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "signDocument", null);
__decorate([
    (0, common_1.Post)('signature-requests/:id/decline'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, document_dto_1.DeclineSignatureDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "declineSignature", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
