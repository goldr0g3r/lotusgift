import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
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

  /**
   * Razorpay → API webhook. Public (no session) but HMAC-verified.
   * The route is registered with a raw-body parser in main.ts so we can
   * verify the signature against the exact bytes Razorpay signed.
   */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature: string | undefined,
  ) {
    const rawBody = req.rawBody ?? (Buffer.isBuffer(req.body) ? (req.body as unknown as Buffer) : Buffer.alloc(0));
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
