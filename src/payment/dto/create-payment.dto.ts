import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { PaymentMethod } from '../enum/payment-method.enum';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  lectureId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
