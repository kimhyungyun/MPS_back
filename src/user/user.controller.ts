import { Controller, Get, Param, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':mb_no')
  async getUserById(@Param('mb_no') id: string) {
    const user = await this.userService.findByUserId(Number(id));  
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    return {
      success: true,
      data: {
        id: user.id,
        mb_id: user.mb_id,
        mb_name: user.mb_name,
        mb_nick: user.mb_nick,
        mb_email: user.mb_email,
        mb_homepage: user.mb_homepage,
        mb_level: user.mb_level,
        mb_sex: user.mb_sex,
        mb_birth: user.mb_birth,
        mb_tel: user.mb_tel,
        mb_hp: user.mb_hp,
        mb_certify: user.mb_certify,
        mb_adult: user.mb_adult,
        mb_zip1: user.mb_zip1,
        mb_zip2: user.mb_zip2,
        mb_addr1: user.mb_addr1,
        mb_addr2: user.mb_addr2,
        mb_addr3: user.mb_addr3,
        mb_addr_jibeon: user.mb_addr_jibeon,
        mb_signature: user.mb_signature,
        mb_point: user.mb_point,
        mb_today_login: user.mb_today_login,
        mb_login_ip: user.mb_login_ip,
        mb_datetime: user.mb_datetime,
        mb_ip: user.mb_ip,
        mb_leave_date: user.mb_leave_date,
        mb_intercept_date: user.mb_intercept_date,
        mb_email_certify: user.mb_email_certify,
        mb_memo: user.mb_memo,
        mb_profile: user.mb_profile,
        mb_memo_cnt: user.mb_memo_cnt,
        // mb_scrap_cnt: user.mb_scrap_cnt,
        // created_at: user.created_at,
        // updated_at: user.updated_at
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.userService.update(req.user.mb_id, updateUserDto);
    return {
      success: true,
      data: result
    };
  }
}
