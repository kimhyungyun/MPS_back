import { ClassGroup } from '../../lecture/enum/class-group.enum';
import { LectureType } from '../../lecture/enum/lecture-type.enum';

export class VideoAuthorityResponseDto {
  id: number;
  userId: number;
  classGroup?: ClassGroup;
  type?: LectureType;
  created_at: Date;
  updated_at: Date;
}
