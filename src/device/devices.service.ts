import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDevice } from './entities/user-device.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(UserDevice)
    private readonly devicesRepo: Repository<UserDevice>,
  ) {}

  /**
   * 재생 시점에서 호출:
   * - 현재 deviceId가 등록돼 있으면 lastUsedAt 갱신
   * - 등록 안돼 있고, 등록 기기가 2개 미만이면 자동 등록
   * - 2개 꽉 찼는데 새로운 deviceId면 ForbiddenException
   */
  async verifyAndRegisterDevice(
    userId: number,
    dto: RegisterDeviceDto,
  ): Promise<UserDevice> {
    const devices = await this.devicesRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    const exists = devices.find((d) => d.deviceId === dto.deviceId);

    if (exists) {
      exists.lastUsedAt = new Date();
      return this.devicesRepo.save(exists);
    }

    if (devices.length >= 2) {
      throw new ForbiddenException(
        '등록 가능한 기기 수(2대)를 초과했습니다. 관리자에게 문의하세요.',
      );
    }

    const device = this.devicesRepo.create({
      userId,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
    });

    return this.devicesRepo.save(device);
  }

  // (선택) 유저 본인이 자신의 기기 목록 보는 용도
  async getUserDevices(userId: number): Promise<UserDevice[]> {
    return this.devicesRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  // --- 관리자 전용 ---

  async adminListDevices(userId: number): Promise<UserDevice[]> {
    return this.getUserDevices(userId);
  }

  async adminDeleteDevice(userId: number, deviceId: string) {
    const result = await this.devicesRepo.delete({ userId, deviceId });
    if (result.affected === 0) {
      throw new NotFoundException('해당 기기를 찾을 수 없습니다.');
    }
    return { success: true };
  }

  async adminResetDevices(userId: number) {
    await this.devicesRepo.delete({ userId });
    return { success: true };
  }
}
