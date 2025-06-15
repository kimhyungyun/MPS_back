import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getMembers(page: number, search?: string) {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { mb_id: { contains: search } },
            { mb_name: { contains: search } },
            { mb_nick: { contains: search } },
          ],
        }
      : {};

    const [members, total] = await Promise.all([
      this.prisma.g5_member.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { mb_datetime: 'desc' },
        select: {
          mb_id: true,
          mb_name: true,
          mb_nick: true,
          mb_email: true,
          mb_hp: true,
          mb_point: true,
          mb_level: true,
          mb_datetime: true,
        },
      }),
      this.prisma.g5_member.count({ where }),
    ]);

    return {
      members,
      total,
    };
  }

  async updateMemberLevel(mb_id: string, mb_level: number) {
    if (mb_level < 1 || mb_level > 10) {
      throw new Error('회원 레벨은 1부터 10 사이여야 합니다.');
    }

    const member = await this.prisma.g5_member.update({
      where: { mb_id },
      data: { mb_level },
    });

    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    return member;
  }
} 