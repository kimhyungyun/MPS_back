import { Module, forwardRef } from '@nestjs/common';
import { SignedUrlService } from './signed-url.service';
import { SignedUrlController } from './signed-url.controller';
import { LectureModule } from '@/lecture/lecture.module';

@Module({
  imports: [
    forwardRef(() => LectureModule), // ✅ 여기만 forwardRef로 감싸기
  ],
  providers: [SignedUrlService],
  controllers: [SignedUrlController],
  exports: [SignedUrlService],
})
export class SignedUrlModule {}
