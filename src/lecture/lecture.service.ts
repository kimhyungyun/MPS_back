import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lecture } from './entity/lecture.entity';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { LectureCategory } from './entity/lecture-category.entity';
import { User } from '@/user/entity/user.entity';

@Injectable()
export class LectureService {
  constructor(
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(LectureCategory)
    private readonly categoryRepository: Repository<LectureCategory>,
  ) {}

  // ✅ 강의 생성 시 instructor 자동 지정
  async create(createLectureDto: CreateLectureDto, user: User): Promise<Lecture> {
    const { categoryId, ...lectureData } = createLectureDto;

    const category = await this.categoryRepository.findOneBy({ id: categoryId });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const lecture = this.lectureRepository.create({
      ...lectureData,
      instructor: user,
      category,
    });

    return this.lectureRepository.save(lecture);
  }

  // ✅ 전체 강의 목록 조회
  async findAll(): Promise<Lecture[]> {
    return this.lectureRepository.find({
      relations: ['instructor', 'category'],
    });
  }

  // ✅ 단일 강의 조회
  async findOne(id: number): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({ where: { id } });
    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }
    return lecture;
  }

  // ✅ 단일 강의 + 연관 관계 조회
  async findOneWithRelations(id: number): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { id },
      relations: ['instructor', 'category'],
    });
    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }
    return lecture;
  }

  // ✅ 강의 수정
  async update(id: number, updateLectureDto: UpdateLectureDto): Promise<Lecture> {
    const lecture = await this.findOneWithRelations(id);
    const { categoryId, ...updateData } = updateLectureDto as CreateLectureDto;

    if (categoryId) {
      const category = await this.categoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      lecture.category = category;
    }

    Object.assign(lecture, updateData);
    return this.lectureRepository.save(lecture);
  }

  // ✅ 강의 삭제
  async remove(id: number): Promise<void> {
    const lecture = await this.findOne(id);
    await this.lectureRepository.remove(lecture);
  }
}
