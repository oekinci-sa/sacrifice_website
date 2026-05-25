"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { X } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

export interface RecipientTableRow {
  shareholder_id?: string;
  sacrifice_id?: string;
  sacrifice_no?: number | null;
  recipient_name?: string;
  phone_number: string;
  has_valid_phone: boolean;
  include_in_send: boolean;
}

export function recipientRowKey(r: RecipientTableRow): string {
  return `${r.shareholder_id ?? "—"}:${r.sacrifice_id ?? "—"}`;
}

function sortBySacrificeOrder(a: RecipientTableRow, b: RecipientTableRow): number {
  const na =
    a.sacrifice_no != null && Number.isFinite(a.sacrifice_no)
      ? a.sacrifice_no
      : Number.POSITIVE_INFINITY;
  const nb =
    b.sacrifice_no != null && Number.isFinite(b.sacrifice_no)
      ? b.sacrifice_no
      : Number.POSITIVE_INFINITY;
  if (na !== nb) return na - nb;
  const nameCmp = (a.recipient_name ?? "").localeCompare(b.recipient_name ?? "", "tr", {
    sensitivity: "base",
  });
  if (nameCmp !== 0) return nameCmp;
  return (a.phone_number ?? "").localeCompare(b.phone_number ?? "", "tr");
}

function normalizeSearch(s: string): string {
  return s.trim().toLocaleLowerCase("tr");
}

function matchesSearch(row: RecipientTableRow, q: string): boolean {
  if (!q) return true;
  const name = (row.recipient_name ?? "").toLocaleLowerCase("tr");
  const raw = row.phone_number ?? "";
  const digits = raw.replace(/\D/g, "");
  const qd = q.replace(/\D/g, "");
  const display = formatPhoneForDisplayWithSpacing(raw);
  if (display !== "-" && display.toLocaleLowerCase("tr").includes(q)) {
    return true;
  }
  return name.includes(q) || (qd.length > 0 && digits.includes(qd));
}

/** İsim hücresi sağında telefondan önce ~12px boşluk (pr-3) */
const CELL_SAC = "py-2 px-2";
const CELL_NAME = "min-w-0 py-2 pl-2 pr-3";
const CELL_PHONE = "py-2 pr-2 pl-0";

const SUMMARY_CHIP_GAP_PX = 6;
const SUMMARY_EXPAND_BTN_RESERVE_PX = 108;
/** Rozet satırında her öğe için X butonu ayrılan yatay alan (görünür ölçümde rozet tek başına ölçülüyor) */
const SUMMARY_CHIP_ACTION_RESERVE_PX = 28;

interface Props {
  recipients: RecipientTableRow[];
  onToggleInclude: (key: string, include: boolean) => void;
  onCommitListSave: () => void;
  onRemoveSacrificeGroup?: (sacrificeNo: number) => void;
}

