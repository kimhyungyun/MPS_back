import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Lecture } from '@/lecture/entity/lecture.entity';
import { Payment } from '@/payment/entity/payment.entity';
import { Post } from '@/post/entity/post.entity';
import { Comment } from '@/comment/entity/comment.entity';
import { UserRole } from '@/user/enum/user-role.enum';

@Entity('g5_member')
export class User {
  @PrimaryGeneratedColumn({ name: 'mb_no' })
  id: number;

  @Column({ length: 20, unique: true })
  mb_id: string;

  @Column({ length: 255 })
  mb_password: string;

  @Column({ length: 255 })
  mb_password2: string;

  @Column({ length: 255 })
  mb_name: string;

  @Column({ length: 255 })
  mb_nick: string;

  @Column({ type: 'date', nullable: true })
  mb_nick_date: string;
  
  @Column({ length: 255 })
  mb_email: string;

  @Column({ length: 255 })
  mb_homepage: string;

  @Column({ type: 'tinyint', default: 0 })
  mb_level: UserRole;

  @Column({ length: 1 })
  mb_sex: string;

  @Column({ length: 255 })
  mb_birth: string;

  @Column({ length: 255, nullable: true })
  mb_school: string;

  @Column({ length: 255 })
  mb_tel: string;

  @Column({ length: 255 })
  mb_hp: string;

  @Column({ length: 20 })
  mb_certify: string;

  @Column({ type: 'tinyint', default: 0 })
  mb_adult: number;

  @Column({ length: 255 })
  mb_dupinfo: string;

  @Column({ length: 3 })
  mb_zip1: string;

  @Column({ length: 3 })
  mb_zip2: string;

  @Column({ length: 255 })
  mb_addr1: string;

  @Column({ length: 255 })
  mb_addr2: string;

  @Column({ length: 255 })
  mb_addr3: string;

  @Column({ length: 255 })
  mb_addr_jibeon: string;

  @Column({ type: 'text' })
  mb_signature: string;

  @Column({ length: 255 })
  mb_recommend: string;

  @Column({ type: 'int', default: 0 })
  mb_point: number;

  @Column({ type: 'datetime', default: () => "'0000-00-00 00:00:00'" })
  mb_today_login: Date;

  @Column({ length: 255 })
  mb_login_ip: string;

  @Column({ type: 'datetime', default: () => "'0000-00-00 00:00:00'" })
  mb_datetime: Date;

  @Column({ length: 255 })
  mb_ip: string;

  @Column({ length: 8 })
  mb_leave_date: string;

  @Column({ length: 8 })
  mb_intercept_date: string;

  @Column({ type: 'datetime', default: () => "'0000-00-00 00:00:00'" })
  mb_email_certify: Date;

  @Column({ length: 255 })
  mb_email_certify2: string;

  @Column({ type: 'text' })
  mb_memo: string;

  @Column({ length: 255 })
  mb_lost_certify: string;

  @Column({ type: 'tinyint', default: 0 })
  mb_mailling: number;

  @Column({ type: 'tinyint', default: 0 })
  mb_sms: number;

  @Column({ type: 'tinyint', default: 0 })
  mb_open: number;

  @Column({ type: 'date', default: () => "'0000-00-00'" })
  mb_open_date: string;

  @Column({ type: 'text' })
  mb_profile: string;

  @Column({ length: 255 })
  mb_memo_call: string;

  @Column({ type: 'int', default: 0 })
  mb_memo_cnt: number;

  @Column({ type: 'int', default: 0 })
  mb_scrap_cnt: number;

  @Column({ length: 255 })
  mb_1: string;

  @Column({ length: 255 })
  mb_2: string;

  @Column({ length: 255 })
  mb_3: string;

  @Column({ length: 255 })
  mb_4: string;

  @Column({ length: 255 })
  mb_5: string;

  @Column({ length: 255 })
  mb_6: string;

  @Column({ length: 255 })
  mb_7: string;

  @Column({ length: 255 })
  mb_8: string;

  @Column({ length: 255 })
  mb_9: string;

  @Column({ length: 255 })
  mb_10: string;

  // @CreateDateColumn({ type: 'timestamp' })
  // created_at: Date;

  // @UpdateDateColumn({ type: 'timestamp' })
  // updated_at: Date;

  // 관계 유지
  @OneToMany(() => Lecture, (lecture) => lecture.instructor)
  lectures: Lecture[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];
}
