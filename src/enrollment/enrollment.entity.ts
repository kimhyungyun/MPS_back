import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { Lecture } from '@/lecture/entity/lecture.entity';
import { User } from '@/user/entity/user.entity';


@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Lecture)
  lecture: Lecture;

  @Column({ type: 'float', default: 0 })
  progress: number; // 수강률 (%)

  @CreateDateColumn()
  enrolledAt: Date;
}
