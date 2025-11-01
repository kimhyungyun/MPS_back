import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 글로벌 유효성 검사
  app.useGlobalPipes(new ValidationPipe());

  // CORS 설정
  // app.enableCors({
  //   origin: ['https://mps-project.vercel.app'], // 허용된 출처
  //   credentials: true, // 쿠키 및 인증정보 허용
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 허용된 HTTP 메서드
  //   allowedHeaders: ['Content-Type', 'Authorization'], // 허용된 헤더
  // });

  // API 접두어 설정
  app.setGlobalPrefix('api');

  // 정적 파일 서비스 (uploads 디렉토리)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/', // '/uploads/'로 접근 시 정적 파일 제공
  });

  await app.listen(3001); // 서버 시작
}
bootstrap();
