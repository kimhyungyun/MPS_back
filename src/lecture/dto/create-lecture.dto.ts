import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LectureType } from '../enum/lecture-type.enum';
import { ClassGroup } from '../enum/class-group.enum';

export class CreateLectureDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsString()
  @IsNotEmpty()
  thumbnail_url!: string;

  @IsEnum(LectureType)
  type!: LectureType;

  @Type(() => Number)
  @IsNumber()
  categoryId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  instructorId?: number;

  @IsOptional()
  @IsEnum(ClassGroup)
  classGroup?: ClassGroup;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(3)
  day?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  video_folder?: string;

  @IsOptional()
  @IsString()
  video_name?: string;
}