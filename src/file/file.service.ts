// src/file/file.service.ts
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId =
      process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET || 'mpsnotices';

    console.log('🟡 AWS_REGION:', region);
    console.log('🟡 ACCESS_KEY 존재?', !!accessKeyId);
    console.log('🟡 SECRET_KEY 존재?', !!secretAccessKey);
    console.log('🟡 S3_BUCKET:', bucket);

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS 환경변수가 누락됨 (AWS_REGION / AWS_ACCESS_KEY / AWS_SECRET_KEY)',
      );
    }

    this.bucket = bucket;

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * 실제 S3에 파일 업로드
   */
  async uploadNoticeFile(file: Express.Multer.File, folder: string) {
    try {
      // 🔥 확장자만 추출
      const ext = file.originalname.split('.').pop();

      // 🔥 UUID 기반 안전한 key 생성
      const key = `${folder}/${Date.now()}-${uuidv4()}.${ext}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      return {
        key, // DB에는 이 key를 저장
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (err) {
      console.error('S3 upload error:', err);
      throw new InternalServerErrorException('S3 업로드 중 오류 발생');
    }
  }

  /**
   * 다운로드용 presigned GET URL
   */
  async getPresignedUrl(key: string, expiresIn = 600) {
    try {
      // 🔥 key에서 원래 파일명 복원
      const lastPart = key.split('/').pop() ?? '';
      const encodedName = lastPart.split('-').slice(1).join('-'); // 타임스탬프- 이후
      const fileName = encodedName
        ? decodeURIComponent(encodedName)
        : 'download';

      const contentDisposition = `attachment; filename="${encodeURIComponent(
        fileName,
      )}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: contentDisposition, // 👈 무조건 다운로드 + 예쁜 이름
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });

      return { url };
    } catch (err) {
      console.error('S3 presigned error:', err);
      throw new InternalServerErrorException(
        '프리사인드 URL 생성 오류',
      );
    }
  }
}
