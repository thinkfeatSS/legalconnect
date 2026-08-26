import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get('available-slots')
  getAvailableSlots(
    @Query('lawyerId', ParseIntPipe) lawyerId: number,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(lawyerId, date);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @Post()
  book(@CurrentUser() user: any, @Body() dto: BookAppointmentDto) {
    return this.appointmentsService.book(user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @Get('my')
  getClientAppointments(@CurrentUser() user: any) {
    return this.appointmentsService.getClientAppointments(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.LAWYER)
  @Get('lawyer')
  getLawyerAppointments(@CurrentUser() user: any) {
    return this.appointmentsService.getLawyerAppointments(user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, user.id, user.role, dto);
  }
}
