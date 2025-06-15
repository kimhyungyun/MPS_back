import { Controller, Get, Query } from '@nestjs/common';
import { CloudfrontService } from './cloudfront.service';

@Controller('videos')
export class CloudfrontController {
  constructor(private readonly cloudfrontService: CloudfrontService) {}

  @Get('signed-url')
  async getSignedUrl(@Query('filename') filename: string) {
    const url = await this.cloudfrontService.generateSignedUrl(`videos/${filename}`);
    return { url };
  }
} 