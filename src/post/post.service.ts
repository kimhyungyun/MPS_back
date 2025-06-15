import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entity/post.entity';
import { User } from '@/user/entity/user.entity';


@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const user = await this.userRepository.findOne({
      where: { mb_id: createPostDto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const post = this.postRepository.create({
      ...createPostDto,
      user,
    });
    return await this.postRepository.save(post);
  }

  async findAll(): Promise<Post[]> {
    return await this.postRepository.find({
      relations: ['user', 'comments'],
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user', 'comments'],
    });
    if (!post) {
      throw new NotFoundException(`Post not found`);
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);

    if (updatePostDto.userId) {
      const user = await this.userRepository.findOne({
        where: { mb_id: updatePostDto.userId },
      });
      if (!user) {
        throw new NotFoundException(`User not found`);
      }
      post.user = user;
    }

    Object.assign(post, updatePostDto);
    return await this.postRepository.save(post);
  }

  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
  }
} 