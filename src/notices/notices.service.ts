import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async create(createNoticeDto: CreateNoticeDto) {
    return this.prisma.notices.create({
      data: {
        title: createNoticeDto.title,
        content: createNoticeDto.content,
        is_important: createNoticeDto.is_important || false,
        date: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.notices.findMany({
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.notices.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto) {
    return this.prisma.notices.update({
      where: { id },
      data: updateNoticeDto,
    });
  }

  async remove(id: number) {
    return this.prisma.notices.delete({
      where: { id }
    });
  }
} 