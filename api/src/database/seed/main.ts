import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { API_ROOT, loadEnv } from '../../config/load-env.js';

/**
 * Carga inicial: `npm run seed`
 *
 * 1. Aplica las migraciones pendientes.
 * 2. Lee y valida el CSV (SEED_CSV_PATH relativa a api/; por defecto ../data/productos.csv).
 * 3. Inserta Categorías, SubCategorías, Productos y usuarios sin duplicar.
 * 4. Muestra un resumen con lo insertado en esta ejecución y el total en la BD.
 */
loadEnv();

const { SeedModule } = await import('./seed.module.js');
const { SeedService } = await import('./seed.service.js');
const { parseProductsCsv } = await import('./csv-products.parser.js');

const logger = new Logger('Seed');
const csvPath = resolve(API_ROOT, process.env.SEED_CSV_PATH ?? '../data/productos.csv');

const app = await NestFactory.createApplicationContext(SeedModule, { logger: ['error', 'warn', 'log'] });
try {
  const seedService = app.get(SeedService);
  await seedService.runPendingMigrations();

  logger.log(`Leyendo ${csvPath}`);
  const rows = parseProductsCsv(readFileSync(csvPath, 'utf8'));
  logger.log(`Filas válidas en el CSV: ${rows.length}`);

  const summary = await seedService.seed(rows);
  console.log('\nResumen de la carga inicial');
  console.table({
    'Categorías': summary.categories,
    'SubCategorías': summary.subCategories,
    'Productos': summary.products,
    'Usuarios': summary.users,
  });
} catch (error) {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await app.close();
}
