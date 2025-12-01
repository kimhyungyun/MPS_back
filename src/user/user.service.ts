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
    const today = now.toISOString().split('T')[0];
    const hashedPassword = await bcrypt.hash(createUserDto.mb_password, 10);

    const user = this.userRepository.create({
      mb_id: createUserDto.mb_id,
      mb_password: hashedPassword,
      mb_name: createUserDto.mb_name,
      mb_nick: createUserDto.mb_nick,
      mb_nick_date: today,
      mb_email: createUserDto.mb_email,
      mb_hp: createUserDto.mb_hp || '',
      mb_sex: createUserDto.mb_sex || '',
      mb_birth: createUserDto.mb_birth || '',

      // ✅ 주소 / 우편번호 DTO 값 사용
      mb_zip1: createUserDto.mb_zip1 || '',
      mb_zip2: createUserDto.mb_zip2 || '',
      mb_addr1: createUserDto.mb_addr1 || '',
      mb_addr2: createUserDto.mb_addr2 || '',

      // ✅ 학교 저장
      mb_school: createUserDto.mb_school || '',
      mb_level: UserRole.USER,

      // 나머지 기본값
      mb_homepage: createUserDto.mb_homepage || '',
      mb_tel: createUserDto.mb_tel || '',
      mb_certify: createUserDto.mb_certify || '',
      mb_adult: 0,
      mb_dupinfo: createUserDto.mb_dupinfo || '',
      mb_addr3: createUserDto.mb_addr3 || '',
      mb_addr_jibeon: createUserDto.mb_addr_jibeon || '',
      mb_recommend: createUserDto.mb_recommend || '',
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
      mb_signature: createUserDto.mb_signature || '',
      mb_memo: '',
      mb_lost_certify: '',
      mb_profile: createUserDto.mb_profile || '',
      mb_open_date: today,
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
        mb_zip1: true,   // ✅ 우편번호
        mb_zip2: true,
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
        mb_10: true,
        // ✅ 학교도 내려주고 싶으면
        mb_school: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  // ✅ 닉네임으로 조회 (중복확인용)
  async findByMbNick(mb_nick: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { mb_nick },
    });
  }

  // 🔍 아이디 찾기용: 이름 + 휴대폰 번호로 조회
  async findByNameAndPhone(name: string, phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        mb_name: name,
        mb_hp: phone,
      },
    });
  }

  // 🔐 비밀번호 변경용 (비밀번호 찾기에서 사용)
  async updatePassword(mb_id: string, hashedPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { mb_id } });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.mb_password = hashedPassword;
    return this.userRepository.save(user);
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

      // ✅ 주소 / 우편번호 업데이트
      if (updateUserDto.mb_zip1) user.mb_zip1 = updateUserDto.mb_zip1;
      if (updateUserDto.mb_zip2) user.mb_zip2 = updateUserDto.mb_zip2;
      if (updateUserDto.mb_addr1) user.mb_addr1 = updateUserDto.mb_addr1;
      if (updateUserDto.mb_addr2) user.mb_addr2 = updateUserDto.mb_addr2;

      // ✅ 학교 수정
      if (updateUserDto.mb_school) user.mb_school = updateUserDto.mb_school;

      if (updateUserDto.mb_homepage) user.mb_homepage = updateUserDto.mb_homepage;
      if (updateUserDto.mb_tel) user.mb_tel = updateUserDto.mb_tel;
      if (updateUserDto.mb_certify) user.mb_certify = updateUserDto.mb_certify;
      if (updateUserDto.mb_dupinfo) user.mb_dupinfo = updateUserDto.mb_dupinfo;
      if (updateUserDto.mb_addr3) user.mb_addr3 = updateUserDto.mb_addr3;
      if (updateUserDto.mb_addr_jibeon) user.mb_addr_jibeon = updateUserDto.mb_addr_jibeon;
      if (updateUserDto.mb_signature) user.mb_signature = updateUserDto.mb_signature;
      if (updateUserDto.mb_recommend) user.mb_recommend = updateUserDto.mb_recommend;
      if (updateUserDto.mb_profile) user.mb_profile = updateUserDto.mb_profile;

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
