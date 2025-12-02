import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  // -------------------- 로그인 관련 --------------------

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
        24,
        'sha256',
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
      // UserService.create 안에서 isProfileCompleted / lastLoginAt 세팅
      const user = await this.userService.create(createUserDto);

      const { mb_password, ...result } = user;
      return {
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: result,
      };
    } catch (error: any) {
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
        isPasswordValid = this.verifySha256Hashed(
          loginDto.mb_password,
          user.mb_password,
        );
      } else if (user.mb_password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(
          loginDto.mb_password,
          user.mb_password,
        );
      } else {
        isPasswordValid = loginDto.mb_password === user.mb_password;
      }

      if (!isPasswordValid) {
        throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
      }

      const now = new Date();
      const policyStartDate = new Date('2025-12-02T00:00:00+09:00');

      // ✅ mb_level을 숫자로 강제 변환 (DB는 tinyint지만 TS는 string일 수 있음)
      const level = Number(user.mb_level ?? 0);

      // ✅ 관리자 여부
      const isAdmin = user.mb_id === 'admin' || level >= 10;

      let needProfileUpdate = false;

      if (!isAdmin) {
        // 일반 회원만 추가정보/동의 대상
        needProfileUpdate =
          !user.isProfileCompleted &&
          (!user.lastLoginAt || user.lastLoginAt < policyStartDate);
      }

      // ✅ lastLoginAt 업데이트는 실패해도 로그인 막지 않기
      try {
        await this.userService.updateLastLoginAt(user.mb_id, now);
      } catch (e: any) {
        console.error(
          '[LOGIN] updateLastLoginAt 실패 (로그인 진행은 계속):',
          e.message,
        );
      }

      const payload = {
        mb_id: user.mb_id,
        mb_level: level,
        mb_nick: user.mb_nick,
      };
      const access_token = this.jwtService.sign(payload);

      return {
        success: true,
        message: '로그인되었습니다.',
        data: {
          access_token,
          mb_id: user.mb_id,
          mb_level: level,
          mb_nick: user.mb_nick,
          needProfileUpdate,
        },
      };
    } catch (error: any) {
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

  // -------------------- 중복 확인 --------------------

  async checkId(mb_id: string): Promise<boolean> {
    if (!mb_id) return false;

    try {
      await this.userService.findByMbId(mb_id);
      return false;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return true;
      }
      throw error;
    }
  }

  async checkNick(mb_nick: string): Promise<boolean> {
    if (!mb_nick) return false;
    const user = await this.userService.findByMbNick(mb_nick);
    return !user;
  }

  // -------------------- 아이디 찾기 / 비번 찾기 --------------------

  async findId(name: string, phone: string) {
    const user = await this.userService.findByNameAndPhone(name, phone);

    if (!user) {
      throw new NotFoundException('일치하는 회원 정보를 찾을 수 없습니다.');
    }

    const maskedUserId = this.maskUserId(user.mb_id);
    return { maskedUserId };
  }

  private maskUserId(mb_id: string): string {
    if (mb_id.length <= 3) return '*'.repeat(mb_id.length);

    const visibleStart = mb_id.slice(0, 2);
    const visibleEnd = mb_id.slice(-2);
    const stars = '*'.repeat(mb_id.length - 4);

    return `${visibleStart}${stars}${visibleEnd}`;
  }

  // 📲 비밀번호 재설정 - 1단계: SMS 코드 전송
  async requestPasswordSms(
    mb_id: string,
    phoneForSearch: string, // 010-1234-5678 (DB 비교용)
    phoneForSms: string,    // 01012345678 (문자 발송용)
  ) {
    const user = await this.userService.findByMbId(mb_id);

    if (!user) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다.');
    }

    const userPhone = (user as any).mb_hp ?? (user as any).phone;

    if (!userPhone) {
      throw new BadRequestException('회원 정보에 등록된 휴대폰 번호가 없습니다.');
    }

    if (userPhone !== phoneForSearch) {
      throw new BadRequestException('등록된 휴대폰 번호와 일치하지 않습니다.');
    }

    await this.prisma.passwordReset.updateMany({
      where: {
        mb_id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    const code = this.generateCode(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.passwordReset.create({
      data: {
        mb_id,
        phone: phoneForSearch,
        code,
        resetToken: null,
        expiresAt,
        used: false,
      },
    });

    const message = `[MPS] 비밀번호 재설정 인증번호는 [${code}] 입니다. (5분 이내 입력)`;
    const digitsOnly = phoneForSms.replace(/\D/g, '');

    await this.smsService.send({
      to: digitsOnly,
      content: message,
    });

    return true;
  }

  private generateCode(length: number): string {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    const num = Math.floor(min + Math.random() * (max - min + 1));
    return String(num);
  }

  // 📲 비밀번호 재설정 - 2단계: 코드 검증 → resetToken 발급
  async verifyPasswordSms(mb_id: string, code: string) {
    const now = new Date();

    const reset = await this.prisma.passwordReset.findFirst({
      where: {
        mb_id,
        used: false,
        expiresAt: { gt: now },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!reset || reset.code !== code) {
      throw new BadRequestException(
        '인증번호가 올바르지 않거나 만료되었습니다.',
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: {
        resetToken,
        code: null,
      },
    });

    return resetToken;
  }

  // 🔐 비밀번호 재설정 - 3단계: 새 비밀번호 저장
  async resetPassword(resetToken: string, newPassword: string) {
    const now = new Date();

    const reset = await this.prisma.passwordReset.findFirst({
      where: {
        resetToken,
        used: false,
        expiresAt: { gt: now },
      },
    });

    if (!reset) {
      throw new BadRequestException(
        '유효하지 않거나 만료된 비밀번호 재설정 요청입니다.',
      );
    }

    const user = await this.userService.findByMbId(reset.mb_id);

    if (!user) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.userService.updatePassword(user.mb_id, hashed);

    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    });

    return true;
  }
}
