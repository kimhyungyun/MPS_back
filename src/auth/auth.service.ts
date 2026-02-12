import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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

  private isSha256Format(password?: string | null): boolean {
    return typeof password === 'string' && password.startsWith('sha256:');
  }

  private verifySha256Hashed(inputPassword: string, storedHash: string): boolean {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 4) return false;

      const [, iterationsStr, salt, storedHashValue] = parts;
      const iterations = parseInt(iterationsStr, 10);
      if (!Number.isFinite(iterations) || iterations <= 0) return false;

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
      const user = await this.userService.create(createUserDto);

      const { mb_password, ...result } = user as any;
      return {
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: result,
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error?.code === 'P2002') {
        throw new ConflictException('이미 사용 중인 아이디입니다.');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    console.log('Login attempt for user:', loginDto.mb_id);

    // ✅ 로그인에서는 무조건 password + lastLoginAt + isProfileCompleted 포함 조회
    const user = await this.userService.findByMbIdWithPassword(loginDto.mb_id);
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const storedPw: string | undefined = user.mb_password;
    console.log('Stored password:', storedPw ? '[present]' : 'undefined');

    if (!storedPw) {
      throw new InternalServerErrorException(
        '회원 비밀번호 정보가 없습니다. (findByMbIdWithPassword select 확인)',
      );
    }

    let isPasswordValid = false;

    if (this.isSha256Format(storedPw)) {
      isPasswordValid = this.verifySha256Hashed(loginDto.mb_password, storedPw);
    } else if (storedPw.startsWith('$2')) {
      isPasswordValid = await bcrypt.compare(loginDto.mb_password, storedPw);
    } else {
      isPasswordValid = loginDto.mb_password === storedPw;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const now = new Date();
    const policyStartDate = new Date('2025-12-02T00:00:00+09:00');

    const level = Number(user.mb_level ?? 0);
    const isAdmin = user.mb_id === 'admin' || level >= 10;

    const lastLoginAt: Date | null = (user as any).lastLoginAt ?? null;
    const isProfileCompleted: boolean = Boolean((user as any).isProfileCompleted);

    let needProfileUpdate = false;

    if (!isAdmin) {
      needProfileUpdate =
        !isProfileCompleted &&
        (!lastLoginAt || lastLoginAt < policyStartDate);
    }

    try {
      await this.userService.updateLastLoginAt(user.mb_id, now);
    } catch (e: any) {
      console.error(
        '[LOGIN] updateLastLoginAt 실패 (로그인 진행은 계속):',
        e?.message ?? e,
      );
    }

    // 🔥 mb_no는 Prisma로 g5_member에서 조회 (프론트 호환)
    let mbNo: number | null = null;
    try {
      const dbUser = await this.prisma.g5_member.findUnique({
        where: { mb_id: user.mb_id },
        select: { mb_no: true },
      });
      mbNo = dbUser?.mb_no ?? null;
    } catch (e) {
      console.error('[LOGIN] mb_no 조회 실패:', e);
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
        mb_no: mbNo,
        mb_id: user.mb_id,
        mb_level: level,
        mb_nick: user.mb_nick,
        needProfileUpdate,
      },
    };
  }

  // ✅ 여기만 바뀜: profile에서 회원가입 필드 전부 select
  async getProfile(mb_id: string) {
    const user = await this.prisma.g5_member.findUnique({
      where: { mb_id },
      select: {
        mb_no: true,
        mb_id: true,
        mb_name: true,
        mb_nick: true,
        mb_level: true,

        // ✅ 회원가입 폼에서 보내는 필드들
        mb_email: true,
        mb_hp: true,
        mb_sex: true,
        mb_birth: true,
        mb_school: true,
        mb_zip1: true,
        mb_addr1: true,
        mb_addr2: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  // -------------------- 중복 확인 --------------------

  async checkId(mb_id: string): Promise<boolean> {
    if (!mb_id) return false;
    const exists = await this.userService.existsByMbId(mb_id);
    return !exists;
  }

  async checkNick(mb_nick: string): Promise<boolean> {
    if (!mb_nick) return false;
    const user = await this.userService.findByMbNick(mb_nick);
    return !user;
  }

  // -------------------- 아이디 찾기 / 비번 찾기 --------------------

  async findId(name: string, email: string) {
    const user: any = await this.userService.findByNameAndEmail(name, email);

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

  async requestPasswordSms(
    mb_id: string,
    phoneForSearch: string,
    phoneForSms: string,
  ) {
    const authUser = await this.userService.findByMbId(mb_id);
    if (!authUser) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다.');
    }

    const fullUser = await this.userService.findByUserId(authUser.id);
    const userPhone = (fullUser as any)?.mb_hp ?? (fullUser as any)?.phone;

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
      throw new BadRequestException('인증번호가 올바르지 않거나 만료되었습니다.');
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

    const authUser = await this.userService.findByMbId(reset.mb_id);
    if (!authUser) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.userService.updatePassword(reset.mb_id, hashed);

    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    });

    return true;
  }
}
