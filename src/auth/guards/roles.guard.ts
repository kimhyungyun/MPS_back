// src/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Roles(8) 같이 설정된 최소 레벨들
    const requiredLevels = this.reflector.get<number[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // 메타데이터가 없으면 레벨 제한 없음
    if (!requiredLevels || requiredLevels.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('사용자가 존재하지 않습니다.');
    }

    // 예: @Roles(8) → mb_level >= 8 이면 통과
    const hasPermission = requiredLevels.some(
      (level) => user.mb_level >= level,
    );

    if (!hasPermission) {
      // JWT 는 맞는데 레벨이 부족한 상태
      throw new ForbiddenException('권한이 없습니다.');
    }

    return true;
  }
}
