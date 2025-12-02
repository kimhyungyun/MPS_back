import { IsString, IsOptional, MaxLength } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @MaxLength(255)
  deviceId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;
}
