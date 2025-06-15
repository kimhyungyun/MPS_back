import { IsString, IsNotEmpty, IsNumber, IsEnum, IsUrl, IsOptional } from 'class-validator';
import { LectureType } from '../enum/lecture-type.enum';

export class CreateLectureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  instructorId: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsUrl()
  thumbnail_url: string;

  @IsUrl()
  video_url: string;

  @IsEnum(LectureType)
  type: LectureType;

  @IsNumber()
  categoryId: number;
}
