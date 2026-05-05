import { Equals, IsEmail, IsOptional, IsString } from 'class-validator';

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

  /**
   * Honeypot field. Real users never see or fill this; bots typically auto-fill
   * any input named "website". When present and non-empty the request is
   * rejected by the contacts service. The field is optional and must be the
   * empty string (or omitted) to pass validation here.
   */
  @IsOptional()
  @Equals('', { message: 'Spam check failed' })
  website?: string;
}
