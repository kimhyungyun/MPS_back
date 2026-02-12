import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '@/user/entity/user.entity';
import { Lecture } from '@/lecture/entity/lecture.entity';
import { LecturePackage } from '@/lecture/entity/lecture-package.entity'; // ✅ 실제 경로로
import { PaymentStatus } from '../enum/payment-status.enum';
import { PaymentMethod } from '../enum/payment-method.enum';

@Entity('payment')
@Index('payment_lecturePackageId_idx', ['lecturePackageId'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at: Date;

  // ✅ Toss 주문번호 (필수 + unique)
  @Index('payment_orderId_uq', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  orderId: string;

  // ✅ Toss paymentKey (승인 후 생김, unique)
  @Index('payment_paymentKey_uq', { unique: true })
  @Column({ type: 'varchar', length: 200, nullable: true })
  paymentKey?: string | null;

  @Column({ type: 'varchar', length: 50, default: 'TOSS' })
  provider: string;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  approvedAt?: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptUrl?: string | null;

  // ✅ FK 컬럼들 (명시적으로 유지)
  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @Column({ type: 'int', nullable: true })
  lectureId?: number | null;

  @Column({ type: 'int', nullable: true })
  lecturePackageId?: number | null;

  // ✅ relations
  @ManyToOne(() => User, (user) => user.payments, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User | null;

  @ManyToOne(() => Lecture, (lecture) => lecture.payments, { nullable: true })
  @JoinColumn({ name: 'lectureId' })
  lecture?: Lecture | null;

  @ManyToOne(() => LecturePackage, (pkg) => pkg.payments, { nullable: true })
  @JoinColumn({ name: 'lecturePackageId' })
  lecturePackage?: LecturePackage | null;
}
