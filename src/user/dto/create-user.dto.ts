import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  mb_id: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  mb_password: string;

  @IsString()
  @IsOptional()
  mb_password2?: string;

  @IsString()
  @IsNotEmpty()
  mb_name: string;

  @IsString()
  @IsNotEmpty()
  mb_nick: string;

  @IsString()
  @IsNotEmpty()
  mb_email: string;

  @IsString()
  @IsOptional()
  mb_hp?: string;

  @IsString()
  @IsOptional()
  mb_sex?: string;

  @IsString()
  @IsOptional()
  mb_birth?: string;

  @IsString()
  @IsOptional()
  mb_addr1?: string;

  @IsString()
  @IsOptional()
  mb_addr2?: string;
}
