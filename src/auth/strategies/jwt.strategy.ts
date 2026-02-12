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
  const user = await this.userService.findByMbId(payload.mb_id);
  if (!user) throw new UnauthorizedException();

  return {
    userId: user.id,      // ✅ TypeORM User PK
    mb_id: user.mb_id,
    mb_level: user.mb_level,
    mb_nick: user.mb_nick,
  };
}


}
