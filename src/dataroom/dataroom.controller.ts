// import {
//   Controller,
//   Get,
//   Post,
//   Delete,
//   UseInterceptors,
//   UploadedFile,
//   UseGuards,
//   Query,
//   BadRequestException,
//   Param,
//   ParseIntPipe,
//   Req,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { FileService } from './file.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

// @Controller('dataroom')
// @UseGuards(JwtAuthGuard, RolesGuard)
// export class DataroomController {
//   constructor(private readonly fileService: FileService) {}

//   /** GET /api/dataroom?page=1&search=...  (자료실 목록) */
//   @Get()
//   async listDataroomFiles(
//     @Query('page') page = '1',
//     @Query('search') search?: string,
//   ) {
//     const pageNum = parseInt(page as string, 10) || 1;

//     const { files, totalPages } = await this.fileService.listDataroomFiles(
//       pageNum,
//       10,
//       search,
//     );

//     return {
//       success: true,
//       data: {
//         files,
//         totalPages,
//       },
//     };
//   }

//   /** POST /api/dataroom/upload  (자료실 업로드) */
//   @Post('upload')
//   @Roles(8)
//   @UseInterceptors(
//     FileInterceptor('file', {
//       limits: {
//         fileSize: 300 * 1024 * 1024, // 300MB
//       },
//     }),
//   )
//   async uploadDataroom(
//     @UploadedFile() file: Express.Multer.File,
//     @Req() req: any,
//   ) {
//     if (!file) {
//       throw new BadRequestException('파일이 필요합니다.');
//     }

//     const user = req.user;

//     const saved = await this.fileService.uploadDataroomFile(file, user);

//     return {
//       success: true,
//       message: 'File uploaded successfully',
//       data: {
//         id: saved.id,
//         name: saved.originalName,
//         type: saved.mimeType,
//         size: saved.size.toString(),
//         upload_date: saved.createdAt.toISOString(),
//         s3_key: saved.key,
//       },
//     };
//   }

//   /** DELETE /api/dataroom/:id  (자료실 삭제) */
//   @Delete(':id')
//   @Roles(8)
//   async deleteDataroomFile(@Param('id', ParseIntPipe) id: number) {
//     await this.fileService.deleteDataroomFile(id);

//     return {
//       success: true,
//       message: '파일이 성공적으로 삭제되었습니다.',
//     };
//   }
// }
