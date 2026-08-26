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
import { CasesService } from './cases.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, CaseStatus, CaseType } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Roles(Role.LAWYER)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateCaseDto) {
    return this.casesService.create(user.id, dto);
  }

  @Roles(Role.LAWYER)
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: CaseStatus,
    @Query('caseType') caseType?: CaseType,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.casesService.findAll(user.id, {
      status,
      caseType,
      clientId: clientId ? parseInt(clientId) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Roles(Role.CLIENT)
  @Get('my')
  findForClient(@CurrentUser() user: any) {
    return this.casesService.findForClient(user.id);
  }

  @Roles(Role.LAWYER)
  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.casesService.findOne(user.id, id);
  }

  @Roles(Role.LAWYER)
  @Get(':id/timeline')
  getTimeline(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.casesService.getTimeline(user.id, id);
  }

  @Roles(Role.LAWYER)
  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.casesService.update(user.id, id, dto);
  }

  @Roles(Role.LAWYER)
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.casesService.remove(user.id, id);
  }
}
