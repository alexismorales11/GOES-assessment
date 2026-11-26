import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import type { SubCategory } from './sub-category.entity.js';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  code: string;

  /** El CSV no trae nombre; queda null hasta que el negocio lo defina. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @OneToMany('SubCategory', (subCategory: SubCategory) => subCategory.category)
  subCategories: SubCategory[];
}
