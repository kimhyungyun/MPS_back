// src/signedurl/signed-url.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Res,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { SignedUrlService } from './signed-url.service';
import { LectureService } from '@/lecture/lecture.service';
import { VideoAuthorityService } from '@/videoauthority/video-authority.service';

interface JwtUser {
  userId: number;
  mb_id: string;
  mb_level: number;
  mb_nick: string;
}

type RequestWithUser = Request & { user: JwtUser };

@Controller('signed-urls')
export class SignedUrlController {
  constructor(
    private readonly signedUrlService: SignedUrlService,
    private readonly lectureService: LectureService,
    private readonly videoAuthorityService: VideoAuthorityService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('lecture/:id')
  async issueForLecture(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1) 강의 조회
    const lecture = await this.lectureService.findOne(id);

    if (!lecture?.video_folder || !lecture?.video_name) {
      throw new NotFoundException('Lecture video path is missing.');
    }

    // 2) JWT 유저 정보
    const jwtUser = req.user;
    console.log('🔥 JWT USER:', jwtUser);

    const userId = jwtUser?.userId;
    if (!userId) {
      throw new ForbiddenException('회원 정보를 찾을 수 없습니다.');
    }

    // 3) 권한 체크
    const canWatch = await this.videoAuthorityService.canWatchLecture(
      userId,
      id,
    );
    console.log('🔥 canWatchLecture:', { userId, lectureId: id, canWatch });

    if (!canWatch) {
      throw new ForbiddenException('이 강의를 시청할 권한이 없습니다.');
    }

    // 4) CloudFront Signed Cookie 세팅
    await this.signedUrlService.setCloudFrontSignedCookie(
      res,
      lecture.video_folder,
      lecture.video_name,
    );

    // 5) 응답
    return {
      ok: true,
      streamUrl: this.signedUrlService.buildStreamUrl(
        lecture.video_folder,
        lecture.video_name,
      ),
      expiresInSec: Number(
        process.env.CLOUDFRONT_POLICY_TTL_SECONDS || 1800,
      ),
    };
  }
}
