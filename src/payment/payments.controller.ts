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
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  private getUserId(req: any): number {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return Number(userId);
  }

  // ✅ 주문 생성은 로그인 필수
  @UseGuards(AuthGuard('jwt'))
  @Post('order')
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: any) {
    this.logger.log(`[order] dto=${JSON.stringify(dto)}`);
    const userId = this.getUserId(req);
    return this.paymentsService.createPayment(userId, dto.lecturePackageId);
  }

  // ✅ 결제 승인(confirm)은 가드 제거 (리다이렉트 성공 페이지에서 토큰 누락 방지)
  @Post('confirm')
  async confirm(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment({
      paymentKey: dto.paymentKey,
      orderId: dto.orderId,
      amount: dto.amount,
    });
  }
}