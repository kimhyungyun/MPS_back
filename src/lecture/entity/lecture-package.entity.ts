import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Lecture } from './lecture.entity';

@Entity()
export class LecturePackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Lecture)
  @JoinTable()
  lectures: Lecture[];

  @Column('int')
  price: number;
}
