// src/lecture/lecture.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
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
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';

interface JwtUser {
  userId: number;
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

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateLectureDto, @Req() req: RequestWithUser) {
    return this.lectureService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLectureDto,
  ) {
    return this.lectureService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lectureService.remove(id);
  }

  @Get(':id/play-auth')
  @UseGuards(JwtAuthGuard)
  async issueCloudfrontCookie(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
    @Req() req: RequestWithUser,
  ) {
    const lecture = await this.lectureService.findEntityById(id);

    if (!lecture.video_folder || !lecture.video_name) {
      throw new NotFoundException('Lecture video path missing.');
    }

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