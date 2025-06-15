import {
  Entity,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lecture } from '@/lecture/entity/lecture.entity';
import { Payment } from '@/payment/entity/payment.entity';
import { Post } from '@/post/entity/post.entity';
import { Comment } from '@/comment/entity/comment.entity';
import { UserRole } from '@/user/enum/user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  mb_id: string;

  @Column({ length: 100 })
  mb_password: string;

  @Column({ length: 20 })
  mb_name: string;

  @Column({ length: 20 })
  mb_nick: string;

  @Column({ length: 100 })
  mb_email: string;

  @Column({ length: 11, nullable: true })
  mb_hp: string;

  @Column({ length: 1, nullable: true })
  mb_sex: string;

  @Column({ length: 8, nullable: true })
  mb_birth: string;

  @Column({ length: 100, nullable: true })
  mb_addr1: string;

  @Column({ length: 100, nullable: true })
  mb_addr2: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  mb_level: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Lecture, (lecture) => lecture.instructor)
  lectures: Lecture[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];
}
