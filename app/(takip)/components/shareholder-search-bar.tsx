"use client";

import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { MapPin, Phone, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageKey } from "@/lib/queue-access-hash";

interface SearchResult {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string | null;
  delivery_type: string | null;
  delivery_location: string | null;
  paid_amount: number;
  total_amount: number;
  remaining_payment: number;
  sacrifice_no: number | null;
}

function isKesimhane(t: string | null): boolean {
  const d = (t ?? "").toLocaleLowerCase("tr");
  return d === "kesimhane" || d === "" || d === "slaughterhouse";
}

function DeliveryBadge({ type, location }: { type: string | null; location: string | null }) {
  const atKesimhane = isKesimhane(type);
  const label = atKesimhane ? "Kesimhane" : location || type || "Dış Teslimat";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        atKesimhane ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      <MapPin className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

function PaymentBadge({ paid, total }: { paid: number; total: number }) {
  const remaining = total - paid;
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Ödeme tamam
      </span>
    );
  }
  const fmt = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
      Kalan: {fmt.format(remaining)} TL
    </span>
  );
}

interface Props {
  pageKey: PageKey;
  onSelectSacrificeNo: (no: number) => void;
}

export function ShareholderSearchBar({ pageKey, onSelectSacrificeNo }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/queue-access/shareholder-search?pageKey=${pageKey}&q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { shareholders?: SearchResult[] };
          setResults(data.shareholders ?? []);
          setOpen(true);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [pageKey]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    if (result.sacrifice_no) {
      onSelectSacrificeNo(result.sacrifice_no);
    }
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[min(100%,480px)] mx-auto [color-scheme:light]"
    >
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Ad, soyad veya telefon ile ara…"
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-8 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400"
        />
        {loading && (
          <div className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {results.map((r) => (
              <button
                key={r.shareholder_id}
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                {/* Kurbanlık no badge */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-sm">
                  {r.sacrifice_no ?? "?"}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {r.shareholder_name || "—"}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {r.phone_number ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3 shrink-0" />
                        {formatPhoneForDisplayWithSpacing(r.phone_number)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Telefon yok</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <DeliveryBadge type={r.delivery_type} location={r.delivery_location} />
                    <PaymentBadge paid={r.paid_amount} total={r.total_amount} />
                  </div>
                </div>

                <span className="shrink-0 text-xs text-gray-400">
                  #{r.sacrifice_no ?? "?"}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-400">
            {results.length} sonuç — Hissedarın sırasına gitmek için tıklayın
          </div>
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-40 mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-center text-sm text-gray-500 shadow-lg">
          Sonuç bulunamadı.
        </div>
      )}
    </div>
  );
}
