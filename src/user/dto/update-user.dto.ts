import { IsString, IsOptional, Length, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @Length(6, 20)
  mb_password?: string;

  @IsString()
  @IsOptional()
  mb_password2?: string;

  @IsString()
  @IsOptional()
  mb_name?: string;

  @IsString()
  @IsOptional()
  mb_nick?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  mb_email?: string;

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