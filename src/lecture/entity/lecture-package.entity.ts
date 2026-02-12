import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Lecture } from './lecture.entity';
import { Payment } from '@/payment/entity/payment.entity';


@Entity('lecture_package')
export class LecturePackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Lecture)
  @JoinTable()
  lectures: Lecture[];

  @Column('int')
  price: number;

  // ✅ 패키지 결제 기록
  @OneToMany(() => Payment, (p) => p.lecturePackage)
  payments: Payment[];
}
