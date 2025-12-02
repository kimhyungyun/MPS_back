import {
  Controller,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(8) // mb_level >= 8만 접근 가능
@Controller('admin/devices')
export class DevicesAdminController {
  constructor(private readonly devicesService: DevicesService) {}

  // 특정 유저의 기기 목록 조회
  @Get(':userId')
  async getUserDevices(@Param('userId', ParseIntPipe) userId: number) {
    return this.devicesService.adminListDevices(userId);
  }

  // 특정 기기 삭제
  @Delete(':userId/:deviceId')
  async deleteUserDevice(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('deviceId') deviceId: string,
  ) {
    return this.devicesService.adminDeleteDevice(userId, deviceId);
  }

  // 유저의 모든 기기 초기화
  @Delete(':userId')
  async resetUserDevices(@Param('userId', ParseIntPipe) userId: number) {
    return this.devicesService.adminResetDevices(userId);
  }
}
