import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { MemberService } from '../services/member.service';
import { CreateMemberDto, UpdateMemberDto } from '../dto/member.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('admin/members')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  async findAll() {
    return this.memberService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.memberService.findOne(id);
  }

  @Post()
  async create(@Body() createMemberDto: CreateMemberDto) {
    return this.memberService.create(createMemberDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.memberService.update(id, updateMemberDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }
} 