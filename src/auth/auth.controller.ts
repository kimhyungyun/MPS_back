import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpException,
  UnauthorizedException,
  HttpCode,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { FindIdDto } from './dto/find-id.dto';
import { PasswordSmsRequestDto } from './dto/password-sms-request.dto';
import { PasswordSmsVerifyDto } from './dto/password-sms-verify.dto';
import { PasswordResetDto } from './dto/password-reset.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private normalizePhone(phone: string) {
    const raw = phone ?? '';
    const digits = raw.replace(/\D/g, '');

    if (!digits) {
      return { digits: '', dashed: '' };
    }

    const dashed =
      digits.length >= 10
        ? digits.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')
        : digits;

    return { digits, dashed };
  }

  // 회원가입
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.authService.signup(createUserDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('회원가입 중 오류가 발생했습니다.', 500);
    }
  }

  // 로그인
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('로그인에 실패했습니다.', 401);
    }
  }

  // 아이디 중복확인
  @Get('check-id')
  async checkId(@Query('mb_id') mb_id: string) {
    const available = await this.authService.checkId(mb_id);
    return {
      available,
      message: available
        ? '사용 가능한 아이디입니다.'
        : '이미 사용 중인 아이디입니다.',
    };
  }

  // 닉네임 중복확인
  @Get('check-nick')
  async checkNick(@Query('mb_nick') mb_nick: string) {
    const available = await this.authService.checkNick(mb_nick);
    return {
      available,
      message: available
        ? '사용 가능한 닉네임입니다.'
        : '이미 사용 중인 닉네임입니다.',
    };
  }

  // ✅ 내 프로필 조회 (회원가입 필드 포함)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      const user = await this.authService.getProfile(req.user.mb_id);

      const mbLevel = Number(user.mb_level ?? 0);

      return {
        success: true,
        data: {
          // 공통
          mb_no: (user as any).mb_no ?? null,
          mb_id: user.mb_id,
          mb_level: mbLevel,
          isAdmin: mbLevel >= 8,

          // 회원가입 필드들
          mb_name: (user as any).mb_name ?? null,
          mb_nick: (user as any).mb_nick ?? null,
          mb_email: (user as any).mb_email ?? null,
          mb_hp: (user as any).mb_hp ?? null,

          mb_sex: (user as any).mb_sex ?? null,
          mb_birth: (user as any).mb_birth ?? null,

          mb_school: (user as any).mb_school ?? null,
          mb_zip1: (user as any).mb_zip1 ?? null,
          mb_addr1: (user as any).mb_addr1 ?? null,
          mb_addr2: (user as any).mb_addr2 ?? null,
        },
      };
    } catch {
      throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    }
  }

  // 🔍 아이디 찾기
  @Post('find-id')
  async findId(@Body() dto: FindIdDto) {
    const result = await this.authService.findId(dto.name, dto.email);

    return {
      success: true,
      ...result,
      message: '입력하신 정보와 일치하는 아이디입니다.',
    };
  }

  // 📲 비밀번호 찾기 - 1단계: SMS 코드 요청
  @Post('password/sms/request')
  async requestPasswordSms(@Body() dto: PasswordSmsRequestDto) {
    const { digits, dashed } = this.normalizePhone(dto.phone);

    await this.authService.requestPasswordSms(dto.mb_id, dashed, digits);

    return {
      success: true,
      message: '인증번호를 발송했습니다.',
    };
  }

  // 📲 비밀번호 찾기 - 2단계: 코드 검증
  @Post('password/sms/verify')
  async verifyPasswordSms(@Body() dto: PasswordSmsVerifyDto) {
    const resetToken = await this.authService.verifyPasswordSms(
      dto.mb_id,
      dto.code,
    );

    return {
      success: true,
      resetToken,
      message: '인증이 완료되었습니다.',
    };
  }

  // 🔐 비밀번호 찾기 - 3단계: 비밀번호 재설정
  @Post('password/reset')
  async resetPassword(@Body() dto: PasswordResetDto) {
    await this.authService.resetPassword(dto.resetToken, dto.newPassword);

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }
}
