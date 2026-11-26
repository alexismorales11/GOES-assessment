import { parse } from 'csv-parse/sync';

export interface CsvProductRow {
  id: number;
  upcDescription: string;
  upcCode: string;
  categoryCode: string;
  subCategoryCode: string;
  dateAdded: Date;
  updatedDate: Date;
  addedBy: string;
  modifiedBy: string;
}

export const CSV_HEADERS = [
  'Id',
  'UpcDescription',
  'UpcCode',
  'CategoryCode',
  'SubCategoryCode',
  'DateAdded',
  'UpdatedDate',
  'AddedBy',
  'ModifiedBy',
] as const;

const UPC_REGEX = /^\d{12}$/;
const ISO_UTC_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export class CsvValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`El CSV contiene ${errors.length} error(es):\n - ${errors.join('\n - ')}`);
  }
}

/**
 * Convierte el contenido del CSV en filas tipadas y valida las reglas de negocio.
 * Si hay errores, no devuelve nada parcial: lanza CsvValidationError con todos ellos
 * para que la carga se aborte completa.
 */
export function parseProductsCsv(content: string): CsvProductRow[] {
  const records: Record<string, string>[] = parse(content, {
    columns: true,
    bom: true,
    trim: true,
    skip_empty_lines: true,
  });

  const errors: string[] = [];

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  const missing = CSV_HEADERS.filter((h) => !headers.includes(h));
  if (records.length > 0 && missing.length > 0) {
    throw new CsvValidationError([`Faltan columnas: ${missing.join(', ')}`]);
  }

  const seenUpc = new Map<string, number>();
  const seenId = new Map<number, number>();
  const subCategoryParent = new Map<string, string>();
  const rows: CsvProductRow[] = [];

  records.forEach((record, index) => {
    const line = index + 2; // +1 por el encabezado, +1 porque las líneas empiezan en 1
    const rowErrors: string[] = [];

    const id = Number(record.Id);
    if (!Number.isInteger(id) || id <= 0) rowErrors.push(`Id inválido "${record.Id}"`);

    const upcCode = record.UpcCode;
    const categoryCode = record.CategoryCode;
    const subCategoryCode = record.SubCategoryCode;

    if (!upcCode) rowErrors.push('UpcCode es obligatorio');
    else if (!UPC_REGEX.test(upcCode)) rowErrors.push(`UpcCode "${upcCode}" debe tener 12 dígitos`);
    if (!categoryCode) rowErrors.push('CategoryCode es obligatorio');
    if (!subCategoryCode) rowErrors.push('SubCategoryCode es obligatorio');

    for (const field of ['DateAdded', 'UpdatedDate'] as const) {
      if (!ISO_UTC_REGEX.test(record[field] ?? '')) {
        rowErrors.push(`${field} "${record[field]}" no está en formato UTC ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)`);
      }
    }
    if (!record.AddedBy) rowErrors.push('AddedBy es obligatorio');
    if (!record.ModifiedBy) rowErrors.push('ModifiedBy es obligatorio');

    if (upcCode && seenUpc.has(upcCode)) {
      rowErrors.push(`UpcCode "${upcCode}" duplicado (también en la línea ${seenUpc.get(upcCode)})`);
    }
    if (Number.isInteger(id) && seenId.has(id)) {
      rowErrors.push(`Id ${id} duplicado (también en la línea ${seenId.get(id)})`);
    }
    if (subCategoryCode && categoryCode) {
      const parent = subCategoryParent.get(subCategoryCode);
      if (parent && parent !== categoryCode) {
        rowErrors.push(
          `SubCategoryCode "${subCategoryCode}" aparece en las categorías "${parent}" y "${categoryCode}"`,
        );
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.map((e) => `Línea ${line}: ${e}`));
      return;
    }

    seenUpc.set(upcCode, line);
    seenId.set(id, line);
    subCategoryParent.set(subCategoryCode, categoryCode);

    rows.push({
      id,
      upcDescription: record.UpcDescription,
      upcCode,
      categoryCode,
      subCategoryCode,
      dateAdded: new Date(record.DateAdded),
      updatedDate: new Date(record.UpdatedDate),
      addedBy: record.AddedBy,
      modifiedBy: record.ModifiedBy,
    });
  });

  if (errors.length > 0) throw new CsvValidationError(errors);
  return rows;
}
