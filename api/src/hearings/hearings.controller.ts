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
  UseGuards,
} from '@nestjs/common';
import { HearingsService } from './hearings.service';
import { AdjournHearingDto, CreateHearingDto, UpdateHearingDto } from './dto/hearing.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LAWYER)
@Controller('hearings')
export class HearingsController {
  constructor(private readonly hearingsService: HearingsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateHearingDto) {
    return this.hearingsService.create(user.id, dto);
  }

  @Get('upcoming')
  getUpcoming(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.hearingsService.getUpcoming(user.id, days ? parseInt(days) : 7);
  }

  @Get('case/:caseId')
  findByCaseId(
    @CurrentUser() user: any,
    @Param('caseId', ParseIntPipe) caseId: number,
  ) {
    return this.hearingsService.findByCaseId(user.id, caseId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHearingDto,
  ) {
    return this.hearingsService.update(user.id, id, dto);
  }

  @Post(':id/adjourn')
  adjourn(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdjournHearingDto,
  ) {
    return this.hearingsService.adjourn(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.hearingsService.remove(user.id, id);
  }
}
