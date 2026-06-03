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

  async create(
    createLectureDto: CreateLectureDto,
    userId: number,
  ): Promise<Lecture> {
    const { categoryId, instructorId, ...lectureData } = createLectureDto;

    const category = await this.categoryRepository.findOneBy({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const instructor = await this.userRepository.findOneBy({
      id: instructorId ?? userId,
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const lecture = this.lectureRepository.create({
      ...lectureData,
      price: lectureData.price ?? 0,
      day: lectureData.day ?? null,
      sortOrder: lectureData.sortOrder ?? 0,
      category,
      instructor,
    });

    return this.lectureRepository.save(lecture);
  }

  async findAll() {
    const lectures = await this.lectureRepository
      .createQueryBuilder('lecture')
      .leftJoinAndSelect('lecture.instructor', 'instructor')
      .leftJoinAndSelect('lecture.category', 'category')
      .orderBy(
        `
        CASE
          WHEN lecture.type = 'single'
           AND lecture.classGroup IN ('A', 'B')
          THEN 0
          ELSE 1
        END
        `,
        'ASC',
      )
      .addOrderBy(
        `
        CASE
          WHEN lecture.type = 'single'
           AND lecture.classGroup IN ('A', 'B')
          THEN lecture.classGroup
          ELSE NULL
        END
        `,
        'ASC',
      )
      .addOrderBy(
        `
        CASE
          WHEN lecture.type = 'single'
           AND lecture.classGroup IN ('A', 'B')
          THEN lecture.day
          ELSE NULL
        END
        `,
        'ASC',
      )
      .addOrderBy(
        `
        CASE
          WHEN lecture.type = 'single'
           AND lecture.classGroup IN ('A', 'B')
          THEN lecture.sortOrder
          ELSE NULL
        END
        `,
        'ASC',
      )
      .addOrderBy('lecture.id', 'ASC')
      .getMany();

    return lectures.map((lecture) => this.toResponse(lecture));
  }

  async findOne(id: number) {
    const lecture = await this.lectureRepository.findOne({
      where: { id },
      relations: ['instructor', 'category'],
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    return this.toResponse(lecture);
  }

  async findEntityById(id: number): Promise<Lecture> {
    const lecture = await this.lectureRepository.findOne({
      where: { id },
      relations: ['instructor', 'category'],
    });

    if (!lecture) {
      throw new NotFoundException('Lecture not found');
    }

    return lecture;
  }

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

  async update(
    id: number,
    updateLectureDto: UpdateLectureDto,
  ): Promise<Lecture> {
    const lecture = await this.findOneWithRelations(id);

    const { categoryId, instructorId, ...updateData } = updateLectureDto;

    if (categoryId !== undefined && categoryId !== null) {
      const category = await this.categoryRepository.findOneBy({
        id: categoryId,
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      lecture.category = category;
    }

    if (instructorId !== undefined && instructorId !== null) {
      const instructor = await this.userRepository.findOneBy({
        id: instructorId,
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      lecture.instructor = instructor;
    }

    Object.assign(lecture, updateData);

    return this.lectureRepository.save(lecture);
  }

  async remove(id: number): Promise<void> {
    const lecture = await this.findEntityById(id);
    await this.lectureRepository.remove(lecture);
  }

  private toResponse(lecture: Lecture) {
    return {
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      price: lecture.price,
      thumbnail_url: lecture.thumbnail_url,
      type: lecture.type,
      classGroup: lecture.classGroup,
      day: lecture.day,
      sortOrder: lecture.sortOrder,
      video_folder: lecture.video_folder,
      video_name: lecture.video_name,
      created_at: lecture.created_at,
      categoryId: lecture.category?.id ?? null,
      categoryName: lecture.category?.name ?? null,
      instructorId: lecture.instructor?.id ?? null,
      instructorName: lecture.instructor?.mb_name ?? null,
      instructorNick: lecture.instructor?.mb_nick ?? null,
    };
  }
}