import { IsString, IsNotEmpty, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  mb_id: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  mb_password: string;
} 