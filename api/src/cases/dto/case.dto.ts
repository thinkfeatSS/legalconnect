import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { CaseStatus, CaseType, CourtProvince, CourtType } from '@prisma/client';

export class CreateCaseDto {
  @IsString()
  caseNumber: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CaseType)
  caseType?: CaseType;

  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  @IsString()
  courtName?: string;

  @IsOptional()
  @IsString()
  courtCity?: string;

  @IsOptional()
  @IsEnum(CourtProvince)
  courtProvince?: CourtProvince;

  @IsOptional()
  @IsEnum(CourtType)
  courtType?: CourtType;

  @IsOptional()
  @IsString()
  firNumber?: string;

  @IsOptional()
  @IsDateString()
  filingDate?: string;

  @IsOptional()
  @IsNumber()
  clientId?: number;

  @IsOptional()
  @IsObject()
  plaintiff?: { name: string; cnic?: string };

  @IsOptional()
  @IsObject()
  defendant?: { name: string; cnic?: string };

  @IsOptional()
  @IsObject()
  opposingCounsel?: { name: string; firm?: string; phone?: string };

  @IsOptional()
  @IsDecimal()
  retainerAmount?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CaseType)
  caseType?: CaseType;

  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  @IsString()
  courtName?: string;

  @IsOptional()
  @IsString()
  courtCity?: string;

  @IsOptional()
  @IsEnum(CourtProvince)
  courtProvince?: CourtProvince;

  @IsOptional()
  @IsEnum(CourtType)
  courtType?: CourtType;

  @IsOptional()
  @IsString()
  firNumber?: string;

  @IsOptional()
  @IsDateString()
  filingDate?: string;

  @IsOptional()
  @IsNumber()
  clientId?: number;

  @IsOptional()
  @IsObject()
  plaintiff?: { name: string; cnic?: string };

  @IsOptional()
  @IsObject()
  defendant?: { name: string; cnic?: string };

  @IsOptional()
  @IsObject()
  opposingCounsel?: { name: string; firm?: string; phone?: string };

  @IsOptional()
  @IsDecimal()
  retainerAmount?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
