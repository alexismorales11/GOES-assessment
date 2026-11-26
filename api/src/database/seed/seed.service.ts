import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { DataSource, EntityManager } from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';
import { SubCategory } from '../../categories/entities/sub-category.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { User } from '../../users/entities/user.entity.js';
import type { CsvProductRow } from './csv-products.parser.js';

/** Usuarios definidos en el enunciado (sección 7). Ambos con el mismo acceso. */
export const SEED_USERS = [
  { email: 'admin@prueba.local', password: 'Admin123!' },
  { email: 'manager@prueba.local', password: 'Manager123!' },
] as const;

const BCRYPT_ROUNDS = 10;

export interface EntitySummary {
  inserted: number;
  total: number;
}

export interface SeedSummary {
  categories: EntitySummary;
  subCategories: EntitySummary;
  products: EntitySummary;
  users: EntitySummary;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Aplica las migraciones pendientes para que la carga funcione sobre una BD vacía. */
  async runPendingMigrations(): Promise<void> {
    const applied = await this.dataSource.runMigrations({ transaction: 'all' });
    if (applied.length > 0) {
      this.logger.log(`Migraciones aplicadas: ${applied.map((m) => m.name).join(', ')}`);
    }
  }

  /**
   * Carga idempotente: todo se inserta con ON CONFLICT DO NOTHING dentro de una
   * única transacción. Volver a ejecutarla no duplica ni sobrescribe registros
   * existentes (respeta los cambios hechos desde la aplicación).
   */
  async seed(rows: CsvProductRow[]): Promise<SeedSummary> {
    return this.dataSource.transaction(async (manager) => {
      const categories = await this.insertCategories(manager, rows);
      const subCategories = await this.insertSubCategories(manager, rows);
      const products = await this.insertProducts(manager, rows);
      const users = await this.insertUsers(manager);

      return {
        categories: { inserted: categories, total: await manager.count(Category) },
        subCategories: { inserted: subCategories, total: await manager.count(SubCategory) },
        products: { inserted: products, total: await manager.count(Product) },
        users: { inserted: users, total: await manager.count(User) },
      };
    });
  }

  private async insertCategories(manager: EntityManager, rows: CsvProductRow[]): Promise<number> {
    const codes = [...new Set(rows.map((r) => r.categoryCode))];
    if (codes.length === 0) return 0;
    const result = await manager
      .createQueryBuilder()
      .insert()
      .into(Category)
      .values(codes.map((code) => ({ code, name: null })))
      .orIgnore()
      .returning(['code'])
      .execute();
    return result.raw.length;
  }

  private async insertSubCategories(manager: EntityManager, rows: CsvProductRow[]): Promise<number> {
    const byCode = new Map(rows.map((r) => [r.subCategoryCode, r.categoryCode]));
    if (byCode.size === 0) return 0;

    // Una SubCategoría que ya existe bajo otra Categoría es un conflicto de datos, no se ignora.
    const existing = await manager.find(SubCategory, { select: { code: true, categoryCode: true } });
    const conflicts = existing.filter((s) => byCode.has(s.code) && byCode.get(s.code) !== s.categoryCode);
    if (conflicts.length > 0) {
      throw new Error(
        `SubCategorías ya registradas bajo otra Categoría: ${conflicts
          .map((s) => `${s.code} (BD: ${s.categoryCode}, CSV: ${byCode.get(s.code)})`)
          .join(', ')}`,
      );
    }

    const result = await manager
      .createQueryBuilder()
      .insert()
      .into(SubCategory)
      .values([...byCode].map(([code, categoryCode]) => ({ code, categoryCode, name: null })))
      .orIgnore()
      .returning(['code'])
      .execute();
    return result.raw.length;
  }

  private async insertProducts(manager: EntityManager, rows: CsvProductRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    // ON CONFLICT DO NOTHING sin columna objetivo: ignora el conflicto por Id o por UpcCode.
    const result = await manager
      .createQueryBuilder()
      .insert()
      .into(Product)
      .values(
        rows.map((r) => ({
          id: r.id,
          upcCode: r.upcCode,
          upcDescription: r.upcDescription || null,
          subCategoryCode: r.subCategoryCode,
          dateAdded: r.dateAdded,
          addedBy: r.addedBy,
          updatedDate: r.updatedDate,
          modifiedBy: r.modifiedBy,
        })),
      )
      .orIgnore()
      .returning(['id'])
      .execute();

    // Los Id del CSV se insertan explícitamente; se ajusta la identidad para que
    // los productos creados desde la API continúen después del Id más alto.
    await manager.query(
      `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 0) + 1, false)`,
    );
    return result.raw.length;
  }

  private async insertUsers(manager: EntityManager): Promise<number> {
    const values = await Promise.all(
      SEED_USERS.map(async ({ email, password }) => ({
        email,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      })),
    );
    const result = await manager
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(values)
      .orIgnore()
      .returning(['id'])
      .execute();
    return result.raw.length;
  }
}
