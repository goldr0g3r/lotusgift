import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsString()
  sku: string;

  @IsNumber()
  @Min(0)
  priceFrom: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceTo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  wholesaleMinQty?: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQty?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isWholesale?: boolean;

  @IsOptional()
  @IsString()
  customizationOptions?: string;
}
