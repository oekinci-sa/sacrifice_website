"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import { shareholderSchema } from "@/types";

interface PaymentAnalyticsProps {
  shareholders: shareholderSchema[];
}

export function PaymentAnalytics({ shareholders }: PaymentAnalyticsProps) {
  const branding = useTenantBranding();
  const depositAmount = branding.deposit_amount;

  // Toplam hedeflenen tutar
  const totalTargetAmount = shareholders.reduce((sum, shareholder) => sum + shareholder.total_amount, 0);

  // Toplanan tutar
  const totalCollectedAmount = shareholders.reduce((sum, shareholder) => sum + shareholder.paid_amount, 0);

  // Eksik kapora sayısı (paid_amount < deposit_amount)
  const missingDepositCount = shareholders.filter(s => s.paid_amount < depositAmount).length;

  // Eksik ödeme sayısı (paid_amount >= deposit_amount && paid_amount < total_amount)
  const missingPaymentCount = shareholders.filter(s =>
    s.paid_amount >= depositAmount && s.paid_amount < s.total_amount
  ).length;

  // Toplam hissedar sayısı
  const totalShareholderCount = shareholders.length;

  // Yüzdelik hesaplamaları
  const collectedPercentage = Math.round((totalCollectedAmount / totalTargetAmount) * 100);
  const missingDepositPercentage = Math.round((missingDepositCount / totalShareholderCount) * 100);
  const missingPaymentPercentage = Math.round((missingPaymentCount / totalShareholderCount) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Toplanan Tutar */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Toplanan Tutar</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold">
            {new Intl.NumberFormat("tr-TR").format(totalCollectedAmount)} TL
          </p>
          <span className="text-sm text-muted-foreground">
            / {new Intl.NumberFormat("tr-TR").format(totalTargetAmount)} TL
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
            <div
              className="h-full bg-sac-red rounded-full"
              style={{ width: `${collectedPercentage}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground min-w-[40px]">%{collectedPercentage}</span>
        </div>
      </div>

      {/* Eksik Kapora */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Eksik Kapora</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold">{missingDepositCount}</p>
          <span className="text-sm text-muted-foreground">
            / {totalShareholderCount}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
            <div
              className="h-full bg-sac-red rounded-full"
              style={{ width: `${missingDepositPercentage}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground min-w-[40px]">%{missingDepositPercentage}</span>
        </div>
      </div>

      {/* Eksik Ödemeler */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Eksik Ödemeler</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold">{missingPaymentCount}</p>
          <span className="text-sm text-muted-foreground">
            / {totalShareholderCount}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
            <div
              className="h-full bg-sac-yellow rounded-full"
              style={{ width: `${missingPaymentPercentage}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground min-w-[40px]">%{missingPaymentPercentage}</span>
        </div>
      </div>
    </div>
  );
} 