import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { post_category } from '@prisma/client';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  // 🔹 공지 생성
  async create(createNoticeDto: CreateNoticeDto, userId: number | null) {
    console.log(
      '>>> [NoticesService.create] dto:',
      createNoticeDto,
      'userId:',
      userId,
    );

    try {
      // 1) post 생성
      const post = await this.prisma.post.create({
        data: {
          title: createNoticeDto.title,
          content: createNoticeDto.content,
          category: post_category.notice, // ✅ enum
          userId, // 관리자 mb_no (null 가능)
          coverImageUrl: createNoticeDto.coverImageUrl ?? null,
          is_important: createNoticeDto.is_important ?? false,
        },
      });

      // 2) 첨부파일 생성 (있으면)
      if (
        Array.isArray(createNoticeDto.attachments) &&
        createNoticeDto.attachments.length > 0
      ) {
        await this.prisma.post_attachment.createMany({
          data: createNoticeDto.attachments.map((file) => ({
            postId: post.id,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileSize: file.fileSize ?? null,
            mimeType: file.mimeType ?? null,
          })),
        });
      }

      // 3) 최종 조회
      const result = await this.prisma.post.findUnique({
        where: { id: post.id },
        include: {
          attachments: true,
          g5_member: true,
        },
      });

      console.log('>>> [NoticesService.create] result:', result);
      return result;
    } catch (e) {
      console.error('>>> [NoticesService.create] error:', e);
      throw new InternalServerErrorException('Failed to create notice');
    }
  }

  // 🔹 공지 리스트
  async findAll() {
    console.log('>>> [NoticesService.findAll]');
    return this.prisma.post.findMany({
      where: {
        category: post_category.notice,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        attachments: true,
        g5_member: true,
      },
    });
  }

  // 🔹 공지 상세
  async findOne(id: number) {
    console.log('>>> [NoticesService.findOne] id:', id);
    return this.prisma.post.findFirst({
      where: {
        id,
        category: post_category.notice,
      },
      include: {
        attachments: true,
        g5_member: true,
      },
    });
  }

  // 🔹 공지 수정
  async update(id: number, updateNoticeDto: UpdateNoticeDto) {
    console.log(
      '>>> [NoticesService.update] id:',
      id,
      'dto:',
      updateNoticeDto,
    );

    // 🔥 프론트에서 보내는 구조 기준:
    // {
    //   title?: string;
    //   content?: string;
    //   is_important?: boolean;
    //   coverImageUrl?: string;
    //   attachments?: { id?, fileName, fileUrl, fileSize?, mimeType? }[];
    //   deleteAttachmentIds?: number[];   // (지금은 안 써도 됨)
    //   removeCoverImage?: boolean;
    // }
    const { attachments, deleteAttachmentIds, removeCoverImage, ...rest } =
      updateNoticeDto as any;

    try {
      // 1) post 기본 정보 수정
      const data: any = {};

      if (rest.title !== undefined) {
        data.title = rest.title;
      }
      if (rest.content !== undefined) {
        data.content = rest.content;
      }

      // ✅ 중요 여부 (snake_case 사용)
      if (rest.is_important !== undefined) {
        data.is_important = rest.is_important;
      }

      // ✅ 커버 이미지 처리
      // - removeCoverImage === true 면 무조건 null 로 세팅
      // - 아니고 coverImageUrl 이 넘어오면 그 값으로 세팅
      if (removeCoverImage) {
        data.coverImageUrl = null;
      } else if (rest.coverImageUrl !== undefined) {
        data.coverImageUrl = rest.coverImageUrl ?? null;
      }

      const post = await this.prisma.post.update({
        where: { id },
        data,
      });

      // 2) 첨부파일 전체 교체 (프론트에서 "남길 것 + 새로 추가할 것" 전부 보내줌)
      if (attachments) {
        // 🔥 기존 첨부 싹 지우고
        await this.prisma.post_attachment.deleteMany({
          where: { postId: id },
        });

        // 🔥 새로 온 목록 기준으로 다시 다 생성
        if (Array.isArray(attachments) && attachments.length > 0) {
          await this.prisma.post_attachment.createMany({
            data: attachments.map((file: any) => ({
              postId: id,
              fileName: file.fileName,
              fileUrl: file.fileUrl,
              fileSize: file.fileSize ?? null,
              mimeType: file.mimeType ?? null,
            })),
          });
        }
      }

      // 3) 최종 조회
      const result = await this.prisma.post.findUnique({
        where: { id: post.id },
        include: {
          attachments: true,
          g5_member: true,
        },
      });

      console.log('>>> [NoticesService.update] result:', result);
      return result;
    } catch (e) {
      console.error('>>> [NoticesService.update] error:', e);
      throw new InternalServerErrorException('Failed to update notice');
    }
  }

  // 🔹 공지 삭제
  async remove(id: number) {
    console.log('>>> [NoticesService.remove] id:', id);
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
