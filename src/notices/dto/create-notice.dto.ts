import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// ✅ 첨부파일 DTO (생성용)
export class CreateNoticeAttachmentDto {
  // 기존 첨부파일이면 id 들어올 수 있지만
  // create 시에는 보통 안 씀 (옵션)
  @IsOptional()
  @IsNumber()
  id?: number;

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
  is_important?: boolean; // 🔥 백엔드/DB 모두 snake_case 기준

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
