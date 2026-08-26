import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { HearingStatus } from '@prisma/client';

export class CreateHearingDto {
  @IsNumber()
  caseId: number;

  @IsDateString()
  hearingDate: string;

  @IsOptional()
  @IsString()
  courtRoom?: string;

  @IsOptional()
  @IsString()
  judge?: string;
}

export class UpdateHearingDto {
  @IsOptional()
  @IsDateString()
  hearingDate?: string;

  @IsOptional()
  @IsString()
  courtRoom?: string;

  @IsOptional()
  @IsString()
  judge?: string;

  @IsOptional()
  @IsEnum(HearingStatus)
  status?: HearingStatus;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  orderText?: string;

  @IsOptional()
  @IsString()
  orderDocUrl?: string;
}

export class AdjournHearingDto {
  @IsDateString()
  nextHearingDate: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  courtRoom?: string;

  @IsOptional()
  @IsString()
  judge?: string;
}
