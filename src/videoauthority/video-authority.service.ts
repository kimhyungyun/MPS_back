// src/video-authority/video-authority.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserVideoAuthorityDto } from './dto/update-user-video-authority-dto';
import { ClassGroup } from '../lecture/enum/class-group.enum';
import { LectureType } from '../lecture/enum/lecture-type.enum';

@Injectable()
export class VideoAuthorityService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: number) {
    return this.prisma.videoAuthority.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * 유저의 권한 세트를 한 번에 갈아끼우는 함수
   * - classGroups: ['A', 'S']
   * - lectureTypes: ['packageA', 'packageC', 'packageD']
   */
  async updateUserAuthorities(dto: UpdateUserVideoAuthorityDto) {
    const { userId } = dto;

    const classGroups = dto.classGroups ?? [];
    const lectureTypes = dto.lectureTypes ?? [];

    // 일단 이 유저 권한 싹 삭제
    await this.prisma.videoAuthority.deleteMany({
      where: { userId },
    });

    const dataToCreate = [
      // 반 권한
      ...classGroups.map((cg) => ({
        userId,
        classGroup: cg,
        type: null,
      })),
      // 패키지/단일 권한
      ...lectureTypes.map((lt) => ({
        userId,
        classGroup: null,
        type: lt,
      })),
    ];

    if (dataToCreate.length === 0) {
      return [];
    }

    await this.prisma.videoAuthority.createMany({
      data: dataToCreate,
      skipDuplicates: true,
    });

    return this.getByUserId(userId);
  }

  async remove(id: number) {
    return this.prisma.videoAuthority.delete({
      where: { id },
    });
  }

  async canWatchLecture(userId: number, lectureId: number): Promise<boolean> {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      select: {
        classGroup: true,
        type: true,
      },
    });

    if (!lecture) return false;

    const orConditions: any[] = [];

    if (lecture.classGroup) {
      orConditions.push({ classGroup: lecture.classGroup });
    }

    if (lecture.type) {
      orConditions.push({ type: lecture.type });
    }

    if (orConditions.length === 0) {
      return true; // 제한 없는 강의로 간주하고 싶으면
    }

    const count = await this.prisma.videoAuthority.count({
      where: {
        userId,
        OR: orConditions,
      },
    });

    return count > 0;
  }

  async hasAuthority(
    userId: number,
    opts: { classGroup?: ClassGroup; type?: LectureType },
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
