import { IsString, IsNotEmpty } from 'class-validator';

export class PasswordSmsVerifyDto {
  @IsString()
  @IsNotEmpty()
  mb_id: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
