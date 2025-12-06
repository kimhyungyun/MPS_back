import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  BadRequestException,
  Delete,
  Param,
  ParseIntPipe,
  Req,
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

  /** GET /api/files?page=1&search=...  (자료실 목록) */
  @Get()
  async listDataroomFiles(
    @Query('page') page = '1',
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page as string, 10) || 1;

    const { files, totalPages } = await this.fileService.listDataroomFiles(
      pageNum,
      10,
      search,
    );

    return {
      success: true,
      data: {
        files,
        totalPages,
      },
    };
  }

  /** POST /api/files/upload  (자료실 업로드) */
  @Post('upload')
  @Roles(8)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 300 * 1024 * 1024,
      },
    }),
  )
  async uploadDataroom(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    const user = req.user;

    const saved = await this.fileService.uploadDataroomFile(file, user);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: saved.id,
        name: saved.originalName,
        type: saved.mimeType,
        size: saved.size.toString(),
        upload_date: saved.createdAt.toISOString(),
        s3_key: saved.key,
      },
    };
  }

  /** DELETE /api/files/:id  (자료실 삭제) */
  @Delete(':id')
  @Roles(8)
  async deleteDataroomFile(@Param('id', ParseIntPipe) id: number) {
    await this.fileService.deleteDataroomFile(id);

    return {
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.',
    };
  }

  /** GET /api/files/presigned?key=...  (자료실 다운로드용 presigned) */
  @Get('presigned')
  async getPresigned(@Query('key') key: string) {
    if (!key) {
      throw new BadRequestException('key 쿼리 파라미터가 필요합니다.');
    }

    const result = await this.fileService.getPresignedUrl(key, 600);

    return {
      success: true,
      data: result,
    };
  }

  /** 📌 공지사항 에디터 이미지 업로드
   *  POST /api/files/notice-image
   */
  @Post('notice-image')
  @Roles(8)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadNoticeImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    const user = req.user;

    const uploaded = await this.fileService.uploadNoticeImage(file, user);

    // 에디터가 쓸 최소 정보만 반환
    return {
      success: true,
      message: 'Notice image uploaded successfully',
      data: {
        key: uploaded.key,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
      },
    };
  }
}
