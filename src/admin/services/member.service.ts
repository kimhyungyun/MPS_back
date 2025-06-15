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
      mb_datetime: new Date(),
      mb_ip: '127.0.0.1',
      mb_memo: createMemberDto.mb_memo || '',
      mb_signature: createMemberDto.mb_signature || '',
      mb_lost_certify: createMemberDto.mb_lost_certify || '',
      mb_profile: createMemberDto.mb_profile || '',
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