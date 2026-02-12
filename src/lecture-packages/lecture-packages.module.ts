// src/lecture-packages/lecture-packages.module.ts
import { Module } from '@nestjs/common';
import { LecturePackagesController } from './lecture-packages.controller';
import { LecturePackagesService } from './lecture-packages.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LecturePackagesController],
  providers: [LecturePackagesService],
})
export class LecturePackagesModule {}
