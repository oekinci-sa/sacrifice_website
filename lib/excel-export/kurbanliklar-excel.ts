import * as XLSX from "xlsx";
import type { sacrificeSchema } from "@/types";
import type { Row, Table } from "@tanstack/react-table";
import { formatHisseBilgisiForExcel } from "@/lib/excel-export/format-hisse-bilgisi";
import { splitDateTimeForExcel } from "@/lib/excel-export/format-datetime-excel";
import { getVisibleLeafColumnIdsForExport } from "@/lib/excel-export/table-column-order";

const EXCLUDED_FROM_EXCEL = new Set([
  "pdf",
  "last_edited_time",
  "last_edited_by",
]);

function formatPaidOverTotal(
  paid: number | string | null | undefined,
  total: number | string | null | undefined
): string {
  const p = paid != null && paid !== "" ? Number(paid) : 0;
  const t = total != null && total !== "" ? Number(total) : 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n) + " TL";
  return `${fmt(p)} / ${fmt(t)}`;
}

/** Kesim / teslim: tek sütun; tarih+saat tek hücrede (ayrı "Tarih" sütunu yok). */
function formatKesimTeslimSingleCell(value: unknown): string {
  if (value == null || value === "") return "";
  const [d, t] = splitDateTimeForExcel(value);
  if (d && t) return `${d} ${t}`;
  if (t) return t;
  if (d) return d;
  return String(value);
}

/**
 * Kurbanlıklar: tablo sırası; yüzde ödeme yok; hissedar adı + ödeme durumu sütunları; Hisse Bilgisi metni.
 */
export function exportKurbanliklarToExcel(
  table: Table<sacrificeSchema>,
  filename: string,
  headerMap: Record<string, string>
) {
  const rawOrder = getVisibleLeafColumnIdsForExport(table).filter(
    (id) => id !== "actions" && !EXCLUDED_FROM_EXCEL.has(id)
  );

  const columnsWithoutPayment = rawOrder.filter((id) => id !== "payment_status");

  const headers: string[] = [];
  for (const id of columnsWithoutPayment) {
    headers.push(headerMap[id] || id);
  }
  for (let i = 1; i <= 7; i++) {
    headers.push(`${i}. Hissedar Adı`);
    headers.push(`${i}. Hissedar Ödeme Durumu`);
  }

  const rows = table.getFilteredRowModel().rows;
  const data = rows.map((row) => buildKurbanliklarRow(row, columnsWithoutPayment));

  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Veri");

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeFilename = `${filename.replace(".xlsx", "")}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

function buildKurbanliklarRow(
  row: Row<sacrificeSchema>,
  columnsWithoutPayment: string[]
): string[] {
  const original = row.original;
  const cells: string[] = [];

  for (const id of columnsWithoutPayment) {
    if (id === "sacrifice_time" || id === "planned_delivery_time") {
      const v = row.getValue(id);
      cells.push(formatKesimTeslimSingleCell(v));
      continue;
    }
    if (id === "share_price") {
      cells.push(formatHisseBilgisiForExcel(original));
      continue;
    }

    const value = row.getValue(id);
    cells.push(cellToString(value, original));
  }

  const shareholders = original.shareholders || [];
  for (let i = 0; i < 7; i++) {
    const s = shareholders[i];
    cells.push(s?.shareholder_name?.trim() ? String(s.shareholder_name) : "");
    cells.push(
      s ? formatPaidOverTotal(s.paid_amount, s.total_amount) : ""
    );
  }

  return cells;
}

function cellToString(value: unknown, original: sacrificeSchema): string {
  if (value == null || value === "") return "";
  if (typeof value === "object" && value !== null && "sacrifice_no" in value) {
    return String((value as { sacrifice_no?: number }).sacrifice_no ?? "");
  }
  return String(value);
}
