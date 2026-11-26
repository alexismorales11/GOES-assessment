import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import type { Category } from './category.entity.js';
import type { Product } from '../../products/entities/product.entity.js';

@Entity({ name: 'sub_categories' })
export class SubCategory {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  code: string;

  /** El CSV no trae nombre; queda null hasta que el negocio lo defina. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Index()
  @Column({ name: 'category_code', type: 'varchar', length: 20 })
  categoryCode: string;

  @ManyToOne('Category', (category: Category) => category.subCategories, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_code', referencedColumnName: 'code' })
  category: Category;

  @OneToMany('Product', (product: Product) => product.subCategory)
  products: Product[];
}
