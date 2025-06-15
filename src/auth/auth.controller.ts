import { Controller, Post, Body, UseGuards, Get, Request, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.authService.signup(createUserDto);
    } catch (error) {
      console.error('Signup controller error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || '회원가입 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      console.error('Login controller error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || '로그인에 실패했습니다.',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      const user = await this.authService.getProfile(req.user.mb_id);
      return {
        success: true,
        data: {
          mb_id: user.mb_id,
          mb_name: user.mb_name,
          mb_nick: user.mb_nick,
          mb_level: user.mb_level,
          isAdmin: user.mb_nick === '관리자' || user.mb_nick === '최고관리자'
        }
      };
    } catch (error) {
      throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다.');
    }
  }
} 