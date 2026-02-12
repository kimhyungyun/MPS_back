import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { payment_paymentStatus, payment_paymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private readonly TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

  // ✅ B(결제위젯) 시크릿 키 env 이름 고정
  private readonly SECRET_ENV_KEY = 'TOSS_WIDGET_SECRET_KEY';

  constructor(private readonly prisma: PrismaService) {}

  // ✅ 1) 주문 생성
  async createPayment(userId: number | null, lecturePackageId: number) {
    try {
      const id = Number(lecturePackageId);
      if (!Number.isFinite(id) || id < 1) {
        throw new BadRequestException('lecturePackageId가 올바르지 않습니다.');
      }

      this.logger.log(`[createPayment] userId=${userId} lecturePackageId=${id}`);

      const pkg = await this.prisma.lecture_package.findUnique({
        where: { id },
      });

      if (!pkg) throw new NotFoundException('존재하지 않는 패키지입니다.');

      const amount = pkg.price;
      const title = pkg.name;

      const orderId = `order_pkg_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          amount,
          userId: userId ?? null,
          lecturePackageId: id,
          paymentStatus: payment_paymentStatus.pending,
          paymentMethod: payment_paymentMethod.credit_card,
          provider: 'TOSS',
        },
      });

      return {
        orderId: payment.orderId,
        amount: payment.amount,
        title,
      };
    } catch (err: any) {
      this.logger.error('[createPayment] FAILED');

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`PrismaKnownError code=${err.code}`);
        this.logger.error(`meta=${JSON.stringify(err.meta)}`);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`PrismaValidationError: ${err.message}`);
      } else {
        this.logger.error(err?.stack ?? err?.message ?? err);
      }

      if (typeof err?.getStatus === 'function') throw err;
      throw new InternalServerErrorException('Internal server error');
    }
  }

  private mapTossMethodToEnum(tossMethod?: string): payment_paymentMethod {
    const m = String(tossMethod ?? '').toUpperCase();
    if (m.includes('CARD')) return payment_paymentMethod.credit_card;
    // 필요하면 계좌이체/가상계좌/휴대폰결제 등 매핑 확장
    return payment_paymentMethod.credit_card;
  }

  // ✅ 2) 결제 승인
  async confirmPayment(params: { paymentKey: string; orderId: string; amount: number }) {
    const { paymentKey, orderId, amount } = params;

    try {
      const payment = await this.prisma.payment.findUnique({
        where: { orderId },
        include: {
          lecture_package: {
            include: {
              lecture_package_lectures_lecture: true,
            },
          },
        },
      });

      if (!payment) throw new BadRequestException('존재하지 않는 주문입니다.');
      if (payment.amount !== amount) throw new BadRequestException('결제 금액이 주문 정보와 일치하지 않습니다.');

      // ✅ 이미 완료된 주문이면 그대로 반환 (중복 confirm 방지)
      if (payment.paymentStatus === payment_paymentStatus.completed) {
        return {
          success: true,
          orderId: payment.orderId,
          amount: payment.amount,
          message: '이미 결제가 완료된 주문입니다.',
        };
      }

      // ✅ B: 결제위젯 시크릿키 (live_gsk)
      const secret = (process.env[this.SECRET_ENV_KEY] ?? '').trim();
      if (!secret) {
        throw new InternalServerErrorException(`${this.SECRET_ENV_KEY}가 서버에 없습니다.`);
      }

      const authHeader = Buffer.from(`${secret}:`).toString('base64');

      // Toss 승인
      const res = await axios.post(
        this.TOSS_CONFIRM_URL,
        { paymentKey, orderId, amount },
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const data = res.data;
      const mappedMethod = this.mapTossMethodToEnum(data?.method);

      // ✅ 트랜잭션: 결제 완료 처리 + 수강권 부여
      await this.prisma.$transaction(async (tx) => {
        // 1) payment 완료 처리
        await tx.payment.update({
          where: { orderId },
          data: {
            paymentKey,
            paymentStatus: payment_paymentStatus.completed,
            paymentMethod: mappedMethod,
            approvedAt: data?.approvedAt ? new Date(data.approvedAt) : null,
            receiptUrl: data?.receipt?.url ?? null,
          },
        });

        // 2) 수강권 부여 (로그인 필수라면 payment.userId는 항상 들어올 가능성이 큼)
        if (!payment.userId || !payment.lecturePackageId) return;

        const links = payment.lecture_package?.lecture_package_lectures_lecture ?? [];

        // ✅ enrollment에는 (userId, lectureId) 유니크가 없어서 upsert 불가
        // => 존재 확인 후 없으면 create
        for (const link of links) {
          const lectureId = link.lectureId;

          const exists = await tx.enrollment.findFirst({
            where: {
              userId: payment.userId,
              lectureId,
            },
            select: { id: true },
          });

          if (exists) continue;

          await tx.enrollment.create({
            data: {
              userId: payment.userId,
              lectureId,
              progress: 0,
            },
          });
        }
      });

      return {
        success: true,
        orderId: payment.orderId,
        amount: payment.amount,
        lecturePackageId: payment.lecturePackageId,
        receiptUrl: data?.receipt?.url ?? null,
        approvedAt: data?.approvedAt ?? null,
      };
    } catch (err: any) {
      this.logger.error('[confirmPayment] FAILED');

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`PrismaKnownError code=${err.code}`);
        this.logger.error(`meta=${JSON.stringify(err.meta)}`);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        this.logger.error(`PrismaValidationError: ${err.message}`);
      } else {
        this.logger.error(err?.response?.data ?? err?.stack ?? err?.message ?? err);
      }

      if (err?.response?.data) {
        throw new BadRequestException(err.response.data);
      }
      if (typeof err?.getStatus === 'function') throw err;

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
