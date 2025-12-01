// src/notices/notices.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  // 🔹 공지 생성
  async create(createNoticeDto: CreateNoticeDto) {
    const {
      title,
      content,
      coverImageUrl,
      attachments,
      is_important,
    } = createNoticeDto;

    return this.prisma.$transaction(async (tx) => {
      // 1) post 생성
      const post = await tx.post.create({
        data: {
          title,
          content,
          category: 'notice',
          userId: null,                     // 나중에 JWT에서 user 꺼내서 넣고 싶으면 여기 수정
          coverImageUrl: coverImageUrl ?? null,
          is_important: is_important ?? false,
        },
      });

      // 2) 첨부파일 생성
      if (attachments && attachments.length > 0) {
        await tx.post_attachment.createMany({
          data: attachments.map((file) => ({
            postId: post.id,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileSize: file.fileSize ?? null,
            mimeType: file.mimeType ?? null,
          })),
        });
      }

      // 3) 첨부 포함해서 다시 조회
      return tx.post.findUnique({
        where: { id: post.id },
        include: {
          attachments: true,
        },
      });
    });
  }

  // 🔹 공지 리스트
  async findAll() {
    return this.prisma.post.findMany({
      where: {
        category: 'notice',
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        attachments: true,
        g5_member: true,  // 작성자 이름 필요하면 사용 (mb_name)
      },
    });
  }

  // 🔹 공지 상세
  async findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        attachments: true,
        g5_member: true,
      },
    });
  }

  // 🔹 공지 수정
  async update(id: number, updateNoticeDto: UpdateNoticeDto) {
    const { attachments, ...rest } = updateNoticeDto;

    return this.prisma.$transaction(async (tx) => {
      // 1) post 기본 정보 수정
      const post = await tx.post.update({
        where: { id },
        data: {
          // rest 안에 title, content, coverImageUrl, is_important 들어있음
          title: rest.title,
          content: rest.content,
          coverImageUrl: rest.coverImageUrl ?? null,
          // undefined면 필드 안 바뀌게 하기 위해 조건부로만 넣고 싶으면 아래처럼도 가능
          ...(rest.is_important !== undefined && {
            is_important: rest.is_important,
          }),
        },
      });

      // 2) 첨부파일 전체 교체 (단순하게)
      if (attachments) {
        // 기존 첨부 다 삭제
        await tx.post_attachment.deleteMany({
          where: { postId: id },
        });

        // 새 첨부 넣기
        if (attachments.length > 0) {
          await tx.post_attachment.createMany({
            data: attachments.map((file) => ({
              postId: id,
              fileName: file.fileName,
              fileUrl: file.fileUrl,
              fileSize: file.fileSize ?? null,
              mimeType: file.mimeType ?? null,
            })),
          });
        }
      }

      // 3) 수정된 결과 다시 조회
      return tx.post.findUnique({
        where: { id: post.id },
        include: {
          attachments: true,
          g5_member: true,
        },
      });
    });
  }

  // 🔹 공지 삭제
  async remove(id: number) {
    // post_attachment는 onDelete: Cascade라면 자동 삭제됨
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
