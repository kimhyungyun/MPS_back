import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Lecture } from './lecture.entity';


@Entity()
export class LectureCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Lecture, (lecture) => lecture.category)
  lectures: Lecture[];
}
