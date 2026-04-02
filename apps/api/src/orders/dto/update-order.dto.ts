import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;
  @IsOptional()
  @IsString()
  shippingAddress?: string;
  @IsOptional()
  @IsString()
  notes?: string;
  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;
}
