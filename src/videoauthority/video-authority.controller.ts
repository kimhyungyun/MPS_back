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
}
