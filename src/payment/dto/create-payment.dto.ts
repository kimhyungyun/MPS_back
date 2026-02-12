import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreatePaymentDto {
  @Type(() => Number)
  @IsInt({ message: 'lecturePackageId는 정수여야 합니다.' })
  @Min(1, { message: 'lecturePackageId는 1 이상이어야 합니다.' })
  lecturePackageId!: number;
}
