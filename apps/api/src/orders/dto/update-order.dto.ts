import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Admin-facing order patch. Payment fields (`razorpayPaymentId`, `paidAt`,
 * `subtotal`, `tax`, `total`) are intentionally excluded — those are mutated
 * only by the payment service via `/payments/verify` or the Razorpay webhook
 * to prevent admins from forging a paid status.
 */
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
}
