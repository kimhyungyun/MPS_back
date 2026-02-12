import { IsOptional, IsString } from 'class-validator';

export class ListDataroomQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
