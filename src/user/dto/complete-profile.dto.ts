// src/user/dto/complete-profile.dto.ts
import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsOptional()
  mb_hp?: string;

  @IsString()
  @IsOptional()
  mb_school?: string;

  @IsString()
  @IsOptional()
  mb_sex?: string;

  @IsString()
  @IsOptional()
  mb_birth?: string;

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

  // ✅ 필수 동의 (DB에는 저장 안 하고, 검증 + mb_10 플래그만 사용)
  @IsBoolean()
  @IsNotEmpty()
  agreePrivacy: boolean;
}
