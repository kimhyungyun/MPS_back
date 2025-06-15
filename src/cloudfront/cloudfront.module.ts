import { Module } from '@nestjs/common';
import { CloudfrontService } from './cloudfront.service';
import { CloudfrontController } from './cloudfront.controller';

@Module({
  controllers: [CloudfrontController],
  providers: [CloudfrontService],
  exports: [CloudfrontService],
})
export class CloudfrontModule {} 