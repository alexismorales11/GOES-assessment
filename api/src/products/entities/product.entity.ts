import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { SubCategory } from '../../categories/entities/sub-category.entity.js';

/**
 * La Categoría del producto se obtiene a través de su SubCategoría
 * (producto → subcategoría → categoría), por lo que no se duplica aquí.
 */
@Entity({ name: 'products' })
@Check('CHK_products_upc_code_format', `"upc_code" ~ '^[0-9]{12}$'`)
export class Product {
  /** BY DEFAULT permite conservar el Id del CSV en la carga inicial. */
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Index('UQ_products_upc_code', { unique: true })
  @Column({ name: 'upc_code', type: 'varchar', length: 12 })
  upcCode: string;

  @Column({ name: 'upc_description', type: 'varchar', length: 255, nullable: true })
  upcDescription: string | null;

  @Index()
  @Column({ name: 'sub_category_code', type: 'varchar', length: 20 })
  subCategoryCode: string;

  @ManyToOne('SubCategory', (subCategory: SubCategory) => subCategory.products, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'sub_category_code', referencedColumnName: 'code' })
  subCategory: SubCategory;

  @Column({ name: 'date_added', type: 'timestamptz' })
  dateAdded: Date;

  @Column({ name: 'added_by', type: 'varchar', length: 255 })
  addedBy: string;

  /** Al crear un producto se llena con los mismos valores que DateAdded/AddedBy. */
  @Column({ name: 'updated_date', type: 'timestamptz' })
  updatedDate: Date;

  @Column({ name: 'modified_by', type: 'varchar', length: 255 })
  modifiedBy: string;
}
