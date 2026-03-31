/** correlation ile gruplanabilir audit satırı (ChangeLog ile uyumlu alanlar) */
export type ChangeLogGroupable = {
  event_id: number;
  correlation_id: string | null;
  log_layer: string | null;
  changed_at: string;
  table_name?: string;
  column_name?: string | null;
};

export type ChangeLogViewRow<T extends ChangeLogGroupable = ChangeLogGroupable> =
  T & {
    groupDetailRows?: T[];
  };

function hasCorrelation(log: ChangeLogGroupable): boolean {
  const c = log.correlation_id;
  return c != null && String(c).trim() !== "";
}

/** Grup içinde hangi satır tabloda “ana” gösterilecek (fiyat değişimi öncelikli) */
function pickParentRow<T extends ChangeLogGroupable>(sorted: T[]): T {
  const primaries = sorted.filter((l) => l.log_layer === "primary");
  if (primaries.length === 0) return sorted[0]!;

  const sac = primaries.filter((r) => r.table_name === "sacrifice_animals");
  if (sac.length > 0) {
    const priceFirst =
      sac.find((r) => r.column_name === "share_price") ??
      sac.find((r) => r.column_name === "live_scale_total_price") ??
      sac.find((r) => r.column_name === "pricing_mode") ??
      sac[sac.length - 1];
    return priceFirst;
  }

  return primaries[0]!;
}

/**
 * correlation_id ile gruplar; ana satır önce sacrifice_animals primary (fiyat kolonları öncelikli).
 * correlation_id NULL olanlar asla gruplanmaz (her biri tek satır).
 */
export function buildChangeLogTableRows<T extends ChangeLogGroupable>(
  logs: T[]
): ChangeLogViewRow<T>[] {
  const withCorr = logs.filter(hasCorrelation);
  const solo = logs.filter((l) => !hasCorrelation(l));

  const byCorr = new Map<string, T[]>();
  for (const log of withCorr) {
    const k = String(log.correlation_id);
    if (!byCorr.has(k)) byCorr.set(k, []);
    byCorr.get(k)!.push(log);
  }

  const grouped: ChangeLogViewRow<T>[] = [];
  for (const [, groupLogs] of Array.from(byCorr.entries())) {
    const sorted = [...groupLogs].sort(
      (a, b) =>
        new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );
    const parent = pickParentRow(sorted);
    const details = sorted.filter((l) => l.event_id !== parent.event_id);
    grouped.push({
      ...parent,
      groupDetailRows: details.length > 0 ? details : undefined,
    });
  }

  const soloRows: ChangeLogViewRow<T>[] = solo.map((l) => ({ ...l }));

  const merged = [...grouped, ...soloRows];
  merged.sort(
    (a, b) =>
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );
  return merged;
}
