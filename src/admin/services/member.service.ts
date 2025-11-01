import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto, UpdateMemberDto } from '../dto/member.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.g5_member.findMany({
      select: {
        mb_id: true,
        mb_name: true,
        mb_email: true,
        mb_level: true,
        mb_datetime: true,
        mb_ip: true,
        mb_memo: true,
        mb_signature: true,
        mb_lost_certify: true,
        mb_profile: true,
      },
    });
  }

  async findOne(mb_id: string) {
    return this.prisma.g5_member.findUnique({
      where: { mb_id },
      select: {
        mb_id: true,
        mb_name: true,
        mb_email: true,
        mb_level: true,
        mb_datetime: true,
        mb_ip: true,
        mb_memo: true,
        mb_signature: true,
        mb_lost_certify: true,
        mb_profile: true,
      },
    });
  }

  async create(createMemberDto: CreateMemberDto) {
    const data = {
      ...createMemberDto,
      mb_nick: createMemberDto.mb_name,
      mb_homepage: '',
      mb_sex: 'M',
      mb_birth: '',
      mb_tel: '',
      mb_hp: '',
      mb_certify: '',
      mb_adult: 0,
      mb_dupinfo: '',
      mb_zip1: '',
      mb_zip2: '',
      mb_addr1: '',
      mb_addr2: '',
      mb_addr3: '',
      mb_addr_jibeon: '',
      mb_signature: createMemberDto.mb_signature || '',
      mb_recommend: '',
      mb_point: 0,
      mb_today_login: new Date(),
      mb_login_ip: '',
      mb_datetime: new Date(),
      mb_ip: '127.0.0.1',
      mb_leave_date: '',
      mb_intercept_date: '',
      mb_email_certify: new Date(),
      mb_email_certify2: '',
      mb_memo: createMemberDto.mb_memo || '',
      mb_lost_certify: createMemberDto.mb_lost_certify || '',
      mb_mailling: 0,
      mb_sms: 0,
      mb_open: 0,
      mb_open_date: new Date(),
      mb_profile: createMemberDto.mb_profile || '',
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
      mb_password2: createMemberDto.mb_password,
    };
    
    return this.prisma.g5_member.create({
      data,
    });
  }

  async update(mb_id: string, updateMemberDto: UpdateMemberDto) {
    return this.prisma.g5_member.update({
      where: { mb_id },
      data: updateMemberDto,
    });
  }

  async remove(mb_id: string) {
    return this.prisma.g5_member.delete({
      where: { mb_id },
    });
  }
} 