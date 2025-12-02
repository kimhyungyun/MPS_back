// src/notices/dto/update-notice.dto.ts
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
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

  @IsOptional()
  @IsBoolean()
  isImportant?: boolean; // 프론트에서 isImportant 로 보냄

  @IsOptional()
  @IsString()
  coverImageUrl?: string; // 새로 설정할 커버 URL

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeAttachmentDto)
  attachments?: NoticeAttachmentDto[];

  // 🔥 프론트에서 보내는 "삭제할 첨부파일 id 목록"
  @IsOptional()
  @IsArray()
  deleteAttachmentIds?: number[];

  // 🔥 프론트에서 보내는 "기존 커버 이미지 삭제 여부"
  @IsOptional()
  @IsBoolean()
  removeCoverImage?: boolean;
}
