import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async create(createNoticeDto: CreateNoticeDto) {
    return this.prisma.post.create({
      data: {
        title: createNoticeDto.title,
        content: createNoticeDto.content,
        category: 'notice',
        userId: null,
      },
    });
  }

  async findAll() {
    return this.prisma.post.findMany({
      where: {
        category: 'notice'
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto) {
    return this.prisma.post.update({
      where: { id },
      data: updateNoticeDto,
    });
  }

  async remove(id: number) {
    return this.prisma.post.delete({
      where: { id }
    });
  }
} 