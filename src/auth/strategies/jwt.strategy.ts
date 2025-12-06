// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // TODO: 환경변수로 분리 권장
    });
  }

  async validate(payload: any) {
    console.log('🔥 JWT PAYLOAD:', payload);

    const user = await this.userService.findByMbId(payload.mb_id);
    if (!user) {
      throw new UnauthorizedException();
    }

    // ❗ 여기서 PK를 userId 라는 이름으로 묶어서 리턴
    //  - user.id 가 실제 PK라고 가정
    return {
      userId: user.id,          // ✅ 이걸로 통일
      mb_id: user.mb_id,
      mb_level: user.mb_level,
      mb_nick: user.mb_nick,
    };
  }
}
