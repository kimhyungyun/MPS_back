// src/lecture/lecture.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Res,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { LectureService } from './lecture.service';
import { Response, Request } from 'express';
import { SignedUrlService } from '@/signedurl/signed-url.service';

interface JwtUser {
  userId: number;   // ✅ JwtStrategy 에 맞게
  mb_id: string;
  mb_level: number;
  mb_nick: string;
}

type RequestWithUser = Request & { user: JwtUser };

@Controller('lectures')
export class LectureController {
  constructor(
    private readonly lectureService: LectureService,
    private readonly signedUrlService: SignedUrlService,
  ) {}

  @Get()
  findAll() {
    return this.lectureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lectureService.findOne(id);
  }

  @Get(':id/play-auth')
  @UseGuards(JwtAuthGuard)
  async issueCloudfrontCookie(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
    @Req() req: RequestWithUser,
  ) {
    const lecture = await this.lectureService.findOne(id);

    if (!lecture.video_folder || !lecture.video_name) {
      throw new NotFoundException('Lecture video path missing.');
    }

    // 필요하면 여기서 req.user.userId 로 뭔가 할 수 있음
    console.log('🔑 PLAY AUTH USER:', req.user);

    await this.signedUrlService.setCloudFrontSignedCookie(
      res,
      lecture.video_folder,
      lecture.video_name,
    );

    return {
      ok: true,
      streamUrl: this.signedUrlService.buildStreamUrl(
        lecture.video_folder,
        lecture.video_name,
      ),
      ttlSec: Number(process.env.CLOUDFRONT_POLICY_TTL_SECONDS || 1800),
    };
  }
}
