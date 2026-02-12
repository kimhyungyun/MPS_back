// src/lecture-packages/lecture-packages.controller.ts
import { Controller, Get } from '@nestjs/common';
import { LecturePackagesService } from './lecture-packages.service';

@Controller('lecture-packages')
export class LecturePackagesController {
  constructor(private readonly service: LecturePackagesService) {}

  @Get()
  list() {
    return this.service.list();
  }
}
