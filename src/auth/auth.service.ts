import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private isSha256Format(password: string): boolean {
    return password.startsWith('sha256:');
  }

  private verifySha256Hashed(inputPassword: string, storedHash: string): boolean {
    try {
      // sha256:12000:DiC5Zl0OU5Ns+ZgKtcdkOUdLdda6rAzY:byZlD13u0bzIkCixJ3ee8GolOo25ebBU 형식 파싱
      const parts = storedHash.split(':');
      if (parts.length !== 4) return false;
      
      const [prefix, iterationsStr, salt, storedHashValue] = parts;
      const iterations = parseInt(iterationsStr);
      
      // 입력된 비밀번호로 해시 생성
      const crypto = require('crypto');
      const derivedKey = crypto.pbkdf2Sync(
        inputPassword,
        salt,
        iterations,
        24, // 32에서 24로 변경 (192비트)
        'sha256'
      );
      
      // base64로 변환하고 패딩 제거
      const inputHash = derivedKey.toString('base64').replace(/=+$/, '');
      console.log('Input hash:', inputHash);
      console.log('Stored hash:', storedHashValue);
      
      return inputHash === storedHashValue;
    } catch (error) {
      console.error('SHA256 verification error:', error);
      return false;
    }
  }

  async signup(createUserDto: CreateUserDto) {
    try {
      // 사용자 생성 (원본 비밀번호 사용)
      const user = await this.userService.create({
        ...createUserDto,
        mb_password: createUserDto.mb_password,
        mb_password2: createUserDto.mb_password,
      });

      // 비밀번호 제외하고 반환
      const { mb_password, mb_password2, ...result } = user;
      return {
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: result
      };
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'P2002') {
        throw new ConflictException('이미 사용 중인 아이디입니다.');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      console.log('Login attempt for user:', loginDto.mb_id);
      
      const user = await this.userService.findByMbId(loginDto.mb_id);
      console.log('Found user:', user ? 'Yes' : 'No');
      
      if (!user) {
        throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
      }

      let isPasswordValid = false;
      console.log('Stored password format:', user.mb_password);

      // SHA256 형식인 경우
      if (this.isSha256Format(user.mb_password)) {
        console.log('Attempting SHA256 verification');
        isPasswordValid = this.verifySha256Hashed(loginDto.mb_password, user.mb_password);
        console.log('SHA256 verification result:', isPasswordValid);
      } 
      // bcrypt 형식인 경우
      else if (user.mb_password.startsWith('$2')) {
        console.log('Attempting bcrypt verification');
        isPasswordValid = await bcrypt.compare(loginDto.mb_password, user.mb_password);
        console.log('bcrypt verification result:', isPasswordValid);
      }
      // 일반 텍스트인 경우
      else {
        console.log('Attempting plain text comparison');
        isPasswordValid = loginDto.mb_password === user.mb_password;
        console.log('Plain text comparison result:', isPasswordValid);
      }
      
      if (!isPasswordValid) {
        console.log('Password validation failed');
        throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
      }

      console.log('Login successful for user:', user.mb_id);

      const payload = { 
        mb_id: user.mb_id,
        mb_level: user.mb_level,
        mb_nick: user.mb_nick
      };
      const access_token = this.jwtService.sign(payload);

      return {
        success: true,
        message: '로그인되었습니다.',
        data: {
          access_token,
          mb_id: user.mb_id,
          mb_level: user.mb_level,
          mb_nick: user.mb_nick
        }
      };
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw error;
    }
  }

  async getProfile(mb_id: string) {
    const user = await this.userService.findByMbId(mb_id);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }
} 