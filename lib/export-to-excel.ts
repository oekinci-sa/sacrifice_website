import * as XLSX from "xlsx";
import { Table } from "@tanstack/react-table";

/**
 * Tablodaki görünen sütunlara ve filtrelenmiş satırlara göre Excel dosyası oluşturur.
 * @param headerMap Opsiyonel: column id -> Excel başlık eşlemesi
 */
export function exportTableToExcel<TData>(
  table: Table<TData>,
  filename = "export.xlsx",
  headerMap?: Record<string, string>
) {
  const visibleColumns = table.getVisibleLeafColumns().filter((col) => col.id !== "actions");
  const rows = table.getFilteredRowModel().rows;

  const headers = visibleColumns.map((col) => {
    if (headerMap?.[col.id]) return headerMap[col.id];
    const header = col.columnDef.header;
    if (typeof header === "string") return header;
    return col.id;
  });

  const data = rows.map((row) =>
    visibleColumns.map((col) => {
      const value = row.getValue(col.id);
      if (value == null || value === "") return "";
      if (typeof value === "object" && value !== null) {
        if ("sacrifice_no" in value) return (value as { sacrifice_no?: number }).sacrifice_no ?? "";
      }
      return String(value);
    })
  );

  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Veri");

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeFilename = `${filename.replace(".xlsx", "")}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}
