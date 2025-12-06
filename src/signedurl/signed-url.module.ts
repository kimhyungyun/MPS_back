// src/signedurl/signed-url.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { SignedUrlService } from './signed-url.service';
import { SignedUrlController } from './signed-url.controller';
import { LectureModule } from '@/lecture/lecture.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { VideoAuthorityModule } from '@/videoauthority/video-authority.module';

@Module({
  imports: [
    forwardRef(() => LectureModule),
    VideoAuthorityModule,
    PrismaModule,
  ],
  controllers: [SignedUrlController],
  providers: [SignedUrlService],
  exports: [SignedUrlService],
})
export class SignedUrlModule {}
