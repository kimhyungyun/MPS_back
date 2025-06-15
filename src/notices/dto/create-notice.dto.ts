import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsBoolean()
  @IsOptional()
  is_important?: boolean;
} 