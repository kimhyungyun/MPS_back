import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LectureService } from './lecture.service';
import { LectureController } from './lecture.controller';
import { Lecture } from './entity/lecture.entity';
import { User } from '@/user/entity/user.entity';
import { LectureCategory } from './entity/lecture-category.entity';
import { SignedUrlModule } from '@/signedurl/signed-url.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lecture, User, LectureCategory]),
    SignedUrlModule,
  ],
  controllers: [LectureController],
  providers: [LectureService],
  exports: [LectureService],
})
export class LectureModule {}
