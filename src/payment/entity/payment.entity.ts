import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '@/user/entity/user.entity';
import { Lecture } from '@/lecture/entity/lecture.entity';
import { PaymentStatus } from '../enum/payment-status.enum';
import { PaymentMethod } from '../enum/payment-method.enum';

@Entity()
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

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.payments)
  user: User;

  @ManyToOne(() => Lecture, (lecture) => lecture.payments)
  lecture: Lecture;
} 