import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unlinkSync } from 'fs';
import { join } from 'path';

export interface FileRecord {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: Date;
  userId?: number;
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
    
    const result = await this.prisma.post.create({
      data: {
        title: decodedFileName,
        content: `File: ${file.filename}, Type: ${file.mimetype}, Size: ${file.size}`,
        category: 'free', // 파일은 free 카테고리로 저장
        userId: userId
      }
    });

    return result;
  }

  async getFiles(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          category: 'free' // 파일로 저장된 게시물만 조회
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          g5_member: {
            select: {
              mb_name: true
            }
          }
        }
      }),
      this.prisma.post.count({
        where: {
          category: 'free'
        }
      })
    ]);

    return {
      files: files.map(file => ({
        id: file.id,
        name: file.title,
        type: file.content.includes('Type:') ? file.content.split('Type: ')[1].split(',')[0] : '',
        size: file.content.includes('Size:') ? file.content.split('Size: ')[1] : '',
        upload_date: file.created_at,
        download_url: file.content.includes('File:') ? file.content.split('File: ')[1].split(',')[0] : '',
        uploader_id: file.userId,
        uploader_name: file.g5_member?.mb_name
      })),
      total,
      page,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  async getFileById(id: number) {
    const file = await this.prisma.post.findUnique({
      where: { id },
      include: {
        g5_member: {
          select: {
            mb_name: true
          }
        }
      }
    });

    if (!file || file.category !== 'free') {
      throw new NotFoundException('File not found');
    }

    return {
      id: file.id,
      name: file.title,
      type: file.content.includes('Type:') ? file.content.split('Type: ')[1].split(',')[0] : '',
      size: file.content.includes('Size:') ? file.content.split('Size: ')[1] : '',
      upload_date: file.created_at,
      download_url: file.content.includes('File:') ? file.content.split('File: ')[1].split(',')[0] : '',
      uploader_id: file.userId,
      uploader_name: file.g5_member?.mb_name
    };
  }

  async deleteFile(id: number) {
    const file = await this.prisma.post.findUnique({
      where: { id }
    });

    if (!file || file.category !== 'free') {
      throw new NotFoundException('File not found');
    }

    // Delete file from filesystem
    if (file.content.includes('File:')) {
      const fileName = file.content.split('File: ')[1].split(',')[0];
      const filePath = join(process.cwd(), 'uploads', fileName);
      try {
        unlinkSync(filePath);
      } catch (error) {
        console.error('Error deleting file from filesystem:', error);
      }
    }

    // Delete file record from database
    await this.prisma.post.delete({
      where: { id }
    });

    return { message: 'File deleted successfully' };
  }

  async searchFiles(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [files, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          category: 'free',
          title: {
            contains: query
          }
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          g5_member: {
            select: {
              mb_name: true
            }
          }
        }
      }),
      this.prisma.post.count({
        where: {
          category: 'free',
          title: {
            contains: query
          }
        }
      })
    ]);

    return {
      files: files.map(file => ({
        id: file.id,
        name: file.title,
        type: file.content.includes('Type:') ? file.content.split('Type: ')[1].split(',')[0] : '',
        size: file.content.includes('Size:') ? file.content.split('Size: ')[1] : '',
        upload_date: file.created_at,
        download_url: file.content.includes('File:') ? file.content.split('File: ')[1].split(',')[0] : '',
        uploader_id: file.userId,
        uploader_name: file.g5_member?.mb_name
      })),
      total,
      page,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }
} 