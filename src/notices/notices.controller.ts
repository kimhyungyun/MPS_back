import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface JwtUser {
  mb_no: number;
  mb_id: string;
  mb_level: number;
  mb_nick: string;
}

interface RequestWithUser extends Request {
  user: JwtUser;
}

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  // 🔹 공지 생성 (JWT 필요)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createNoticeDto: CreateNoticeDto,
    @Req() req: RequestWithUser,
  ) {
    console.log('>>> [NoticesController.create] body:', createNoticeDto);
    console.log('>>> [NoticesController.create] user:', req.user);

    const userId = req.user?.mb_no ?? null;
    return this.noticesService.create(createNoticeDto, userId);
  }

  // 🔹 공지 리스트 (공개)
  @Get()
  findAll() {
    return this.noticesService.findAll();
  }

  // 🔹 공지 상세 (공개)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticesService.findOne(+id);
  }

  // 🔹 공지 수정 (JWT 필요)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    console.log(
      '>>> [NoticesController.update] id:',
      id,
      'body:',
      updateNoticeDto,
    );
    return this.noticesService.update(+id, updateNoticeDto);
  }

  // 🔹 공지 삭제 (JWT 필요)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log('>>> [NoticesController.remove] id:', id);
    return this.noticesService.remove(+id);
  }
}
