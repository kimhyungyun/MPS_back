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
export class AuthController {  // 🔥 이 이름이 AuthModule이랑 매칭됨
  constructor(private readonly authService: AuthService) {}

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
      message: available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.',
    };
  }

  // 닉네임 중복확인
  @Get('check-nick')
  async checkNick(@Query('mb_nick') mb_nick: string) {
    const available = await this.authService.checkNick(mb_nick);
    return {
      available,
      message: available ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.',
    };
  }

  // 내 프로필 조회
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      const user = await this.authService.getProfile(req.user.mb_id);
      const mbLevel = Number(user.mb_level);

      return {
        success: true,
        data: {
          mb_id: user.mb_id,
          mb_name: user.mb_name,
          mb_nick: user.mb_nick,
          mb_level: mbLevel,
          isAdmin: mbLevel >= 8,
        },
      };
    } catch {
      throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    }
  }

  // 🔍 아이디 찾기
  @Post('find-id')
  async findId(@Body() dto: FindIdDto) {
    const result = await this.authService.findId(dto.name, dto.phone);
    return {
      success: true,
      ...result, // maskedUserId
      message: '입력하신 휴대폰 번호로 아이디 정보를 전송했습니다.',
    };
  }

  // 📲 비밀번호 찾기 - 1단계: SMS 코드 요청
  @Post('password/sms/request')
  async requestPasswordSms(@Body() dto: PasswordSmsRequestDto) {
    await this.authService.requestPasswordSms(dto.mb_id, dto.phone);
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
