import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Session } from '../auth/session.decorator';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order/:orderId')
  createOrder(
    @Param('orderId') orderId: string,
    @Session('user') user: { id: string; role?: string },
  ) {
    return this.paymentsService.createRazorpayOrder(orderId, user);
  }

  @Post('verify')
  verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @Session('user') user: { id: string; role?: string },
  ) {
    return this.paymentsService.verifyPayment(dto, user);
  }

  @Post('convert-quote/:quoteId')
  convertQuoteToOrder(
    @Param('quoteId') quoteId: string,
    @Session('user') user: { id: string; role?: string },
  ): Promise<any> {
    return this.paymentsService.convertQuoteToOrder(quoteId, user);
  }
}
