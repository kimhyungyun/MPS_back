import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { User } from '@/user/entity/user.entity'; // ✅ User 경로 맞춰서 import

@Entity('user_devices')
@Index(['userId', 'deviceId'], { unique: true })
export class UserDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  deviceId: string;

  @Column({ nullable: true })
  deviceName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUsedAt: Date;

  @ManyToOne(() => User, (user: User) => user.devices, {
    onDelete: 'CASCADE',
  })
  user: User;
}
