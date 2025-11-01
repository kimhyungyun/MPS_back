import { Controller, Get, Param, ParseIntPipe, UseGuards, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { SignedUrlService } from './signed-url.service';
import { LectureService } from '@/lecture/lecture.service';

@Controller('signed-urls')
export class SignedUrlController {
  constructor(
    private readonly signedUrlService: SignedUrlService,
    private readonly lectureService: LectureService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('lecture/:id')
  async issueForLecture(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const lecture = await this.lectureService.findOne(id);

    if (!lecture?.video_folder || !lecture?.video_name) {
      throw new NotFoundException('Lecture video path is missing.');
    }

await this.signedUrlService.setCloudFrontSignedCookie(
  res,
  lecture.video_folder,
  lecture.video_name
);


    return res.json({
      ok: true,
      streamUrl: this.signedUrlService.buildStreamUrl(
        lecture.video_folder,
        lecture.video_name
      ),
      expiresInSec: Number(process.env.CLOUDFRONT_POLICY_TTL_SECONDS || 1800),
    });
  }
}