export function SmsRecipientTable({
  recipients,
  onToggleInclude,
  onCommitListSave,
  onRemoveSacrificeGroup,
}: Props) {
  const [search, setSearch] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const summaryRowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [summaryRowWidth, setSummaryRowWidth] = useState(0);
  /** null: genişlik henüz ölçülmedi — taşma düğmesini yanlışlıkla gösterme */
  const [collapsedVisibleCount, setCollapsedVisibleCount] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...recipients].sort(sortBySacrificeOrder),
    [recipients]
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    return sorted.filter((r) => matchesSearch(r, q));
  }, [sorted, search]);

  const bySacrifice = new Map<number, number>();
  for (const r of recipients) {
    const n = r.sacrifice_no;
    if (n != null && Number.isFinite(n)) {
      bySacrifice.set(n, (bySacrifice.get(n) ?? 0) + 1);
    }
  }
  const sacrificeNos = Array.from(bySacrifice.keys()).sort((a, b) => a - b);
  const sacrificeNosKey = sacrificeNos.join(",");
  const excludedStaged = recipients.filter((r) => !r.include_in_send).length;

  useLayoutEffect(() => {
    const el = summaryRowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSummaryRowWidth(el.getBoundingClientRect().width);
    });
    ro.observe(el);
    setSummaryRowWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (summaryExpanded || sacrificeNos.length === 0) {
      setCollapsedVisibleCount(sacrificeNos.length);
      return;
    }
    const W = summaryRowWidth;
    if (W <= 0) {
      setCollapsedVisibleCount(sacrificeNos.length);
      return;
    }

    const measureRoot = measureRef.current;
    const chipEls = measureRoot?.querySelectorAll(
      "[data-sac-chip]"
    ) as NodeListOf<HTMLElement> | undefined;
    if (!chipEls?.length) {
      setCollapsedVisibleCount(sacrificeNos.length);
      return;
    }

    const actionReserve = onRemoveSacrificeGroup ? SUMMARY_CHIP_ACTION_RESERVE_PX : 0;

    let used = 0;
    let n = 0;
    for (let i = 0; i < chipEls.length; i++) {
      const cw = chipEls[i].offsetWidth;
      const step =
        cw + actionReserve + (n > 0 ? SUMMARY_CHIP_GAP_PX : 0);
      if (used + step + SUMMARY_EXPAND_BTN_RESERVE_PX <= W) {
        used += step;
        n++;
      } else {
        break;
      }
    }

    setCollapsedVisibleCount(Math.min(n, sacrificeNos.length));
  }, [
    summaryExpanded,
    sacrificeNosKey,
    sacrificeNos.length,
    summaryRowWidth,
    recipients.length,
    onRemoveSacrificeGroup,
  ]);

  const effectiveCollapsedCount =
    collapsedVisibleCount ?? sacrificeNos.length;
  const needsSummaryExpand =
    !summaryExpanded &&
    sacrificeNos.length > 0 &&
    effectiveCollapsedCount < sacrificeNos.length;
  const visibleSacrificeNos =
    summaryExpanded || !needsSummaryExpand
      ? sacrificeNos
      : sacrificeNos.slice(0, effectiveCollapsedCount);

  return (
    <div className="space-y-3">
      <div ref={summaryRowRef} className="relative min-w-0">
        <div
          ref={measureRef}
          className="pointer-events-none absolute left-0 top-0 -z-10 flex gap-1.5 opacity-0"
          aria-hidden
        >
          {sacrificeNos.map((n) => (
            <div
              key={n}
              data-sac-chip
              className="shrink-0 whitespace-nowrap rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-xs"
            >
              Kurbanlık {n} ({bySacrifice.get(n)})
            </div>
          ))}
        </div>

        <div className="min-h-7">
          {sacrificeNos.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <div
              className={
                summaryExpanded
                  ? "flex flex-wrap items-center gap-x-1.5 gap-y-2"
                  : "flex flex-nowrap items-center gap-x-1.5 gap-y-2 overflow-hidden"
              }
            >
              {visibleSacrificeNos.map((n) => {
                const count = bySacrifice.get(n) ?? 0;
                return (
                  <div
                    key={n}
                    className="group/sac inline-flex shrink-0 items-center gap-0.5"
                  >
                    <div className="whitespace-nowrap rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-xs">
                      Kurbanlık {n} ({count})
                    </div>
                    {onRemoveSacrificeGroup ? (
                      <button
                        type="button"
                        className="-ml-0.5 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/sac:opacity-100"
                        aria-label={`Kurbanlık ${n} ile ilgili tüm satırları listeden çıkar`}
                        onClick={() => onRemoveSacrificeGroup(n)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {needsSummaryExpand ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => setSummaryExpanded(true)}
                >
                  Tümünü gör ({sacrificeNos.length})
                </Button>
              ) : null}
              {summaryExpanded && sacrificeNos.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => setSummaryExpanded(false)}
                >
                  Daralt
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {excludedStaged > 0 && (
        <div className="text-xs text-amber-700 dark:text-amber-400">
          İşareti kaldırılan: {excludedStaged} (kaydedince listeden düşer)
        </div>
      )}

      <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm font-medium shrink-0">Alıcı listesi</p>
        <div className="flex w-full flex-1 flex-col gap-2 sm:min-w-0 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Input
            type="search"
            className="w-full sm:max-w-xs"
            placeholder="İsim veya telefon ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Alıcı listesinde ara"
          />
          <div className="flex shrink-0 items-center gap-3">
            {search.trim() ? (
              <span className="text-xs text-muted-foreground whitespace-nowrap sm:text-sm">
                Görünen: <strong>{filtered.length}</strong>
              </span>
            ) : null}
            <Button
              type="button"
              variant={excludedStaged > 0 ? "destructive" : "secondary"}
              size="sm"
              disabled={excludedStaged === 0}
              onClick={onCommitListSave}
            >
              Listeyi kaydet
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[min(55vh,420px)] overflow-auto rounded-md border">
        <Table className="w-full min-w-0 table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-[4.5rem] text-center">Kur. Sır.</TableHead>
              <TableHead className="min-w-0">İsim Soyisim</TableHead>
              <TableHead className="w-[12rem] text-center whitespace-nowrap">
                Telefon
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const key = recipientRowKey(r);
              return (
                <TableRow key={key} className={!r.include_in_send ? "opacity-50" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={r.include_in_send}
                      onCheckedChange={(v) => onToggleInclude(key, v === true)}
                      aria-label="Bu alıcıya gönder"
                    />
                  </TableCell>
                  <TableCell className={`text-center ${CELL_SAC}`}>
                    <span className="line-clamp-2 block">{r.sacrifice_no ?? "—"}</span>
                  </TableCell>
                  <TableCell className={CELL_NAME} title={r.recipient_name}>
                    <span className="line-clamp-2">{r.recipient_name || "—"}</span>
                  </TableCell>
                  <TableCell className={`text-center ${CELL_PHONE}`}>
                    <span className="line-clamp-2 block">
                      {r.phone_number
                        ? formatPhoneForDisplayWithSpacing(r.phone_number)
                        : "—"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {filtered.length === 0 && recipients.length > 0 && (
        <p className="text-center py-2 text-sm text-muted-foreground">
          Arama kriterine uygun satır yok.
        </p>
      )}
    </div>
  );
}
