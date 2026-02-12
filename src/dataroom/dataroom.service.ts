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
import { DataroomKind, Prisma } from '@prisma/client';

@Injectable()
export class DataroomService {
  private readonly s3: S3Client;
  private readonly dataroomBucket: string;

  constructor(private readonly prisma: PrismaService) {
    const region = process.env.AWS_REGION;
    const accessKeyId =
      process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;

    this.dataroomBucket =
      process.env.AWS_S3_DATAROOM_BUCKET ||
      process.env.AWS_S3_BUCKET ||
      'mpsdataroom';

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

  // ================================
  //  DATA1 / DATA2 자료실 공통 로직
  // ================================

  async uploadDataroomFile(
    file: Express.Multer.File,
    user: any,
    kind: DataroomKind,
  ) {
    try {
      // 🔥 kind 에 따라 S3 폴더 선택
      const folder = kind === DataroomKind.DATA1 ? 'DATA1' : 'DATA2';

      const s3Result = await this.uploadToS3(
        this.dataroomBucket,
        file,
        folder,
      );

      let decodedName = s3Result.fileName;
      try {
        decodedName = decodeURIComponent(s3Result.fileName);
      } catch {
        // ignore
      }

      const saved = await this.prisma.dataroomFile.create({
        data: {
          key: s3Result.key,
          originalName: decodedName,
          size: s3Result.fileSize,
          mimeType: s3Result.mimeType,
          uploaderId: user.mb_id,
          uploaderNick: user.mb_nick,
          kind,
        },
      });

      return saved;
    } catch (err) {
      console.error('uploadDataroomFile error:', err);
      throw new InternalServerErrorException('자료실 파일 업로드 중 오류');
    }
  }

  async listDataroomFiles(
    kind: DataroomKind,
    page = 1,
    pageSize = 10,
    search?: string,
  ) {
    const where: Prisma.DataroomFileWhereInput = {
      kind,
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
        this.prisma.dataroomFile.count({ where }),
        this.prisma.dataroomFile.findMany({
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
    const file = await this.prisma.dataroomFile.findUnique({ where: { id } });

    if (!file) {
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
      // S3 삭제 실패해도 DB는 삭제
    }

    await this.prisma.dataroomFile.delete({ where: { id } });
    return { success: true };
  }

  async getPresignedUrl(key: string, expiresIn = 600) {
    try {
      const file = await this.prisma.dataroomFile.findUnique({
        where: { key },
      });

      if (!file) {
        throw new NotFoundException('파일을 찾을 수 없습니다.');
      }

      let fileName = file.originalName;
      try {
        fileName = decodeURIComponent(fileName);
      } catch {
        // ignore
      }

      const contentDisposition = `attachment; filename="${encodeURIComponent(
        fileName,
      )}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;

      const command = new GetObjectCommand({
        Bucket: this.dataroomBucket,
        Key: key,
        ResponseContentDisposition: contentDisposition,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });

      return { url };
    } catch (err) {
      console.error('S3 presigned error:', err);
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('프리사인드 URL 생성 오류');
    }
  }
}
