import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private prisma: PrismaService
  ) {}

  async findByUserId(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { mb_id: id },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const now = new Date();
    return this.prisma.g5_member.create({
      data: {
        mb_id: createUserDto.mb_id,
        mb_password: createUserDto.mb_password,
        mb_name: createUserDto.mb_name,
        mb_nick: createUserDto.mb_nick,
        mb_nick_date: now,
        mb_email: createUserDto.mb_email,
        mb_hp: createUserDto.mb_hp || '',
        mb_sex: createUserDto.mb_sex || '',
        mb_birth: createUserDto.mb_birth || '',
        mb_addr1: createUserDto.mb_addr1 || '',
        mb_addr2: createUserDto.mb_addr2 || '',
        mb_level: 1,
        mb_password2: createUserDto.mb_password,
        mb_homepage: '',
        mb_tel: '',
        mb_certify: '',
        mb_adult: 0,
        mb_dupinfo: '',
        mb_zip1: '',
        mb_zip2: '',
        mb_addr3: '',
        mb_addr_jibeon: '',
        mb_recommend: '',
        mb_point: 0,
        mb_today_login: now,
        mb_login_ip: '',
        mb_datetime: now,
        mb_ip: '',
        mb_leave_date: '',
        mb_intercept_date: '',
        mb_email_certify: now,
        mb_email_certify2: '',
        mb_memo_call: '',
        mb_memo_cnt: 0,
        mb_scrap_cnt: 0,
        mb_1: '',
        mb_2: '',
        mb_3: '',
        mb_4: '',
        mb_5: '',
        mb_6: '',
        mb_7: '',
        mb_8: '',
        mb_9: '',
        mb_10: '',
        mb_signature: '',
        mb_memo: '',
        mb_lost_certify: '',
        mb_profile: '',
        mb_open_date: now,
      },
    });
  }

  async findAll() {
    return this.prisma.g5_member.findMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByMbId(mb_id: string) {
    const user = await this.prisma.g5_member.findUnique({
      where: { mb_id },
      select: {
        mb_id: true,
        mb_password: true,
        mb_name: true,
        mb_nick: true,
        mb_level: true,
        mb_email: true,
        mb_hp: true,
        mb_sex: true,
        mb_birth: true,
        mb_addr1: true,
        mb_addr2: true,
        mb_point: true,
        mb_memo: true,
        mb_profile: true,
        mb_signature: true,
        mb_lost_certify: true,
        mb_1: true,
        mb_2: true,
        mb_3: true,
        mb_4: true,
        mb_5: true,
        mb_6: true,
        mb_7: true,
        mb_8: true,
        mb_9: true,
        mb_10: true
      }
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async update(mb_id: string, updateUserDto: UpdateUserDto) {
    try {
      const data: any = {};
      
      if (updateUserDto.mb_password) {
        const hashedPassword = await bcrypt.hash(updateUserDto.mb_password, 10);
        data.mb_password = hashedPassword;
        data.mb_password2 = hashedPassword;
      }
      
      if (updateUserDto.mb_name) data.mb_name = updateUserDto.mb_name;
      if (updateUserDto.mb_nick) {
        data.mb_nick = updateUserDto.mb_nick;
        data.mb_nick_date = new Date();
      }
      if (updateUserDto.mb_email) data.mb_email = updateUserDto.mb_email;
      if (updateUserDto.mb_hp) data.mb_hp = updateUserDto.mb_hp;
      if (updateUserDto.mb_sex) data.mb_sex = updateUserDto.mb_sex;
      if (updateUserDto.mb_birth) data.mb_birth = updateUserDto.mb_birth;
      if (updateUserDto.mb_addr1) data.mb_addr1 = updateUserDto.mb_addr1;
      if (updateUserDto.mb_addr2) data.mb_addr2 = updateUserDto.mb_addr2;

      const updatedUser = await this.prisma.g5_member.update({
        where: { mb_id },
        data,
      });

      if (!updatedUser) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('프로필 업데이트에 실패했습니다.');
    }
  }

  async remove(mb_id: string) {
    try {
      return await this.prisma.g5_member.delete({
        where: { mb_id },
      });
    } catch (error) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
  }
}
