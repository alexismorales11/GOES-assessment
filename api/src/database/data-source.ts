import { DataSource } from 'typeorm';
import { loadEnv } from '../config/load-env.js';
import { buildDataSourceOptions } from './typeorm.config.js';

// Punto de entrada del CLI de TypeORM (se ejecuta sobre el código compilado en dist/).
loadEnv();

export default new DataSource(buildDataSourceOptions());
