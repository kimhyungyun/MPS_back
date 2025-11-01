import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LectureType } from '../enum/lecture-type.enum';

export class CreateLectureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsString() // 변경: 단순 문자열 URL 체크 안 함
  @IsNotEmpty()
  thumbnail_url: string;

  @IsString() // 변경: video_url은 videoId가 포함된 문자열일 수 있음
  @IsNotEmpty()
  video_url: string;

  @IsEnum(LectureType)
  type: LectureType;

  @Type(() => Number)
  @IsNumber()
  categoryId: number;
}
