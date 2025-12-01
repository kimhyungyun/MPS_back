import { IsString, IsEmail, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  mb_name?: string;

  @IsEmail()
  @IsOptional()
  mb_email?: string;

  @IsString()
  @IsOptional()
  mb_password?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  mb_level?: number;

  @IsString()
  @IsOptional()
  mb_memo?: string;

  @IsString()
  @IsOptional()
  mb_signature?: string;

  @IsString()
  @IsOptional()
  mb_lost_certify?: string;

  @IsString()
  @IsOptional()
  mb_profile?: string;

  // ✅ 추가 필드들
  @IsString()
  @IsOptional()
  mb_school?: string;

  @IsString()
  @IsOptional()
  mb_addr1?: string;

  @IsString()
  @IsOptional()
  mb_addr2?: string;

  @IsString()
  @IsOptional()
  mb_hp?: string;
}

export class CreateMemberDto {
  @IsString()
  mb_id: string;

  @IsString()
  mb_name: string;

  @IsEmail()
  mb_email: string;

  @IsString()
  mb_password: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  mb_level?: number;

  @IsString()
  @IsOptional()
  mb_memo?: string;

  @IsString()
  @IsOptional()
  mb_signature?: string;

  @IsString()
  @IsOptional()
  mb_lost_certify?: string;

  @IsString()
  @IsOptional()
  mb_profile?: string;

  @IsString()
  @IsOptional()
  mb_school?: string;

  @IsString()
  @IsOptional()
  mb_addr1?: string;

  @IsString()
  @IsOptional()
  mb_addr2?: string;

  @IsString()
  @IsOptional()
  mb_hp?: string;
}
