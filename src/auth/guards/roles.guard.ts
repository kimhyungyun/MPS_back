import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // 요청의 사용자 정보

    if (!user) {
      throw new UnauthorizedException('사용자가 존재하지 않습니다.');
    }

    // 사용자 역할이 requiredRoles에 포함되어 있는지 확인
    const hasRole = requiredRoles.some(role => user.mb_level === role);

    if (!hasRole) {
      throw new UnauthorizedException('권한이 없습니다.');
    }

    return true;
  }
}
