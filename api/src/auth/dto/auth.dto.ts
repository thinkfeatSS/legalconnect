import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  phone?: string;

  // Lawyer-only fields
  @IsOptional()
  @IsString()
  barCouncilNumber?: string;

  @IsOptional()
  experienceYears?: number;

  @IsOptional()
  consultationFee?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  cities?: string[];

  @IsOptional()
  specializationIds?: number[];
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
