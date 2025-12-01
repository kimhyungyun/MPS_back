import { IsString, IsOptional, Length, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @Length(6, 20)
  mb_password?: string;

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
  mb_school?: string;

  @IsString()
  @IsOptional()
  mb_homepage?: string;

  @IsEnum(UserRole)
  @IsOptional()
  mb_level?: UserRole;

  @IsString()
  @IsOptional()
  mb_sex?: string;

  @IsString()
  @IsOptional()
  mb_birth?: string;

  @IsString()
  @IsOptional()
  mb_tel?: string;

  @IsString()
  @IsOptional()
  mb_hp?: string;

  @IsString()
  @IsOptional()
  mb_certify?: string;

  @IsString()
  @IsOptional()
  mb_dupinfo?: string;

  @IsString()
  @IsOptional()
  mb_zip1?: string;

  @IsString()
  @IsOptional()
  mb_zip2?: string;

  @IsString()
  @IsOptional()
  mb_addr1?: string;

  @IsString()
  @IsOptional()
  mb_addr2?: string;

  @IsString()
  @IsOptional()
  mb_addr3?: string;

  @IsString()
  @IsOptional()
  mb_addr_jibeon?: string;

  @IsString()
  @IsOptional()
  mb_signature?: string;

  @IsString()
  @IsOptional()
  mb_recommend?: string;

  @IsString()
  @IsOptional()
  mb_profile?: string;
} 