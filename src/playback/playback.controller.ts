import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

// ✅ 실제 경로에 맞게 수정 (device 폴더)
import { DevicesService } from '../device/devices.service';
import { RegisterDeviceDto } from '../device/dto/register-device.dto';

// ✅ 네가 이미 가지고 있는 JWT 가드 사용
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('videos')
export class PlaybackController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post(':videoId/play')
  async playVideo(
    @Param('videoId') videoId: string,
    @Body() body: RegisterDeviceDto,
    @Req() req: Request,
  ) {
    // ✅ JWT에서 들어온 user 사용 (타입은 any로 두고 나중에 필요하면 interface 정의)
    const user: any = req.user;

    if (!user || !user.id) {
      // 혹시라도 user정보가 비어있으면 에러
      throw new Error('로그인 정보가 없습니다.');
    }

    // 1) 기기 검증 + 자동 등록 (2대 제한)
    await this.devicesService.verifyAndRegisterDevice(user.id, body);

    // 2) 여기서 실제 스트리밍 토큰 발급 (VdoCipher OTP나 자체 JWT 로직으로 교체)
    const playToken = 'example-token'; // TODO: 실제 구현으로 바꿔라

    return {
      videoId,
      playToken,
    };
  }
}
