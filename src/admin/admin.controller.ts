import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from '@/admin/admin.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';

type Range = 'day' | 'week' | 'month';
type SortKey = 'name' | 'latest';
type SortOrder = 'asc' | 'desc';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('members')
  async getMembers(
    @Query('page') page: string = '1',
    @Query('search') search?: string,
    @Query('sortKey') sortKey?: SortKey,
    @Query('sortOrder') sortOrder: SortOrder = 'asc',
  ) {
    const pageNum = Number(page) || 1;

    const result = await this.adminService.getMembers(
      pageNum,
      search,
      sortKey,
      sortOrder,
    );

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

  // ✅ 관리자 대시보드 통계 (총 회원 수 / 총 강의 수 / 총 결제 수)
  // 프론트에서 setStats(data)로 바로 쓰고 있어서 래핑 없이 그대로 리턴
  @Get('stats')
  async getAdminStats() {
    return this.adminService.getAdminStats();
  }

  // ✅ 회원 통계 상세 (월/주/일 가입자 수 / 방문자 수)
  @Get('stats/users')
  async getUserStats(@Query('range') range: Range = 'month') {
    const safeRange: Range =
      range === 'day' || range === 'week' || range === 'month'
        ? range
        : 'month';

    return this.adminService.getUserStats(safeRange);
  }
}
