import { IsString, IsNotEmpty, IsOptional, Length, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';

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
  @IsNotEmpty()
  mb_name: string;

  @IsString()
  @IsNotEmpty()
  mb_nick: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  mb_email: string;

  @IsString()
  @IsNotEmpty()
  mb_school: string;

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
