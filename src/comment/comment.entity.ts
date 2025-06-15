
import { Post } from '@/post/entity/post.entity';
import { User } from '@/user/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';


@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;

  @ManyToOne(() => User)
  user: User;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
