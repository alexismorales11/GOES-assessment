import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Carpeta raíz de la API (`api/`), calculada desde src/config o dist/config. */
export const API_ROOT = resolve(import.meta.dirname, '..', '..');

/**
 * Ruta a `api/.env`. Se resuelve desde la ubicación de este archivo
 * (src/config o dist/config), así no depende del directorio desde donde se ejecute.
 */
export const API_ENV_FILE = resolve(API_ROOT, '.env');

/**
 * Carga `api/.env` sin sobrescribir las variables que ya existen en el entorno
 * (por ejemplo, las que define docker-compose).
 */
export function loadEnv(): void {
  if (existsSync(API_ENV_FILE)) {
    process.loadEnvFile(API_ENV_FILE);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name} (revisa api/.env)`);
  }
  return value;
}
