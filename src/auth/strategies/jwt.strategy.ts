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
      secretOrKey: 'your-secret-key', // 실제 프로덕션에서는 환경 변수로 관리해야 합니다
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findByMbId(payload.mb_id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { 
      mb_id: user.mb_id,
      mb_level: user.mb_level 
    };
  }
} 