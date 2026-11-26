import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { buildDataSourceOptions } from './database/typeorm.config.js';

@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
