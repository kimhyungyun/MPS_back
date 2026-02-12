import {
  Controller,
  Get,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  BadRequestException,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DataroomService } from './dataroom.service';
import { DataroomKind } from '@prisma/client';

@Controller('dataroom')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataroomController {
  constructor(private readonly dataroomService: DataroomService) {}

  // room=data1|data2 → enum 으로 변환
  private parseRoom(room?: string): DataroomKind {
    if (room && room.toLowerCase() === 'data2') return DataroomKind.DATA2;
    return DataroomKind.DATA1;
  }

  /** GET /api/dataroom?page=1&search=...&room=data1|data2 */
  @Get()
  async listDataroomFiles(
    @Query('page') page = '1',
    @Query('search') search?: string,
    @Query('room') room?: string,
  ) {
    const pageNum = parseInt(page as string, 10) || 1;
    const kind = this.parseRoom(room);

    const { files, totalPages } =
      await this.dataroomService.listDataroomFiles(kind, pageNum, 10, search);

    return {
      success: true,
      data: {
        files,
        totalPages,
      },
    };
  }

  /** 허용할 파일 타입 (pptx, ppt, pdf, hwp 등) */
  private readonly allowedMimeTypes = [
    'application/pdf',

    // PPT / PPTX
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',

    // HWP
    'application/x-hwp',
    'application/haansofthwp',

    // 워드/엑셀
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    // 기타 (이미지, 텍스트 등)
    'image/png',
    'image/jpeg',
    'image/gif',
    'text/plain',

    'application/octet-stream',
  ];

  /** POST /api/dataroom/upload?room=data1|data2 */
  @Post('upload')
  @Roles(8)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 300 * 1024 * 1024, // 300MB
      },
    }),
  )
  async uploadDataroom(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Query('room') room?: string,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    // 🔥 1) 확장자 기반 허용 리스트
    const allowedExt = [
      'pdf',
      'ppt',
      'pptx',
      'hwp',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'png',
      'jpg',
      'jpeg',
      'gif',
      'txt',
    ];

    const originalName = file.originalname || '';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    if (!allowedExt.includes(ext)) {
      console.log('BLOCKED EXT:', { originalName, ext, mimetype: file.mimetype });
      throw new BadRequestException('허용되지 않은 파일 형식입니다.');
    }

    const kind = this.parseRoom(room);
    const user = req.user;

    const saved = await this.dataroomService.uploadDataroomFile(
      file,
      user,
      kind,
    );

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: saved.id,
        name: saved.originalName,
        type: saved.mimeType,
        size: saved.size?.toString() ?? '0',
        upload_date: saved.createdAt.toISOString(),
        s3_key: saved.key,
      },
    };
  }


  /** DELETE /api/dataroom/:id */
  @Delete(':id')
  @Roles(8)
  async deleteDataroomFile(@Param('id', ParseIntPipe) id: number) {
    await this.dataroomService.deleteDataroomFile(id);

    return {
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.',
    };
  }

  /** GET /api/dataroom/presigned?key=... */
  @Get('presigned')
  async getPresigned(@Query('key') key: string) {
    if (!key) {
      throw new BadRequestException('key 쿼리 파라미터가 필요합니다.');
    }

    const result = await this.dataroomService.getPresignedUrl(key, 600);

    return {
      success: true,
      data: result,
    };
  }
}
