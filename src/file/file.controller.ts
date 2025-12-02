// src/file/file.controller.ts
import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * 관리자 전용 파일 업로드
   * POST /api/files/upload
   * form-data: file: <파일>
   */
  @Post('upload')
  @Roles(8) // mb_level >= 8
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 300 * 1024 * 1024, // 300MB (nginx랑 맞춤)
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    const result = await this.fileService.uploadNoticeFile(file, 'notices');

    // result: { key, fileName, fileSize, mimeType }
    return {
      success: true,
      message: 'File uploaded successfully',
      data: result,
    };
  }

  /**
   * 다운로드용 presigned GET URL 발급
   * GET /api/files/presigned?key=...
   */
  @Get('presigned')
  async getPresigned(@Query('key') key: string) {
    if (!key) {
      throw new BadRequestException('key 쿼리 파라미터가 필요합니다.');
    }

    const result = await this.fileService.getPresignedUrl(key, 600);

    return {
      success: true,
      data: result, // { url }
    };
  }
}
