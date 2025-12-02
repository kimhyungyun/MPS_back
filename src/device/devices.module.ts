import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDevice } from './entities/user-device.entity';
import { DevicesService } from './devices.service';
import { DevicesAdminController } from './devices.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserDevice])],
  providers: [DevicesService],
  controllers: [DevicesAdminController],
  exports: [DevicesService],
})
export class DevicesModule {}
