// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // 🔥 TS가 videoAuthority를 인식하도록 강제로 추가
  //    실제 구현은 부모(PrismaClient)에 있는 걸 any로 우회해서 리턴
  get videoAuthority(): any {
    return (this as any).videoAuthority;
  }
}
