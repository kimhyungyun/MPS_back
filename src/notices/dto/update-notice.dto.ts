import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateNoticeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isImportant?: boolean;
} 