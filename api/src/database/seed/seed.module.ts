import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from '../typeorm.config.js';
import { SeedService } from './seed.service.js';

/** Módulo mínimo para ejecutar la carga inicial como contexto standalone de Nest (sin HTTP). */
@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() })],
  providers: [SeedService],
})
export class SeedModule {}
