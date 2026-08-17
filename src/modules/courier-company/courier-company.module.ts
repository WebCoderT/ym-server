import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourierCompanyEntity } from './entities/courier-company.entity';
import { CourierCompanyService } from './courier-company.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourierCompanyEntity])],
  providers: [CourierCompanyService],
  exports: [CourierCompanyService],
})
export class CourierCompanyModule {}
