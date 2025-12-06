import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class FindIdDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
