import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { FirmMemberRole } from '@prisma/client';

export class CreateFirmDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateFirmDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class InviteMemberDto {
  @IsNumber()
  lawyerProfileId: number;

  @IsOptional()
  @IsEnum(FirmMemberRole)
  role?: FirmMemberRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(FirmMemberRole)
  role: FirmMemberRole;
}
