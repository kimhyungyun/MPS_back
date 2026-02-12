// src/lecture-packages/lecture-packages.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LecturePackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.lecture_package.findMany({
      select: {
        id: true,
        name: true,
        price: true,
      },
      orderBy: { id: 'asc' },
    });
  }
}
