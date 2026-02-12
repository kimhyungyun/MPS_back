import { Test, TestingModule } from '@nestjs/testing';
import { LecturePackagesController } from './lecture-packages.controller';

describe('LecturePackagesController', () => {
  let controller: LecturePackagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LecturePackagesController],
    }).compile();

    controller = module.get<LecturePackagesController>(LecturePackagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
