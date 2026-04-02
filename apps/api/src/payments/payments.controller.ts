import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order/:orderId')
  createOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.createRazorpayOrder(orderId);
  }

  @Post('verify')
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('convert-quote/:quoteId')
  convertQuoteToOrder(@Param('quoteId') quoteId: string) {
    return this.paymentsService.convertQuoteToOrder(quoteId);
  }
}
