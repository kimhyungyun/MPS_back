import {
  IsInt,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ClassGroup } from '../../lecture/enum/class-group.enum';
import { LectureType } from '../../lecture/enum/lecture-type.enum';

export class UpdateVideoAuthorityDto {
  @IsOptional()
  @IsEnum(ClassGroup)
  classGroup?: ClassGroup;

  @IsOptional()
  @IsEnum(LectureType)
  type?: LectureType;
}
