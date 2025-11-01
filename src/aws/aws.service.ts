import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AwsService {
  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY as string,
      secretAccessKey: process.env.AWS_SECRET_KEY as string,
    },
  });

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `videos/${uuid()}-${file.originalname}`;  // S3의 파일 키 생성

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME as string,  // S3 버킷 이름
      Key: key,  // S3에 저장될 파일의 키 (파일 이름)
      Body: file.buffer,  // 파일 내용 (Multer에서 받아온 버퍼)
      ContentType: file.mimetype,  // 파일의 MIME 타입
    });

    await this.s3.send(command);  // S3에 파일 업로드

    // CloudFront URL로 변경하여 반환 (S3 URL 대신 CloudFront URL 사용)
    return `https://${process.env.CLOUDFRONT_URL}/videos/${key}`;
  }
}
