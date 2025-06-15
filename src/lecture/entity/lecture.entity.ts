import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '@/user/entity/user.entity';
import { LectureType } from '../enum/lecture-type.enum';
import { LectureCategory } from './lecture-category.entity';
import { Payment } from '@/payment/entity/payment.entity';

@Entity()
export class Lecture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('int')
  price: number;

  @Column()
  thumbnail_url: string;

  @Column()
  video_url: string;

  @Column({
    type: 'enum',
    enum: LectureType,
    default: LectureType.SINGLE,
  })
  type: LectureType;

  @ManyToOne(() => LectureCategory, (category) => category.lectures, {
    eager: true,
  })
  category: LectureCategory;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.lectures)
  instructor: User;

  @OneToMany(() => Payment, (payment) => payment.lecture)
  payments: Payment[];
}
