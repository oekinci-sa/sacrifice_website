import * as XLSX from "xlsx";
import type { Row, Table } from "@tanstack/react-table";
import { formatHisseBilgisiForExcel } from "@/lib/excel-export/format-hisse-bilgisi";
import { splitDateTimeForExcel } from "@/lib/excel-export/format-datetime-excel";
import { getVisibleLeafColumnIdsForExport } from "@/lib/excel-export/table-column-order";

/** Tablo dışı / Excel’de istenmeyen sütunlar */
export const DEFAULT_EXCEL_EXCLUDED_COLUMN_IDS = [
  "actions",
  "pdf",
  "last_edited_time",
  "last_edited_by",
] as const;

export type ExportTableToExcelOptions<TData> = {
  /** Ek olarak çıkarılacak sütun id’leri (örn. ödemeler: payment_status) */
  excludeColumnIds?: string[];
  /** Sütun bazlı hücre metni (Hisse Bilgisi vb.) */
  valueFormatter?: Partial<Record<string, (row: Row<TData>) => string>>;
  /** Tarih+saat iki sütun: id -> [tarih başlığı, saat başlığı] */
  splitDatetimeColumns?: Record<string, readonly [string, string]>;
};

/**
 * Tablodaki görünen sütun sırası + filtrelenmiş satırlar ile Excel oluşturur.
 */
export function exportTableToExcel<TData>(
  table: Table<TData>,
  filename = "export.xlsx",
  headerMap?: Record<string, string>,
  options?: ExportTableToExcelOptions<TData>
) {
  const exclude = new Set<string>([
    ...DEFAULT_EXCEL_EXCLUDED_COLUMN_IDS,
    ...(options?.excludeColumnIds ?? []),
  ]);

  const orderedIds = getVisibleLeafColumnIdsForExport(table).filter((id) => !exclude.has(id));
  const colById = new Map(table.getVisibleLeafColumns().map((c) => [c.id, c]));

  const headers: string[] = [];
  for (const id of orderedIds) {
    const split = options?.splitDatetimeColumns?.[id];
    if (split) {
      headers.push(split[0], split[1]);
    } else {
      const col = colById.get(id);
      if (headerMap?.[id]) {
        headers.push(headerMap[id]);
      } else {
        const h = col?.columnDef.header;
        headers.push(typeof h === "string" ? h : id);
      }
    }
  }

  const rows = table.getFilteredRowModel().rows;
  const formatters = options?.valueFormatter ?? {};
  const splitDatetime = options?.splitDatetimeColumns ?? {};

  const data = rows.map((row) => {
    const cells: string[] = [];
    for (const id of orderedIds) {
      if (splitDatetime[id]) {
        const v = row.getValue(id);
        const [d, t] = splitDateTimeForExcel(v);
        cells.push(d, t);
        continue;
      }
      const custom = formatters[id];
      if (custom) {
        cells.push(custom(row));
        continue;
      }

      const value = row.getValue(id);
      if (value == null || value === "") {
        cells.push("");
        continue;
      }
      if (typeof value === "object" && value !== null) {
        if ("sacrifice_no" in value) {
          cells.push(
            String((value as { sacrifice_no?: number }).sacrifice_no ?? "")
          );
          continue;
        }
      }
      cells.push(String(value));
    }
    return cells;
  });

  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Veri");

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeFilename = `${filename.replace(".xlsx", "")}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

type RowWithSacrifice = { sacrifice?: Parameters<typeof formatHisseBilgisiForExcel>[0] };

/** Ödemeler / hissedar satırı: sacrifice_info hücresi için */
export function sacrificeInfoExcelCell<TData extends RowWithSacrifice>(
  row: Row<TData>
): string {
  return formatHisseBilgisiForExcel(row.original.sacrifice);
}
