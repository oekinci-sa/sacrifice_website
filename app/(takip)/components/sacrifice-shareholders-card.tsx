"use client";

import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { MapPin, Phone, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface ShareholderRow {
  shareholder_id: string;
  shareholder_name: string;
  phone_number: string | null;
  delivery_type: string | null;
  delivery_location: string | null;
  paid_amount: number;
  total_amount: number;
  remaining_payment: number;
}

function isKesimhane(deliveryType: string | null): boolean {
  const d = (deliveryType ?? "").toLocaleLowerCase("tr");
  return d === "kesimhane" || d === "" || d === "slaughterhouse";
}

function DeliveryBadge({ type, location }: { type: string | null; location: string | null }) {
  const atKesimhane = isKesimhane(type);
  const label = atKesimhane ? "Kesimhane" : (location || type || "Dış Teslimat");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        atKesimhane
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      <MapPin className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

function PaymentBadge({ paid, total }: { paid: number; total: number }) {
  const fmt = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

  if (total <= 0) {
    if (paid > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          Tutarlar henüz girilmemiş · Ödenen: {fmt.format(paid)} TL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Tutarlar henüz girilmemiş
      </span>
    );
  }

  const remaining = total - paid;
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Ödeme tamam
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
      Kalan: {fmt.format(remaining)} TL
    </span>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-400">
        {index}
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

interface Props {
  sacrificeNo: number;
  showPayment?: boolean;
}

export function SacrificeShareholdersCard({ sacrificeNo, showPayment = true }: Props) {
  const [shareholders, setShareholders] = useState<ShareholderRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sacrificeNo < 1) return;

    let cancelled = false;
    setLoading(true);
    setShareholders([]);

    fetch(`/api/get-shareholders-by-sacrifice-no?sacrifice_no=${sacrificeNo}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setShareholders(Array.isArray(d.shareholders) ? d.shareholders : []);
        }
      })
      .catch(() => {
        if (!cancelled) setShareholders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sacrificeNo]);

  return (
    <div
      className="w-full max-w-[min(100%,480px)] mx-auto light text-gray-900 [color-scheme:light]"
      data-theme="light"
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              Kurbanlık {sacrificeNo} — Hissedarlar
            </span>
          </div>
          {!loading && shareholders.length > 0 && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
              {shareholders.length} kişi
            </span>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100 bg-white">
            {[1, 2, 3].map((i) => (
              <SkeletonRow key={i} index={i} />
            ))}
          </div>
        ) : shareholders.length === 0 ? (
          <div className="bg-white px-4 py-6 text-center text-sm text-gray-500">
            Bu kurbanlıkta hissedar kaydı yok.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {shareholders.map((sh, idx) => (
              <div
                key={sh.shareholder_id}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-sm">
                  {idx + 1}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate font-semibold text-gray-900 leading-tight">
                    {sh.shareholder_name || "—"}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {sh.phone_number ? (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="h-3 w-3 shrink-0" />
                        {formatPhoneForDisplayWithSpacing(sh.phone_number)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Telefon yok</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <DeliveryBadge type={sh.delivery_type} location={sh.delivery_location} />
                    {showPayment && (
                      <PaymentBadge paid={sh.paid_amount} total={sh.total_amount} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
