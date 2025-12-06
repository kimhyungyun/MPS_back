// src/video-authority/video-authority.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserVideoAuthorityDto } from './dto/update-user-video-authority-dto';

@Injectable()
export class VideoAuthorityService {
  constructor(private readonly prisma: PrismaService) {}

  // 유저별 권한 목록
  async getByUserId(userId: number) {
    return this.prisma.videoAuthority.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  // 유저 권한 전체 교체
  async updateUserAuthorities(dto: UpdateUserVideoAuthorityDto) {
    const { userId } = dto;

    const classGroups = dto.classGroups ?? [];
    const videoTypes = dto.videoTypes ?? [];

    console.log('🔥 [Service] updateUserAuthorities input:', {
      userId,
      classGroups,
      videoTypes,
    });

    // 기존 권한 삭제
    await this.prisma.videoAuthority.deleteMany({
      where: { userId },
    });

    const dataToCreate = [
      ...classGroups.map((cg) => ({
        userId,
        classGroup: cg as any,
        type: null,
      })),
      ...videoTypes.map((vt) => ({
        userId,
        classGroup: null,
        type: vt as any,
      })),
    ];

    console.log('🔥 [Service] dataToCreate:', dataToCreate);

    if (dataToCreate.length === 0) {
      console.log('⚠️ [Service] dataToCreate length = 0, 아무 것도 안 넣음');
      return [];
    }

    const result = await this.prisma.videoAuthority.createMany({
      data: dataToCreate,
      skipDuplicates: true,
    });

    console.log('✅ [Service] createMany result:', result);

    return this.getByUserId(userId);
  }

  async remove(id: number) {
    return this.prisma.videoAuthority.delete({ where: { id } });
  }

  // 강의 시청 권한 체크
  async canWatchLecture(userId: number, lectureId: number): Promise<boolean> {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { classGroup: true, type: true },
    });

    if (!lecture) return false;

    const authorities = await this.prisma.videoAuthority.findMany({
      where: { userId },
      select: { classGroup: true, type: true },
    });

    if (authorities.length === 0) return false;

    const allowedClassGroups: string[] = authorities
      .map((a) => a.classGroup)
      .filter((v): v is string => !!v);

    const allowedTypes: string[] = authorities
      .map((a) => a.type)
      .filter((v): v is string => !!v);

    const matchClassGroup =
      lecture.classGroup &&
      allowedClassGroups.includes(lecture.classGroup as unknown as string);

    const matchType =
      lecture.type &&
      allowedTypes.includes(lecture.type as unknown as string);

    return !!(matchClassGroup || matchType);
  }

  async hasAuthority(
    userId: number,
    opts: { classGroup?: string; type?: string },
  ): Promise<boolean> {
    const { classGroup, type } = opts;

    if (!classGroup && !type) {
      throw new BadRequestException('권한 체크 조건이 없습니다.');
    }

    const orConditions: any[] = [];
    if (classGroup) orConditions.push({ classGroup });
    if (type) orConditions.push({ type });

    const count = await this.prisma.videoAuthority.count({
      where: {
        userId,
        OR: orConditions,
      },
    });

    return count > 0;
  }
}
