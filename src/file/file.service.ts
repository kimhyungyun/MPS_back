import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { FileCategory, Prisma } from '@prisma/client';

@Injectable()
export class FileService {
  private readonly s3: S3Client;
  private readonly dataroomBucket: string;
  private readonly noticeBucket: string;

  constructor(private readonly prisma: PrismaService) {
    const region = process.env.AWS_REGION;
    const accessKeyId =
      process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;

    // 🔥 버킷 두 개 분리
    this.dataroomBucket =
      process.env.AWS_S3_DATAROOM_BUCKET ||
      process.env.AWS_S3_BUCKET || // 예전 env 호환
      'mpsdataroom';

    this.noticeBucket =
      process.env.AWS_S3_NOTICES_BUCKET || 'mpsnotices';

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS 환경변수가 누락됨 (AWS_REGION / AWS_ACCESS_KEY / AWS_SECRET_KEY)',
      );
    }

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // 공용 S3 업로드 헬퍼
  private async uploadToS3(
    bucket: string,
    file: Express.Multer.File,
    folder: string,
  ): Promise<{
    key: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> {
    try {
      const ext = file.originalname.split('.').pop();
      const key = `${folder}/${Date.now()}-${uuidv4()}.${ext}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return {
        key,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (err) {
      console.error('S3 upload error:', err);
      throw new InternalServerErrorException('S3 업로드 중 오류 발생');
    }
  }

  // =======================
  //  자료실(DATAROOM) 전용
  // =======================

  async uploadDataroomFile(file: Express.Multer.File, user: any) {
    try {
      // 🔥 자료실 파일은 mpsdataroom 버킷 사용
      const s3Result = await this.uploadToS3(
        this.dataroomBucket,
        file,
        'dataroom',
      );

      const saved = await this.prisma.file.create({
        data: {
          key: s3Result.key,
          originalName: s3Result.fileName,
          size: s3Result.fileSize,
          mimeType: s3Result.mimeType,
          category: FileCategory.DATAROOM,
          uploaderId: user.mb_id,
          uploaderNick: user.mb_nick,
        },
      });

      return saved;
    } catch (err) {
      console.error('uploadDataroomFile error:', err);
      throw new InternalServerErrorException('자료실 파일 업로드 중 오류');
    }
  }

  async listDataroomFiles(page = 1, pageSize = 10, search?: string) {
    const where: Prisma.FileWhereInput = {
      category: FileCategory.DATAROOM,
      ...(search
        ? {
            originalName: {
              contains: search,
            },
          }
        : {}),
    };

    try {
      const [total, rows] = await this.prisma.$transaction([
        this.prisma.file.count({ where }),
        this.prisma.file.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      const files = rows.map((f) => ({
        id: f.id,
        name: f.originalName,
        type: f.mimeType,
        size: (f.size ?? 0).toString(),
        upload_date: f.createdAt.toISOString(),
        s3_key: f.key,
        user: {
          mb_nick: f.uploaderNick ?? '',
        },
      }));

      return { files, totalPages };
    } catch (err) {
      console.error('listDataroomFiles error:', err);
      throw new InternalServerErrorException('자료실 목록 조회 중 오류');
    }
  }

  async deleteDataroomFile(id: number) {
    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file || file.category !== FileCategory.DATAROOM) {
      throw new NotFoundException('자료실 파일을 찾을 수 없습니다.');
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.dataroomBucket,
          Key: file.key,
        }),
      );
    } catch (err) {
      console.error('S3 delete error:', err);
    }

    await this.prisma.file.delete({ where: { id } });
    return { success: true };
  }

  async getPresignedUrl(key: string, expiresIn = 600) {
    try {
      const lastPart = key.split('/').pop() ?? '';
      const encodedName = lastPart.split('-').slice(1).join('-');
      const fileName = encodedName
        ? decodeURIComponent(encodedName)
        : 'download';

      const contentDisposition = `attachment; filename="${encodeURIComponent(
        fileName,
      )}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;

      const command = new GetObjectCommand({
        Bucket: this.dataroomBucket, // 🔥 자료실 버킷에서 presigned
        Key: key,
        ResponseContentDisposition: contentDisposition,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });

      return { url };
    } catch (err) {
      console.error('S3 presigned error:', err);
      throw new InternalServerErrorException('프리사인드 URL 생성 오류');
    }
  }

  // =======================
  //  공지사항 에디터 이미지
  // =======================

  async uploadNoticeImage(file: Express.Multer.File, user: any) {
    try {
      // 🔥 공지 이미지용은 mpsnotices 버킷 사용
      const s3Result = await this.uploadToS3(
        this.noticeBucket,
        file,
        'notices',
      );

      // 지금은 DB 안 남기고 S3 정보만 반환
      return s3Result; // { key, fileName, fileSize, mimeType }
    } catch (err) {
      console.error('uploadNoticeImage error:', err);
      throw new InternalServerErrorException('공지 이미지 업로드 중 오류');
    }
  }
}
