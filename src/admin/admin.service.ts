import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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

    try {
      const [members, total] = await Promise.all([
        this.prisma.g5_member.findMany({
          where,
          skip,
          take: pageSize,
          select: {
            mb_id: true,
            mb_name: true,
            mb_nick: true,
            mb_email: true,
            mb_hp: true,
            mb_point: true,
            mb_level: true,
          },
        }),
        this.prisma.g5_member.count({ where }),
      ]);

      return {
        members,
        total,
      };
    } catch (err) {
      console.error('🔥 getMembers() 오류 발생:', err);
      throw new InternalServerErrorException('회원 목록 조회 중 오류 발생');
    }
  }

  async updateMemberLevel(mb_id: string, mb_level: number) {
    if (mb_level < 1 || mb_level > 10) {
      throw new Error('회원 레벨은 1부터 10 사이여야 합니다.');
    }

    try {
      const member = await this.prisma.g5_member.update({
        where: { mb_id },
        data: { mb_level },
      });

      if (!member) {
        throw new NotFoundException('회원을 찾을 수 없습니다.');
      }

      return member;
    } catch (err) {
      console.error('🔥 updateMemberLevel() 오류 발생:', err);
      throw new InternalServerErrorException('회원 레벨 변경 중 오류 발생');
    }
  }

  // ✅ 관리자 통계 메서드 추가
  async getAdminStats() {
    try {
      const totalMembers = await this.prisma.g5_member.count();
      const totalLectures = await this.prisma.lecture.count();

      return {
        totalMembers,
        totalLectures,
      };
    } catch (err) {
      console.error('🔥 getAdminStats() 오류 발생:', err);
      throw new InternalServerErrorException('통계 정보 조회 중 오류 발생');
    }
  }
}
