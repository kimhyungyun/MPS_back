import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// ✅ 첨부파일 DTO
export class CreateNoticeAttachmentDto {
  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

// ✅ 공지 생성 DTO
export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  is_important?: boolean;

  // ✅ 대표 이미지 (URL 기준)
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  // ✅ 첨부파일 목록
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNoticeAttachmentDto)
  attachments?: CreateNoticeAttachmentDto[];
}
