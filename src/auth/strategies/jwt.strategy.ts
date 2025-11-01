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
      secretOrKey: jwtConstants.secret, // 환경변수로 관리해야 합니다.
    });
  }

async validate(payload: any) {
  console.log('🔥 JWT PAYLOAD:', payload); // ← 이거 추가
  const user = await this.userService.findByMbId(payload.mb_id);
  if (!user) {
    throw new UnauthorizedException();
  }
  return { mb_id: user.mb_id, mb_level: user.mb_level };
}

}
