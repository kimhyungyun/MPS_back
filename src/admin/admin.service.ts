import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

interface RawBucketRow {
  bucket: any;
  count: bigint;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private formatDayLabel(value: any): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${month}.${day}`;
  }

  private formatMonthLabel(bucket: any): string {
    const str = String(bucket);
    const [year, month] = str.split('-');

    if (!year || !month) return str;

    return `${year}.${month}`;
  }

  private getWeekRangeFromBucket(bucket: any): { start: Date; end: Date } {
    const str = String(bucket);
    const [yearPart, weekPart] = str.split('-W');
    const year = Number(yearPart);
    const week = Number(weekPart);

    if (!year || !week) {
      const now = new Date();
      return { start: now, end: now };
    }

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay() || 7;

    if (dayOfWeek !== 1) {
      simple.setDate(simple.getDate() - (dayOfWeek - 1));
    }

    const start = simple;
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
  }

  private formatWeekRangeLabel(bucket: any): string {
    const { start, end } = this.getWeekRangeFromBucket(bucket);

    const mm = (d: Date) => String(d.getMonth() + 1).padStart(2, '0');
    const dd = (d: Date) => String(d.getDate()).padStart(2, '0');

    return `${mm(start)}.${dd(start)}~${mm(end)}.${dd(end)}`;
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '대기',
      completed: '완료',
      failed: '실패',
      refunded: '환불',
      cancelled: '취소',
    };

    return map[status] ?? status;
  }

  private methodLabel(method: string): string {
    const map: Record<string, string> = {
      credit_card: '카드',
      bank_transfer: '계좌이체',
      virtual_account: '가상계좌',
      mobile_payment: '휴대폰',
    };

    return map[method] ?? method;
  }

  async getMembers(
    page: number,
    pageSize: number,
    search?: string,
    sortKey?: SortKey,
    sortOrder: SortOrder = 'asc',
    authority: AuthorityFilter = 'all',
  ) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;

    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100
        ? pageSize
        : 10;

    const skip = (safePage - 1) * safePageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { mb_id: { contains: search } },
        { mb_name: { contains: search } },
        { mb_nick: { contains: search } },
        { mb_hp: { contains: search } },
        { mb_school: { contains: search } },
      ];
    }

    if (authority && authority !== 'all') {
      if (authority === 'hasAuthority') {
        where.videoAuthorities = {
          some: {},
        };
      } else if (authority === 'none') {
        where.videoAuthorities = {
          none: {},
        };
      } else if (authority === 'A' || authority === 'B') {
        where.videoAuthorities = {
          some: {
            classGroup: authority,
          },
        };
      } else {
        where.videoAuthorities = {
          some: {
            type: authority,
          },
        };
      }
    }

    let orderBy: any = {
      mb_datetime: 'desc',
    };

    if (sortKey === 'name') {
      orderBy = {
        mb_name: sortOrder,
      };
    } else if (sortKey === 'latest') {
      orderBy = {
        mb_datetime: sortOrder,
      };
    }

    try {
      const [members, total] = await Promise.all([
        this.prisma.g5_member.findMany({
          where,
          skip,
          take: safePageSize,
          orderBy,
          select: {
            mb_no: true,
            mb_id: true,
            mb_name: true,
            mb_nick: true,
            mb_email: true,
            mb_tel: true,
            mb_hp: true,
            mb_level: true,
            mb_school: true,
            mb_addr1: true,
            mb_addr2: true,

            videoAuthorities: {
              select: {
                id: true,
                userId: true,
                classGroup: true,
                type: true,
                created_at: true,
                updated_at: true,
              },
            },
          },
        }),

        this.prisma.g5_member.count({
          where,
        }),
      ]);

      return {
        members: members.map((member) => ({
          mb_no: member.mb_no,
          mb_id: member.mb_id,
          mb_name: member.mb_name,
          mb_nick: member.mb_nick,
          mb_email: member.mb_email,
          mb_tel: member.mb_tel,
          mb_hp: member.mb_hp,
          mb_level: member.mb_level,
          mb_school: member.mb_school,
          mb_addr1: member.mb_addr1,
          mb_addr2: member.mb_addr2,

          authorities: member.videoAuthorities,
        })),
        total,
        page: safePage,
        pageSize: safePageSize,
      };
    } catch (err) {
      console.error('getMembers() error:', err);

      const msg =
        (err as any)?.message ??
        '회원 목록 조회 중 알 수 없는 오류가 발생했습니다.';

      throw new InternalServerErrorException(`getMembers() 실패: ${msg}`);
    }
  }

  async updateMemberLevel(mb_id: string, mb_level: number) {
    if (mb_level < 1 || mb_level > 10) {
      throw new Error('회원 레벨은 1부터 10 사이여야 합니다.');
    }

    try {
      const member = await this.prisma.g5_member.update({
        where: { mb_id },
        data: { mb_level },
      });

      if (!member) {
        throw new NotFoundException('회원을 찾을 수 없습니다.');
      }

      return member;
    } catch (err) {
      console.error('updateMemberLevel() error:', err);

      throw new InternalServerErrorException('회원 레벨 변경 중 오류 발생');
    }
  }

  async getAdminStats() {
    try {
      const totalUsers = await this.prisma.g5_member.count();
      const totalLectures = await this.prisma.lecture.count();

      return {
        totalUsers,
        totalLectures,
      };
    } catch (err) {
      console.error('getAdminStats() error:', err);

      throw new InternalServerErrorException('통계 정보 조회 중 오류 발생');
    }
  }

  async getUserStats(range: Range) {
    try {
      let signupsRaw: RawBucketRow[] = [];

      if (range === 'day') {
        signupsRaw = await this.prisma.$queryRaw<RawBucketRow[]>`
          SELECT DATE(mb_datetime) AS bucket, COUNT(*) AS count
          FROM g5_member
          WHERE mb_datetime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DATE(mb_datetime)
          ORDER BY DATE(mb_datetime)
        `;
      } else if (range === 'week') {
        signupsRaw = await this.prisma.$queryRaw<RawBucketRow[]>`
          SELECT DATE_FORMAT(mb_datetime, '%x-W%v') AS bucket, COUNT(*) AS count
          FROM g5_member
          WHERE mb_datetime >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
          GROUP BY DATE_FORMAT(mb_datetime, '%x-W%v')
          ORDER BY DATE_FORMAT(mb_datetime, '%x-W%v')
        `;
      } else {
        signupsRaw = await this.prisma.$queryRaw<RawBucketRow[]>`
          SELECT DATE_FORMAT(mb_datetime, '%Y-%m') AS bucket, COUNT(*) AS count
          FROM g5_member
          WHERE mb_datetime >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(mb_datetime, '%Y-%m')
          ORDER BY DATE_FORMAT(mb_datetime, '%Y-%m')
        `;
      }

      const signups = signupsRaw.map((row, index) => {
        let label: string;

        if (range === 'day') {
          label = this.formatDayLabel(row.bucket);
        } else if (range === 'week') {
          const rangeLabel = this.formatWeekRangeLabel(row.bucket);
          label = `${index + 1}주차 (${rangeLabel})`;
        } else {
          label = this.formatMonthLabel(row.bucket);
        }

        return {
          label,
          count: Number(row.count),
        };
      });

      const totalSignups = await this.prisma.g5_member.count();

      const visits: { label: string; count: number }[] = [];
      const totalVisits = 0;

      return {
        range,
        signups,
        visits,
        totalSignups,
        totalVisits,
      };
    } catch (err) {
      console.error('getUserStats() error:', err);

      throw new InternalServerErrorException('회원 통계 조회 중 오류 발생');
    }
  }

  async getPayments(page: number, size: number, status?: string, q?: string) {
    const pageNum = Number.isFinite(page) && page > 0 ? page : 1;

    const sizeNum =
      Number.isFinite(size) && size > 0 && size <= 100 ? size : 20;

    const skip = (pageNum - 1) * sizeNum;

    const statusTrim = String(status ?? '').trim();
    const qTrim = String(q ?? '').trim();

    const allowedStatus = new Set([
      '',
      'pending',
      'completed',
      'failed',
      'refunded',
      'cancelled',
    ]);

    if (!allowedStatus.has(statusTrim)) {
      throw new BadRequestException('status가 올바르지 않습니다.');
    }

    const where: any = {};

    if (statusTrim) {
      where.paymentStatus = statusTrim;
    }

    if (qTrim) {
      where.OR = [
        { orderId: { contains: qTrim } },
        { paymentKey: { contains: qTrim } },
        { g5_member: { mb_id: { contains: qTrim } } },
        { g5_member: { mb_name: { contains: qTrim } } },
        { g5_member: { mb_hp: { contains: qTrim } } },
        { lecture_package: { name: { contains: qTrim } } },
      ];
    }

    try {
      const [total, rows] = await this.prisma.$transaction([
        this.prisma.payment.count({ where }),

        this.prisma.payment.findMany({
          where,
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take: sizeNum,
          select: {
            id: true,
            orderId: true,
            amount: true,
            paymentStatus: true,
            paymentMethod: true,
            provider: true,
            approvedAt: true,
            created_at: true,
            receiptUrl: true,

            g5_member: {
              select: {
                mb_no: true,
                mb_id: true,
                mb_name: true,
                mb_hp: true,
              },
            },

            lecture_package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      return {
        page: pageNum,
        size: sizeNum,
        total,

        items: rows.map((r) => ({
          id: r.id,
          orderId: r.orderId,

          buyerName: r.g5_member?.mb_name ?? r.g5_member?.mb_id ?? '-',
          buyerPhone: r.g5_member?.mb_hp ?? '-',

          packageName: r.lecture_package?.name ?? '-',

          paymentMethod: r.paymentMethod,
          paymentMethodLabel: this.methodLabel(String(r.paymentMethod)),

          paymentStatus: r.paymentStatus,
          paymentStatusLabel: this.statusLabel(String(r.paymentStatus)),

          amount: r.amount,
          createdAt: r.created_at,
          approvedAt: r.approvedAt,
          receiptUrl: r.receiptUrl,

          provider: r.provider,
          mb_no: r.g5_member?.mb_no ?? null,
          mb_id: r.g5_member?.mb_id ?? null,
          lecturePackageId: r.lecture_package?.id ?? null,
        })),
      };
    } catch (err) {
      console.error('getPayments() error:', err);

      const msg =
        (err as any)?.message ??
        '결제 내역 조회 중 알 수 없는 오류가 발생했습니다.';

      throw new InternalServerErrorException(`getPayments() 실패: ${msg}`);
    }
  }
}