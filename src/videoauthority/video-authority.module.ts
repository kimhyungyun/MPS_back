// src/video-authority/video-authority.module.ts
import { Module } from '@nestjs/common';
import { VideoAuthorityService } from './video-authority.service';
import { VideoAuthorityController } from './video-authority.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [VideoAuthorityController],
  providers: [VideoAuthorityService, PrismaService],
  exports: [VideoAuthorityService],
})
export class VideoAuthorityModule {}
