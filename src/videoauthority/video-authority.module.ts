import { Module } from '@nestjs/common';
import { VideoAuthorityService } from './video-authority.service';
import { VideoAuthorityController } from './video-authority.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [VideoAuthorityController],
  providers: [VideoAuthorityService, PrismaService],
  exports: [VideoAuthorityService], // 다른 모듈에서 권한 체크 쓸 수 있게 export
})
export class VideoAuthorityModule {}
