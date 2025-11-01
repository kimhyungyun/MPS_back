import { Controller, Get, Param, ParseIntPipe, UseGuards, Res, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { LectureService } from './lecture.service';
import { Response } from 'express';
import { SignedUrlService } from '@/signedurl/signed-url.service';


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
  ) {
    const lecture = await this.lectureService.findOne(id);

    if (!lecture.video_folder || !lecture.video_name) {
      throw new NotFoundException('Lecture video path missing.');
    }

await this.signedUrlService.setCloudFrontSignedCookie(
  res,
  lecture.video_folder,
  lecture.video_name
);

    return {
      ok: true,
      streamUrl: this.signedUrlService.buildStreamUrl(
        lecture.video_folder,
        lecture.video_name
      ),
      ttlSec: Number(process.env.CLOUDFRONT_POLICY_TTL_SECONDS || 1800),
    };
  }
}
