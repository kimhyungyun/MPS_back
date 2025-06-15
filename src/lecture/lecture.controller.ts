import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LectureService } from './lecture.service';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { SignedUrlService } from '../config/signed-url.service';

@Controller('lectures')
export class LectureController {
  constructor(
    private readonly lectureService: LectureService,
    private readonly signedUrlService: SignedUrlService
  ) {}

  @Post()
  create(@Body() createLectureDto: CreateLectureDto) {
    return this.lectureService.create(createLectureDto);
  }

  @Get()
  findAll() {
    return this.lectureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lectureService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLectureDto: UpdateLectureDto) {
    return this.lectureService.update(+id, updateLectureDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lectureService.remove(+id);
  }

  @Get(':id/signed-url')
  getSignedVideoUrl(@Param('id') id: string) {
    const videoPath = `/videos/${id}.m3u8`; // 혹은 DB에서 경로 조회
    const signedUrl = this.signedUrlService.generateSignedUrl(videoPath);
    return { signedUrl };
  }
} 