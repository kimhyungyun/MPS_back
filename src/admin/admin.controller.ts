import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from '@/admin/admin.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('members')
  async getMembers(
    @Query('page') page: number = 1,
    @Query('search') search?: string,
  ) {
    const result = await this.adminService.getMembers(page, search);
    return {
      success: true,
      data: result,
    };
  }

  @Put('members/:mb_id/level')
  async updateMemberLevel(
    @Param('mb_id') mb_id: string,
    @Body('mb_level') mb_level: number,
  ) {
    const result = await this.adminService.updateMemberLevel(mb_id, mb_level);
    return {
      success: true,
      data: result,
    };
  }
npm
  // ✅ 관리자 통계 API 추가
  @Get('stats')
  async getAdminStats() {
    const result = await this.adminService.getAdminStats();
    return {
      success: true,
      data: result,
    };
  }
}
