import {
  IsInt,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClassGroup } from '../../lecture/enum/class-group.enum';
import { LectureType } from '../../lecture/enum/lecture-type.enum';

export class UpdateUserVideoAuthorityDto {
  @IsInt()
  @Type(() => Number)
  userId: number;

  // A/B/S (멀티)
  @IsOptional()
  @IsArray()
  @IsEnum(ClassGroup, { each: true })
  classGroups?: ClassGroup[];

  // single, packageA~E (멀티)
  @IsOptional()
  @IsArray()
  @IsEnum(LectureType, { each: true })
  lectureTypes?: LectureType[];
}
