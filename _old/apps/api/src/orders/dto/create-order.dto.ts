import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId: string;
  @IsInt()
  @Min(1)
  quantity: number;
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  userId?: string;
  @IsOptional()
  @IsString()
  quoteId?: string;
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
  @IsOptional()
  @IsString()
  shippingAddress?: string;
  @IsOptional()
  @IsString()
  notes?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
