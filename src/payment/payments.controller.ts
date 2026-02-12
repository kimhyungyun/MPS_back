import {
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  private getUserId(req: any): number {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return Number(userId);
  }

  @Post('order')
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: any) {
    this.logger.log(`[order] dto=${JSON.stringify(dto)}`);
    const userId = this.getUserId(req);
    return this.paymentsService.createPayment(userId, dto.lecturePackageId);
  }

  @Post('confirm')
  async confirm(@Body() dto: ConfirmPaymentDto, @Req() req: any) {
    // 로그인 필수 유지
    this.getUserId(req);

    return this.paymentsService.confirmPayment({
      paymentKey: dto.paymentKey,
      orderId: dto.orderId,
      amount: dto.amount,
    });
  }
}
