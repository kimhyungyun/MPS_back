import { Module } from '@nestjs/common';
import { DataroomController } from './dataroom.controller';
import { DataroomService } from './dataroom.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DataroomController],
  providers: [DataroomService, PrismaService],
})
export class DataroomModule {}
