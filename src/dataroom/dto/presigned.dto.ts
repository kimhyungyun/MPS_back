import { IsString } from 'class-validator';

export class DataroomPresignedQueryDto {
  @IsString()
  key: string;
}
