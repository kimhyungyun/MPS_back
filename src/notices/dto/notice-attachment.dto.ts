// src/notices/dto/notice-attachment.dto.ts

// 공지 첨부파일 DTO (update 시 사용)
// validation은 상위 DTO에서만 체크해도 충분해서 여기서는 타입용으로만 사용
export class NoticeAttachmentDto {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
}
