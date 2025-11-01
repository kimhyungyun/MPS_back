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
      const parts = storedHash.split(':');
      if (parts.length !== 4) return false;

      const [, iterationsStr, salt, storedHashValue] = parts;
      const iterations = parseInt(iterationsStr);

      const derivedKey = crypto.pbkdf2Sync(
        inputPassword,
        salt,
        iterations,
        24, // 192-bit key
        'sha256'
      );

      const inputHash = derivedKey.toString('base64').replace(/=+$/, '');
      return inputHash === storedHashValue;
    } catch (error) {
      console.error('SHA256 verification error:', error);
      return false;
    }
  }

  async signup(createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create({
        ...createUserDto,
      });

      const { mb_password, ...result } = user;
      return {
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: result,
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

      if (this.isSha256Format(user.mb_password)) {
        isPasswordValid = this.verifySha256Hashed(loginDto.mb_password, user.mb_password);
      } else if (user.mb_password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(loginDto.mb_password, user.mb_password);
      } else {
        isPasswordValid = loginDto.mb_password === user.mb_password;
      }

      if (!isPasswordValid) {
        throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
      }

      const payload = {
        mb_id: user.mb_id,
        mb_level: user.mb_level,
        mb_nick: user.mb_nick,
      };
      const access_token = this.jwtService.sign(payload);

      return {
        success: true,
        message: '로그인되었습니다.',
        data: {
          access_token,
          mb_id: user.mb_id,
          mb_level: user.mb_level,
          mb_nick: user.mb_nick,
        },
      };
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
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
