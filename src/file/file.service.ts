import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unlinkSync } from 'fs';
import { join } from 'path';

export interface FileRecord {
  id: number;
  name: string;
  type: string;
  size: string;
  upload_date: Date;
  download_url: string;
  uploader_id: number;
  uploader_name?: string;
}

interface CountResult {
  total: bigint;
}

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(file: Express.Multer.File, userId: number) {
    // 파일명 디코딩
    const decodedFileName = decodeURIComponent(file.originalname);
    
    const result = await this.prisma.files.create({
      data: {
        name: decodedFileName,
        type: file.mimetype,
        size: file.size.toString(),
        upload_date: new Date(),
        download_url: file.filename,
        uploader_id: userId
      }
    });

    return result;
  }

  async getFiles(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      this.prisma.files.findMany({
        skip,
        take: limit,
        orderBy: {
          upload_date: 'desc'
        },
        include: {
          user: {
            select: {
              mb_name: true
            }
          }
        }
      }),
      this.prisma.files.count()
    ]);

    return {
      files: files.map(file => ({
        ...file,
        uploader_name: file.user?.mb_name
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFileById(id: number) {
    const file = await this.prisma.files.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            mb_name: true
          }
        }
      }
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return {
      ...file,
      uploader_name: file.user?.mb_name
    };
  }

  async deleteFile(id: number) {
    const file = await this.prisma.files.findUnique({
      where: { id }
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete file from filesystem
    if (file.download_url) {
      const filePath = join(process.cwd(), 'uploads', file.download_url);
      try {
        unlinkSync(filePath);
      } catch (error) {
        console.error('Error deleting file from filesystem:', error);
      }
    }

    // Delete file record from database
    await this.prisma.files.delete({
      where: { id }
    });

    return { message: 'File deleted successfully' };
  }

  async searchFiles(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      this.prisma.files.findMany({
        where: {
          name: {
            contains: query
          }
        },
        skip,
        take: limit,
        orderBy: {
          upload_date: 'desc'
        },
        include: {
          user: {
            select: {
              mb_name: true
            }
          }
        }
      }),
      this.prisma.files.count({
        where: {
          name: {
            contains: query
          }
        }
      })
    ]);

    return {
      files: files.map(file => ({
        ...file,
        uploader_name: file.user?.mb_name
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
} 