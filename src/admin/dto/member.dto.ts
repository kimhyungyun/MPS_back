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
  @Transform(({ value }) => parseInt(value))
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
  @Transform(({ value }) => parseInt(value))
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
} 