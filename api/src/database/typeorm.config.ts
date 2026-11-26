import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { SubCategory } from '../categories/entities/sub-category.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../users/entities/user.entity.js';
import { requireEnv } from '../config/load-env.js';

export const entities = [Category, SubCategory, Product, User];

/**
 * Configuración única de TypeORM, compartida por la API (TypeOrmModule),
 * el CLI de migraciones (data-source.ts) y la carga inicial (seed).
 *
 * `synchronize` está desactivado: el esquema solo cambia mediante migraciones.
 */
export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    url: requireEnv('DATABASE_URL'),
    entities,
    migrations: [join(import.meta.dirname, 'migrations', '*.js')],
    synchronize: false,
    logging: ['error', 'warn'],
  };
}
