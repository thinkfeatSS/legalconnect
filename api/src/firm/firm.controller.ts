import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirmService } from './firm.service';
import { CreateFirmDto, InviteMemberDto, UpdateFirmDto, UpdateMemberRoleDto } from './dto/firm.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LAWYER)
@Controller('firm')
export class FirmController {
  constructor(private readonly firmService: FirmService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateFirmDto) {
    return this.firmService.create(user.id, dto);
  }

  @Get('my')
  getMyFirm(@CurrentUser() user: any) {
    return this.firmService.getMyFirm(user.id);
  }

  @Patch()
  update(@CurrentUser() user: any, @Body() dto: UpdateFirmDto) {
    return this.firmService.update(user.id, dto);
  }

  @Post('invite')
  inviteMember(@CurrentUser() user: any, @Body() dto: InviteMemberDto) {
    return this.firmService.inviteMember(user.id, dto);
  }

  @Delete('members/:memberId')
  removeMember(
    @CurrentUser() user: any,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.firmService.removeMember(user.id, memberId);
  }

  @Patch('members/:memberId/role')
  updateMemberRole(
    @CurrentUser() user: any,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.firmService.updateMemberRole(user.id, memberId, dto);
  }
}
