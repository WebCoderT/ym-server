import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationConfirmEntity } from './entities/notification-confirm.entity';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, NotificationConfirmEntity]),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
