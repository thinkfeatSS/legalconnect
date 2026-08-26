import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LawyersService } from './lawyers.service';
import { UpdateLawyerProfileDto } from './dto/lawyer.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('lawyers')
export class LawyersController {
  constructor(private lawyersService: LawyersService) {}

  @Get('specializations')
  getAllSpecializations() {
    return this.lawyersService.getAllSpecializations();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  @Get('me')
  getMyProfile(@CurrentUser() user: any) {
    return this.lawyersService.getMyProfile(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateLawyerProfileDto) {
    return this.lawyersService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.lawyersService.uploadPhoto(user.id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  @Post('me/bar-council-doc')
  @UseInterceptors(FileInterceptor('file'))
  uploadBarCouncilDoc(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.lawyersService.uploadBarCouncilDoc(user.id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  @Get('me/availability')
  getMyAvailability(@CurrentUser() user: any) {
    return this.lawyersService.getMyAvailabilitySlots(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.LAWYER)
  @Post('me/availability')
  setAvailability(
    @CurrentUser() user: any,
    @Body() body: { slots: { dayOfWeek: number; startTime: string; endTime: string }[] },
  ) {
    return this.lawyersService.setAvailability(user.id, body.slots);
  }

  @Get(':id')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.lawyersService.getProfile(id);
  }

  @Get(':id/availability')
  getAvailability(@Param('id', ParseIntPipe) id: number) {
    return this.lawyersService.getAvailability(id);
  }
}
