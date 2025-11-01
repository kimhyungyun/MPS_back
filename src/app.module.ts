import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ 추가
import { TypeOrmModule } from '@nestjs/typeorm';
import typeOrmConfig from './config/typeorm.config';

import { UserModule } from './user/user.module';
import { LectureModule } from './lecture/lecture.module';
import { PostModule } from './post/post.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { FileModule } from './file/file.module';
import { NoticesModule } from './notices/notices.module';
import { SignedUrlModule } from './signedurl/signed-url.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}), 
    TypeOrmModule.forRoot(typeOrmConfig),
    PrismaModule,
    AdminModule,
    UserModule,
    LectureModule,
    PostModule,
    AuthModule,
    FileModule,
    NoticesModule,
    SignedUrlModule,
  ],
})
export class AppModule {}
