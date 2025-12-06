// src/video-authority/dto/create-video-authority.dto.ts
import { IsInt, IsEnum, IsOptional } from 'class-validator';
import { ClassGroup } from '../../lecture/enum/class-group.enum';
import { LectureType } from '../../lecture/enum/lecture-type.enum';

export class CreateVideoAuthorityDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsEnum(ClassGroup)
  classGroup?: ClassGroup;

  @IsOptional()
  @IsEnum(LectureType)
  type?: LectureType;
}
