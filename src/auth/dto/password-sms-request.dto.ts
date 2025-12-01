import { IsString, IsNotEmpty } from 'class-validator';

export class PasswordSmsRequestDto {
  @IsString()
  @IsNotEmpty()
  mb_id: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
