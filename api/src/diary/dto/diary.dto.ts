import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DiaryEntryType, DiaryStatus } from '@prisma/client';

export class CreateDiaryEntryDto {
  @IsEnum(DiaryEntryType)
  type: DiaryEntryType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  hearingDate?: string;

  @IsOptional()
  @IsDateString()
  reminderDate?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  courtName?: string;

  @IsOptional()
  @IsNumber()
  caseId?: number;

  @IsOptional()
  syncToCalendar?: boolean;
}

export class UpdateDiaryEntryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  hearingDate?: string;

  @IsOptional()
  @IsDateString()
  reminderDate?: string;

  @IsOptional()
  @IsEnum(DiaryStatus)
  status?: DiaryStatus;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  courtName?: string;

  @IsOptional()
  @IsNumber()
  caseId?: number;

  @IsOptional()
  syncToCalendar?: boolean;
}
