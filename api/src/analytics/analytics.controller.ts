import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LAWYER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: any) {
    return this.analyticsService.getOverview(user.id);
  }

  @Get('cases-by-type')
  getCasesByType(@CurrentUser() user: any) {
    return this.analyticsService.getCasesByType(user.id);
  }

  @Get('case-status-distribution')
  getCaseStatusDistribution(@CurrentUser() user: any) {
    return this.analyticsService.getCaseStatusDistribution(user.id);
  }

  @Get('hearings-this-month')
  getHearingsThisMonth(@CurrentUser() user: any) {
    return this.analyticsService.getHearingsThisMonth(user.id);
  }

  @Get('recent-activity')
  getRecentActivity(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.analyticsService.getRecentActivity(user.id, limit ? parseInt(limit) : 10);
  }
}
