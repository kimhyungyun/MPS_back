// src/post/entity/post.entity.ts
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

  // ✅ 중요 여부 (tinyint(1))
  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_important: boolean;

  // ✅ 대표 이미지 URL (varchar(500), nullable)
  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl: string | null;
}
