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

type AuthorityFilter =
  | 'all'
  | 'hasAuthority'
  | 'none'
  | 'A'
  | 'B'
  | 'packageA'
  | 'packageB'
  | 'packageC'
  | 'packageD'
  | 'packageE';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(8)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('members')
  async getMembers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('search') search?: string,
    @Query('sortKey') sortKey?: SortKey,
    @Query('sortOrder') sortOrder: SortOrder = 'asc',
    @Query('authority') authority: AuthorityFilter = 'all',
  ) {
    const pageNum = Number(page) || 1;
    const pageSizeNum = Number(pageSize) || 10;

    const result = await this.adminService.getMembers(
      pageNum,
      pageSizeNum,
      search,
      sortKey,
      sortOrder,
      authority,
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

  @Get('stats')
  async getAdminStats() {
    return this.adminService.getAdminStats();
  }

  @Get('stats/users')
  async getUserStats(@Query('range') range: Range = 'month') {
    const safeRange: Range =
      range === 'day' || range === 'week' || range === 'month'
        ? range
        : 'month';

    return this.adminService.getUserStats(safeRange);
  }

  @Get('payments')
  async getPayments(
    @Query('page') page: string = '1',
    @Query('size') size: string = '20',
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    const pageNum = Number(page) || 1;
    const sizeNum = Number(size) || 20;

    const result = await this.adminService.getPayments(
      pageNum,
      sizeNum,
      status,
      q,
    );

    return {
      success: true,
      data: result,
    };
  }
}