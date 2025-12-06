// src/video-authority/dto/update-user-video-authority-dto.ts
import { IsInt, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassGroup } from '../../lecture/enum/class-group.enum';
import { LectureType } from '../../lecture/enum/lecture-type.enum';

export class UpdateUserVideoAuthorityDto {
  @IsInt()
  @Type(() => Number)
  userId: number;

  @IsOptional()
  @IsArray()
  @IsEnum(ClassGroup, { each: true })
  classGroups?: ClassGroup[];

  @IsOptional()
  @IsArray()
  @IsEnum(LectureType, { each: true })
  videoTypes?: LectureType[];
}
