import * as XLSX from "xlsx";
import type { shareholderSchema } from "@/types";
import type { Row, Table } from "@tanstack/react-table";
import { formatHisseBilgisiForExcel } from "@/lib/excel-export/format-hisse-bilgisi";
import { splitDateTimeForExcel } from "@/lib/excel-export/format-datetime-excel";
import { getVisibleLeafColumnIdsForExport } from "@/lib/excel-export/table-column-order";

const EXCLUDED_FROM_EXCEL = new Set([
  "pdf",
  "last_edited_time",
  "last_edited_by",
]);

function formatTLCell(n: number | string | null | undefined): string {
  if (n == null || n === "") return "";
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(num) + " TL";
}

function contactedAtExcel(original: shareholderSchema): string {
  return original.contacted_at ? "Görüşüldü" : "Görüşülmedi";
}

function consentExcel(original: shareholderSchema): string {
  return original.sacrifice_consent === true ? "Alındı" : "Alınmadı";
}

/**
 * Tüm Hissedarlar: sütun sırası tablo ile aynı; ödeme üç tutar; Hisse Bilgisi metni.
 */
export function exportHissedarlarToExcel(
  table: Table<shareholderSchema>,
  filename: string,
  headerMap: Record<string, string>
) {
  const rawOrder = getVisibleLeafColumnIdsForExport(table).filter(
    (id) => id !== "actions" && !EXCLUDED_FROM_EXCEL.has(id)
  );

  const columnsWithoutPayment = rawOrder.filter((id) => id !== "payment_status");

  const headers: string[] = [];
  for (const id of columnsWithoutPayment) {
    if (id === "purchase_time") {
      headers.push("Kayıt Tarihi", "Kayıt Saati");
      continue;
    }
    headers.push(headerMap[id] || id);
  }
  headers.push(
    headerMap.paid_amount ?? "Ödenen Tutar",
    headerMap.remaining_payment ?? "Kalan Ödeme",
    headerMap.total_amount ?? "Toplam Tutar"
  );

  const rows = table.getFilteredRowModel().rows;
  const data = rows.map((row) => buildHissedarlarRow(row, columnsWithoutPayment));

  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Veri");

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeFilename = `${filename.replace(".xlsx", "")}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

function buildHissedarlarRow(
  row: Row<shareholderSchema>,
  columnsWithoutPayment: string[]
): string[] {
  const original = row.original;
  const cells: string[] = [];

  for (const id of columnsWithoutPayment) {
    if (id === "contacted_at") {
      cells.push(contactedAtExcel(original));
      continue;
    }
    if (id === "purchase_time") {
      const v = row.getValue("purchase_time");
      const [d, t] = splitDateTimeForExcel(v);
      cells.push(d, t);
      continue;
    }
    if (id === "sacrifice_consent") {
      cells.push(consentExcel(original));
      continue;
    }
    if (id === "sacrifice_info") {
      cells.push(formatHisseBilgisiForExcel(original.sacrifice));
      continue;
    }

    const value = row.getValue(id);
    cells.push(cellToString(value, original, id));
  }

  cells.push(
    formatTLCell(original.paid_amount),
    formatTLCell(original.remaining_payment),
    formatTLCell(original.total_amount)
  );

  return cells;
}

function cellToString(
  value: unknown,
  original: shareholderSchema,
  columnId: string
): string {
  if (value == null || value === "") return "";
  if (columnId === "sacrifice_no" && original.sacrifice?.sacrifice_no != null) {
    return String(original.sacrifice.sacrifice_no);
  }
  if (typeof value === "object" && value !== null && "sacrifice_no" in value) {
    return String((value as { sacrifice_no?: number }).sacrifice_no ?? "");
  }
  return String(value);
}
