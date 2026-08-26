import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AppointmentType } from '@prisma/client';
import { Type } from 'class-transformer';

export class BookAppointmentDto {
  @IsInt()
  @Type(() => Number)
  lawyerId: number;

  @IsDateString()
  appointmentDate: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsEnum(AppointmentType)
  type: AppointmentType;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(['CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;
}
