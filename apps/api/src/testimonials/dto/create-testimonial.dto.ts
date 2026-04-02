import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
