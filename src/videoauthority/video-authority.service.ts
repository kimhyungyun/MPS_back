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

  // =================================
  // 🔹 기기 관련 로직
  // =================================

  // 유저의 등록된 기기 목록 (최대 2개)
  async getDevicesByUserId(userId: number) {
    return this.prisma.videoDevice.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 유저 기기 전체 초기화
  async resetUserDevices(userId: number) {
    const deleted = await this.prisma.videoDevice.deleteMany({
      where: { userId },
    });
    console.log('🧹 [Service] resetUserDevices:', { userId, deleted });
    return deleted;
  }

  /**
   * 재생 시도 시 호출:
   *  - 이미 등록된 기기면 lastUsedAt 업데이트 후 통과
   *  - 등록된 기기가 2개 미만이면 새 기기로 등록하고 통과
   *  - 이미 2개 등록되어 있고 새 기기면 거절
   */
  async validateAndRegisterDevice(
    userId: number,
    deviceId: string,
    deviceName?: string,
  ) {
    if (!deviceId) throw new BadRequestException('deviceId가 필요합니다.');

    const devices = await this.prisma.videoDevice.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const existing = devices.find((d) => d.deviceId === deviceId);

    if (existing) {
      await this.prisma.videoDevice.update({
        where: { id: existing.id },
        data: {
          lastUsedAt: new Date(),
          deviceName: deviceName ?? existing.deviceName,
        },
      });

      return {
        allowed: true,
        reason: 'EXISTING_DEVICE',
        devices: await this.getDevicesByUserId(userId),
      };
    }

    if (devices.length < 2) {
      await this.prisma.videoDevice.create({
        data: {
          userId,
          deviceId,
          deviceName: deviceName ?? 'Unknown Device',
        },
      });

      return {
        allowed: true,
        reason: 'NEW_DEVICE_REGISTERED',
        devices: await this.getDevicesByUserId(userId),
      };
    }

    // 이미 2대 꽉 차 있음
    return {
      allowed: false,
      reason: 'DEVICE_LIMIT_EXCEEDED',
      devices,
    };
  }
}
