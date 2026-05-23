"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { ChevronsUpDown, Loader2, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ShareholderPickValue {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string | null;
  sacrifice_id: string;
  sacrifice_no: number | null;
}

const PAGE_SIZE = 50;

function pickKey(p: ShareholderPickValue): string {
  return `${p.shareholder_id}:${p.sacrifice_id}`;
}

function mergeResults(
  prev: ShareholderPickValue[],
  incoming: ShareholderPickValue[]
): ShareholderPickValue[] {
  const merged = new Map<string, ShareholderPickValue>();
  for (const r of [...prev, ...incoming]) {
    merged.set(pickKey(r), r);
  }
  return Array.from(merged.values());
}

function sortBySacrificeThenName(items: ShareholderPickValue[]): ShareholderPickValue[] {
  return [...items].sort((a, b) => {
    const na =
      a.sacrifice_no != null && Number.isFinite(a.sacrifice_no)
        ? a.sacrifice_no
        : Number.POSITIVE_INFINITY;
    const nb =
      b.sacrifice_no != null && Number.isFinite(b.sacrifice_no)
        ? b.sacrifice_no
        : Number.POSITIVE_INFINITY;
    if (na !== nb) return na - nb;
    return (a.shareholder_name ?? "").localeCompare(b.shareholder_name ?? "", "tr", {
      sensitivity: "base",
    });
  });
}

interface Props {
  year: number;
  value: ShareholderPickValue[];
  onChange: (v: ShareholderPickValue[]) => void;
  disabled?: boolean;
}

export function SmsShareholderPicker({ year, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<ShareholderPickValue[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef("");
  const fetchingMoreRef = useRef(false);

  const selectedSet = useMemo(
    () => new Set(value.map((p) => pickKey(p))),
    [value]
  );

  const sortedResults = useMemo(() => sortBySacrificeThenName(results), [results]);

  const fetchPage = useCallback(
    async (search: string, offset: number, append: boolean) => {
      if (append) {
        if (fetchingMoreRef.current) return;
        fetchingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        fetchingMoreRef.current = false;
        setLoading(true);
      }
      try {
        const params = new URLSearchParams({
          year: String(year),
          q: search,
          offset: String(offset),
          limit: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/admin/sms/shareholder-search?${params}`);
        const data = await res.json();
        if (res.ok) {
          const incoming = (data.results ?? []) as ShareholderPickValue[];
          setResults((prev) =>
            sortBySacrificeThenName(append ? mergeResults(prev, incoming) : incoming)
          );
          setHasMore(!!data.hasMore);
          setNextOffset(
            typeof data.nextOffset === "number" ? data.nextOffset : offset + incoming.length
          );
        } else if (!append) {
          setResults([]);
          setHasMore(false);
          setNextOffset(0);
        }
      } catch {
        if (!append) {
          setResults([]);
          setHasMore(false);
          setNextOffset(0);
        }
      } finally {
        if (append) {
          fetchingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [year]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      searchRef.current = q;
      void fetchPage(q, 0, false);
    }, 300);
    return () => window.clearTimeout(t);
  }, [q, fetchPage]);

  useEffect(() => {
    if (!open || !hasMore || loading || loadingMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting || loading || loadingMore || !hasMore) return;
        void fetchPage(searchRef.current, nextOffset, true);
      },
      { root: null, rootMargin: "120px 0px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [open, hasMore, loading, loadingMore, nextOffset, fetchPage]);

  const toggle = (r: ShareholderPickValue) => {
    const k = pickKey(r);
    if (selectedSet.has(k)) {
      onChange(value.filter((p) => pickKey(p) !== k));
    } else {
      onChange([...value, r]);
    }
  };

  const triggerLabel =
    value.length === 0
      ? "Hissedar ara, çoklu seç…"
      : `${value.length} hissedar seçili`;

  return (
    <div className="space-y-2">
      <Label>Hissedarlardan seç</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
            disabled={disabled}
            aria-expanded={open}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">{triggerLabel}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,420px)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="İsim veya telefon ile ara…"
              value={q}
              onValueChange={setQ}
            />
            <CommandList className="max-h-[280px]">
              <CommandEmpty>
                {loading ? "Aranıyor…" : "Sonuç yok. Farklı kelime deneyin."}
              </CommandEmpty>
              <CommandGroup>
                {sortedResults.map((r) => {
                  const k = pickKey(r);
                  const checked = selectedSet.has(k);
                  return (
                    <CommandItem
                      key={k}
                      value={k}
                      onSelect={() => toggle(r)}
                      className="cursor-pointer"
                    >
                      <div className="flex w-full items-start gap-3 pr-1">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(r)}
                          className="mt-0.5"
                          aria-label="Seç"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                          <span className="font-medium leading-tight">
                            {r.shareholder_name || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {r.phone_number
                              ? formatPhoneForDisplayWithSpacing(r.phone_number)
                              : "Telefon yok"}{" "}
                            · Kurbanlık {r.sacrifice_no ?? "—"}
                          </span>
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
                {hasMore ? (
                  <div
                    ref={loadMoreRef}
                    className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Daha fazla yükleniyor…
                      </>
                    ) : (
                      "Kaydırarak daha fazla yükle…"
                    )}
                  </div>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-muted-foreground"
          onClick={() => onChange([])}
        >
          Seçimleri temizle
        </Button>
      )}
    </div>
  );
}
