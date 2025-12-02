import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LectureType } from '../enum/lecture-type.enum';
import { ClassGroup } from '../enum/class-group.enum';

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

  @IsString()
  @IsNotEmpty()
  thumbnail_url: string;

  @IsEnum(LectureType)
  type: LectureType;

  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  // 🔹 A/B/S
  @IsOptional()
  @IsEnum(ClassGroup)
  classGroup?: ClassGroup;

  // 🔹 비디오 폴더 (예: "math/level1")
  @IsOptional()
  @IsString()
  video_folder?: string;

  // 🔹 비디오 파일명 (예: "lesson1.m3u8")
  @IsOptional()
  @IsString()
  video_name?: string;
}
