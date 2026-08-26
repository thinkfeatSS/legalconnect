import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryEntryDto, UpdateDiaryEntryDto } from './dto/diary.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, DiaryEntryType, DiaryStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LAWYER)
@Controller('diary')
export class DiaryController {
  constructor(private diaryService: DiaryService) {}

  @Get()
  getEntries(
    @CurrentUser() user: any,
    @Query('type') type?: DiaryEntryType,
    @Query('status') status?: DiaryStatus,
  ) {
    return this.diaryService.getEntries(user.id, type, status);
  }

  @Get(':id')
  getEntry(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.diaryService.getEntry(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateDiaryEntryDto) {
    return this.diaryService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiaryEntryDto) {
    return this.diaryService.update(user.id, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.diaryService.delete(user.id, id);
  }
}
