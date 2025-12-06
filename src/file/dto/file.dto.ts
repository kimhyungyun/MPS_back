// src/file/dto/file.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class FileUserDto {
  @ApiProperty()
  mb_nick: string;
}

export class DataroomFileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string; // originalName

  @ApiProperty()
  type: string; // mimeType

  @ApiProperty()
  size: string; // 문자열 (bytes)

  @ApiProperty()
  upload_date: string; // ISO

  @ApiProperty()
  s3_key: string; // S3 key

  @ApiProperty({ required: false, type: () => FileUserDto })
  user?: FileUserDto;
}

export class DataroomFileListDto {
  @ApiProperty({ type: () => [DataroomFileDto] })
  files: DataroomFileDto[];

  @ApiProperty()
  totalPages: number;
}

export class PresignedUrlDto {
  @ApiProperty()
  url: string;
}
