import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsString()
  name: string;
  @IsEmail()
  email: string;
  @IsOptional()
  @IsString()
  phone?: string;
  @IsOptional()
  @IsString()
  company?: string;
  @IsOptional()
  @IsString()
  subject?: string;
  @IsString()
  message: string;
}
