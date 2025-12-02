// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// 예: @Roles(8)  → mb_level >= 8 이상만 접근 허용
export const Roles = (...levels: number[]) => SetMetadata(ROLES_KEY, levels);
