import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lecture } from '@/lecture/entity/lecture.entity';
import { CreateLectureDto } from '@/lecture/dto/create-lecture.dto';
import { UpdateLectureDto } from '@/lecture/dto/update-lecture.dto';

import { LectureCategory } from '@/lecture/entity/lecture-category.entity';
import { User } from '@/user/entity/user.entity';

@Injectable()
export class LectureService {
  constructor(
    @InjectRepository(Lecture)
    private lectureRepository: Repository<Lecture>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(LectureCategory)
    private categoryRepository: Repository<LectureCategory>,
  ) {}

  async create(createLectureDto: CreateLectureDto): Promise<Lecture> {
    const instructor = await this.userRepository.findOne({
      where: { mb_id: createLectureDto.instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(`Instructor not found`);
    }

    const category = await this.categoryRepository.findOne({
      where: { id: createLectureDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    const { instructorId, categoryId, ...lectureData } = createLectureDto;
    const lecture = this.lectureRepository.create({
      ...lectureData,
      instructor,
      category,
    });
    return await this.lectureRepository.save(lecture);
  }

  async findAll(): Promise<any[]> {
    const lectures = await this.lectureRepository.find({
      relations: ['instructor', 'category'],
    });
    return lectures.map(lecture => ({
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      s3Url: lecture.video_url || '',
    }));
  }

  async findOne(id: number): Promise<any> {
    const lecture = await this.lectureRepository.findOne({
      where: { id },
      relations: ['instructor', 'category'],
    });
    if (!lecture) {
      throw new NotFoundException(`Lecture not found`);
    }
    return {
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      s3Url: lecture.video_url || '',
    };
  }

  async update(
    id: number,
    updateLectureDto: UpdateLectureDto,
  ): Promise<Lecture> {
    const lecture = await this.findOne(id);
    const { instructorId, categoryId, ...updateData } =
      updateLectureDto as CreateLectureDto;

    if (instructorId) {
      const instructor = await this.userRepository.findOne({
        where: { mb_id: instructorId },
      });
      if (!instructor) {
        throw new NotFoundException(`Instructor not found`);
      }
      lecture.instructor = instructor;
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category not found`);
      }
      lecture.category = category;
    }

    Object.assign(lecture, updateData);
    return await this.lectureRepository.save(lecture);
  }

  async remove(id: number): Promise<void> {
    const lecture = await this.findOne(id);
    await this.lectureRepository.remove(lecture);
  }
}
