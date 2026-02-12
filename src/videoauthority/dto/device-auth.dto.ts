// src/video-authority/dto/device-auth.dto.ts
import { IsInt, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckDeviceDto {
  @IsInt()
  @Type(() => Number)
  userId: number;

  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class ResetUserDevicesDto {
  @IsInt()
  @Type(() => Number)
  userId: number;
}
