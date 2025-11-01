import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';
import { UserRole } from './enum/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByUserId(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
  


  async create(createUserDto: CreateUserDto) {
    const now = new Date();
    const hashedPassword = await bcrypt.hash(createUserDto.mb_password, 10);
    
    const user = this.userRepository.create({
      mb_id: createUserDto.mb_id,
      mb_password: hashedPassword,
      mb_name: createUserDto.mb_name,
      mb_nick: createUserDto.mb_nick,
      mb_nick_date: now.toISOString().split('T')[0],
      mb_email: createUserDto.mb_email,
      mb_hp: createUserDto.mb_hp || '',
      mb_sex: createUserDto.mb_sex || '',
      mb_birth: createUserDto.mb_birth || '',
      mb_addr1: createUserDto.mb_addr1 || '',
      mb_addr2: createUserDto.mb_addr2 || '',
      mb_level: UserRole.USER,
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
      mb_open_date: now.toISOString().split('T')[0],
    });

    return this.userRepository.save(user);
  }

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByMbId(mb_id: string) {
    const user = await this.userRepository.findOne({
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
      const user = await this.userRepository.findOne({ where: { mb_id } });
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      if (updateUserDto.mb_password) {
        const hashedPassword = await bcrypt.hash(updateUserDto.mb_password, 10);
        user.mb_password = hashedPassword;
      }
      
      if (updateUserDto.mb_name) user.mb_name = updateUserDto.mb_name;
      if (updateUserDto.mb_nick) {
        user.mb_nick = updateUserDto.mb_nick;
        user.mb_nick_date = new Date().toISOString().split('T')[0];
      }
      if (updateUserDto.mb_email) user.mb_email = updateUserDto.mb_email;
      if (updateUserDto.mb_hp) user.mb_hp = updateUserDto.mb_hp;
      if (updateUserDto.mb_sex) user.mb_sex = updateUserDto.mb_sex;
      if (updateUserDto.mb_birth) user.mb_birth = updateUserDto.mb_birth;
      if (updateUserDto.mb_addr1) user.mb_addr1 = updateUserDto.mb_addr1;
      if (updateUserDto.mb_addr2) user.mb_addr2 = updateUserDto.mb_addr2;

      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('프로필 업데이트에 실패했습니다.');
    }
  }

  async remove(mb_id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { mb_id } });
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }
      return await this.userRepository.remove(user);
    } catch (error) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
  }
}
