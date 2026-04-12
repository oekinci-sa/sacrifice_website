import type { Table } from "@tanstack/react-table";

/**
 * Ekrandaki başlık sırası ile aynı: getHeaderGroups öncelikli (TanStack görünür sütun sırası).
 */
export function getVisibleLeafColumnIdsForExport<TData>(table: Table<TData>): string[] {
  const first = table.getHeaderGroups()[0];
  if (first?.headers?.length) {
    return first.headers.map((h) => h.column.id);
  }

  const visibleLeaf = table.getVisibleLeafColumns();
  const ids = new Set(visibleLeaf.map((c) => c.id));
  const order = table.getState().columnOrder;

  if (!order || order.length === 0) {
    return visibleLeaf.map((c) => c.id);
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of order) {
    if (ids.has(id) && !seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const c of visibleLeaf) {
    if (!seen.has(c.id)) {
      out.push(c.id);
      seen.add(c.id);
    }
  }
  return out;
}
