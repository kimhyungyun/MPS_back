import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '@/user/entity/user.entity';
import { Comment } from '@/comment/entity/comment.entity';
import { PostCategory } from '../enum/post-category.enum';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: PostCategory,
  })
  category: PostCategory;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}
