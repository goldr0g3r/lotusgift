import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum InquiryStatusEnum {
  NEW = 'NEW',
  READ = 'READ',
  REPLIED = 'REPLIED',
  CLOSED = 'CLOSED',
}

export class UpdateContactDto {
  @IsOptional()
  @IsEnum(InquiryStatusEnum)
  status?: InquiryStatusEnum;
  @IsOptional()
  @IsString()
  adminNote?: string;
}
