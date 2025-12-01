import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class PasswordResetDto {
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
