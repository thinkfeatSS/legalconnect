import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    return this.clientsService.getMyProfile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() body: { fullName?: string }) {
    return this.clientsService.updateProfile(user.id, body);
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.clientsService.uploadPhoto(user.id, file);
  }
}
