import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsBoolean()
  isSharedWithClient?: boolean;
}

export class RequestSignatureDto {
  @IsNumber()
  requestedToUserId: number;
}

export class SignDocumentDto {
  @IsString()
  signatureImageUrl: string;
}

export class DeclineSignatureDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
