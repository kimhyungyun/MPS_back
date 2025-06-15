import { Controller, Get, Param, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.userService.findByUserId(id);
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
