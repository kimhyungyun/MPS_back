// src/video-authority/video-authority.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { VideoAuthorityService } from './video-authority.service';
import { UpdateUserVideoAuthorityDto } from './dto/update-user-video-authority-dto';
import { CheckDeviceDto, ResetUserDevicesDto } from './dto/device-auth.dto';

@Controller('video-authorities')
export class VideoAuthorityController {
  constructor(private readonly videoAuthorityService: VideoAuthorityService) {}

  // GET /api/video-authorities?userId=1
  @Get()
  async findByUser(@Query('userId') userId?: string) {
    if (!userId) return [];
    const id = parseInt(userId, 10);
    if (Number.isNaN(id)) return [];
    return this.videoAuthorityService.getByUserId(id);
  }

  // POST /api/video-authorities
  @Post()
  async updateUserAuthorities(@Body() body: any) {
    console.log('🔥 [Controller] updateUserAuthorities body:', body);

    const dto: UpdateUserVideoAuthorityDto = {
      userId: Number(body.userId),
      classGroups: (body.classGroups ?? []) as any,
      videoTypes: (body.videoTypes ?? []) as any,
    };

    console.log('🔥 [Controller] updateUserAuthorities dto:', dto);

    return this.videoAuthorityService.updateUserAuthorities(dto);
  }

  // DELETE /api/video-authorities/:id
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.videoAuthorityService.remove(id);
  }

  // =================================
  // 🔹 기기 관련 라우트
  // =================================

  // GET /api/video-authorities/devices?userId=1
  @Get('devices')
  async getUserDevices(@Query('userId') userId?: string) {
    if (!userId) return [];
    const id = parseInt(userId, 10);
    if (Number.isNaN(id)) return [];
    return this.videoAuthorityService.getDevicesByUserId(id);
  }

  // POST /api/video-authorities/devices/check
  // 재생 시도할 때 프론트에서 호출
  @Post('devices/check')
  async checkDevice(@Body() dto: CheckDeviceDto) {
    console.log('🔥 [Controller] checkDevice dto:', dto);

    const result = await this.videoAuthorityService.validateAndRegisterDevice(
      dto.userId,
      dto.deviceId,
      dto.deviceName,
    );

    return result;
  }

  // POST /api/video-authorities/devices/reset
  // 관리자에서 특정 회원 기기 전체 초기화
  @Post('devices/reset')
  async resetUserDevices(@Body() body: ResetUserDevicesDto) {
    console.log('🧹 [Controller] resetUserDevices body:', body);
    await this.videoAuthorityService.resetUserDevices(body.userId);
    return { success: true };
  }
}
