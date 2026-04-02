import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum QuoteStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsEnum(QuoteStatusEnum)
  status?: QuoteStatusEnum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  validUntil?: string;
}
