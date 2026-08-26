import {
  IsArray,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLawyerProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  cities?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  @Type(() => Number)
  experienceYears?: number;

  @IsOptional()
  @Type(() => Number)
  consultationFee?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  specializationIds?: number[];
}

export class LawyerSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minExperience?: number;

  @IsOptional()
  @Type(() => Number)
  maxFee?: number;

  @IsOptional()
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}
