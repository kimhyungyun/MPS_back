import { Controller, Get, Post, Delete, Param, UseInterceptors, UploadedFile, UseGuards, Query, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Response } from 'express';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      const result = await this.fileService.uploadFile(file, 1); // TODO: Get actual user ID
      return res.json({
        success: true,
        message: 'File uploaded successfully',
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file',
        error: error.message
      });
    }
  }

  @Get()
  async getFiles(@Res() res: Response, @Query('page') page: number = 1, @Query('search') search?: string) {
    try {
      const result = search
        ? await this.fileService.searchFiles(search, page)
        : await this.fileService.getFiles(page);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch files',
        error: error.message
      });
    }
  }

  @Get(':id')
  async getFile(@Res() res: Response, @Param('id') id: string) {
    try {
      const file = await this.fileService.getFileById(Number(id));
      return res.json({
        success: true,
        data: file
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
        error: error.message
      });
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async deleteFile(@Res() res: Response, @Param('id') id: string) {
    try {
      await this.fileService.deleteFile(Number(id));
      return res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: error.message
      });
    }
  }
} 