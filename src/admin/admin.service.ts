import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Range = 'day' | 'week' | 'month';

type SortKey = 'name' | 'latest';
type SortOrder = 'asc' | 'desc';

interface RawBucketRow {
  bucket: any;
  count: bigint;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ---------- 유틸: 날짜/라벨 포맷 ----------

  // 일별: 11.23
  private formatDayLabel(value: any): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  }

  // 월별: 2025.11
  private formatMonthLabel(bucket: any): string {
    const str = String(bucket); // 예: 2025-11
    const [year, month] = str.split('-');
    if (!year || !month) return str;
    return `${year}.${month}`;
  }

  // ISO 주차 문자열(예: 2025-W45) → 해당 주의 시작/끝 날짜 구하기
  private getWeekRangeFromBucket(bucket: any): { start: Date; end: Date } {
    const str = String(bucket); // "2025-W45"
    const [yearPart, weekPart] = str.split('-W');
    const year = Number(yearPart);
    const week = Number(weekPart);

    if (!year || !week) {
      const now = new Date();
      return { start: now, end: now };
    }

    // ISO 주차 -> 월요일 날짜 계산
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay() || 7; // 1=월, 7=일
    if (dayOfWeek !== 1) {
      simple.setDate(simple.getDate() - (dayOfWeek - 1));
    }
    const start = simple;
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
  }

  // 주범위 라벨: "MM.DD~MM.DD"
  private formatWeekRangeLabel(bucket: any): string {
    const { start, end } = this.getWeekRangeFromBucket(bucket);

    const mm = (d: Date) => String(d.getMonth() + 1).padStart(2, '0');
    const dd = (d: Date) => String(d.getDate()).padStart(2, '0');

    return `${mm(start)}.${dd(start)}~${mm(end)}.${dd(end)}`;
  }

  // ✅ 회원 리스트 + 검색 + 페이지네이션 + 전체 정렬
  async getMembers(
    page: number,
    search?: string,
    sortKey?: SortKey,
    sortOrder: SortOrder = 'asc',
  ) {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { mb_id: { contains: search } },
            { mb_name: { contains: search } },
            { mb_nick: { contains: search } },
          ],
        }
      : {};

    // 기본 최신순
    let orderBy: any = { mb_datetime: 'desc' as SortOrder };

    if (sortKey === 'name') {
      orderBy = { mb_name: sortOrder };
    } else if (sortKey === 'latest') {
      orderBy = { mb_datetime: sortOrder };
      // mb_datetime 없으면: orderBy = { mb_id: sortOrder };
    }

    try {
      const [members, total] = await Promise.all([
        this.prisma.g5_member.findMany({
          where,
          skip,
          take: pageSize,
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
          },
        }),
        this.prisma.g5_member.count({ where }),
      ]);

      return {
        members,
        total,
      };
    } catch (err) {
      console.error('getMembers() error:', err);
      const msg =
        (err as any)?.message ??
        '회원 목록 조회 중 알 수 없는 오류가 발생했습니다.';
      throw new InternalServerErrorException(`getMembers() 실패: ${msg}`);
    }
  }

  // ✅ 레벨 변경
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

  // ✅ 관리자 대시보드 요약 통계
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

  // ✅ 회원 통계 상세 (가입자 수 / 방문자 수)
  async getUserStats(range: Range) {
    try {
      let signupsRaw: RawBucketRow[] = [];

      if (range === 'day') {
        // 최근 30일 일별 가입자 수
        signupsRaw = await this.prisma.$queryRaw<RawBucketRow[]>`
          SELECT DATE(mb_datetime) AS bucket, COUNT(*) AS count
          FROM g5_member
          WHERE mb_datetime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DATE(mb_datetime)
          ORDER BY DATE(mb_datetime)
        `;
      } else if (range === 'week') {
        // 최근 12주 주별 가입자 수 (YYYY-Www)
        signupsRaw = await this.prisma.$queryRaw<RawBucketRow[]>`
          SELECT DATE_FORMAT(mb_datetime, '%x-W%v') AS bucket, COUNT(*) AS count
          FROM g5_member
          WHERE mb_datetime >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
          GROUP BY DATE_FORMAT(mb_datetime, '%x-W%v')
          ORDER BY DATE_FORMAT(mb_datetime, '%x-W%v')
        `;
      } else {
        // month: 최근 12개월 월별 가입자 수 (YYYY-MM)
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
          // 11.23
          label = this.formatDayLabel(row.bucket);
        } else if (range === 'week') {
          // 1주차 (11.03~11.09)
          const rangeLabel = this.formatWeekRangeLabel(row.bucket);
          label = `${index + 1}주차 (${rangeLabel})`;
        } else {
          // 2025.11
          label = this.formatMonthLabel(row.bucket);
        }

        return {
          label,
          count: Number(row.count),
        };
      });

      const totalSignups = await this.prisma.g5_member.count();

      // 방문자 수는 아직 0 가정
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
}
