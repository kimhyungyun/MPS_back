// src/notices/dto/update-notice.dto.ts
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NoticeAttachmentDto } from './notice-attachment.dto';

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  // 🔥 여기도 snake_case 로 통일 (프론트에서 is_important 로 보내도록)
  @IsOptional()
  @IsBoolean()
  is_important?: boolean;

  @IsOptional()
  @IsString()
  coverImageUrl?: string; // 새로 설정할 커버 URL

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeAttachmentDto)
  attachments?: NoticeAttachmentDto[];

  // 삭제할 첨부파일 id 목록 (지금 서비스에서는 전체 교체 방식이라 안 써도 됨)
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  deleteAttachmentIds?: number[];

  // 기존 커버 이미지 삭제 여부
  @IsOptional()
  @IsBoolean()
  removeCoverImage?: boolean;
}
