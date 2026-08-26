import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import {
  DeclineSignatureDto,
  RequestSignatureDto,
  SignDocumentDto,
  UpdateDocumentDto,
} from './dto/document.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentCategory, Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Roles(Role.LAWYER)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Query('caseId', ParseIntPipe) caseId: number,
    @Query('title') title: string,
    @Query('category') category?: DocumentCategory,
    @Query('description') description?: string,
  ) {
    return this.documentsService.upload(user.id, caseId, file, title, category, description);
  }

  @Get('case/:caseId')
  findByCaseId(
    @CurrentUser() user: any,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.documentsService.findByCaseId(user.id, user.role as Role, caseId);
  }

  @Roles(Role.LAWYER)
  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(user.id, id, dto);
  }

  @Roles(Role.LAWYER)
  @Post(':id/share')
  toggleShare(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.documentsService.toggleShare(user.id, id);
  }

  @Roles(Role.LAWYER)
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(user.id, id);
  }

  @Roles(Role.LAWYER)
  @Post(':id/sign-request')
  requestSignature(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestSignatureDto,
  ) {
    return this.documentsService.requestSignature(user.id, id, dto);
  }

  @Get('signature-requests/my')
  getMySignatureRequests(@CurrentUser() user: any) {
    return this.documentsService.getMySignatureRequests(user.id);
  }

  @Post('signature-requests/:id/sign')
  signDocument(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SignDocumentDto,
  ) {
    return this.documentsService.signDocument(user.id, id, dto);
  }

  @Post('signature-requests/:id/decline')
  declineSignature(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeclineSignatureDto,
  ) {
    return this.documentsService.declineSignature(user.id, id, dto);
  }
}
