// src/file/file.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [
    // 디스크 말고 메모리 저장: file.buffer 사용해서 바로 S3로 보냄
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
