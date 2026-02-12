import { Test, TestingModule } from '@nestjs/testing';
import { LecturePackagesService } from './lecture-packages.service';

describe('LecturePackagesService', () => {
  let service: LecturePackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LecturePackagesService],
    }).compile();

    service = module.get<LecturePackagesService>(LecturePackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
