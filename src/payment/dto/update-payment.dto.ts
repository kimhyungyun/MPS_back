import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { PaymentMethod } from '../enum/payment-method.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

export class UpdatePaymentDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsNumber()
  @IsOptional()
  lectureId?: number;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;
} 