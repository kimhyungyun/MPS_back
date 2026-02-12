import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ 글로벌 유효성 검사 + 변환(중요)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                 // DTO에 없는 값 제거
      forbidNonWhitelisted: true,      // DTO에 없는 값 들어오면 400
      transform: true,                // ✅ class-transformer 적용
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API 접두어 설정
  app.setGlobalPrefix('api');

  // 정적 파일 서비스 (uploads 디렉토리)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3001);
}
bootstrap();
