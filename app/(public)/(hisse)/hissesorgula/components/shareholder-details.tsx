"use client";

import type { ReactNode } from "react";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import {
  getDeliverySelectionFromLocation,
  getDeliveryTypeDisplayLabel,
  showPlannedTeslimSaatiOnPublicPages,
} from "@/lib/delivery-options";
import { cn } from "@/lib/utils";
import { shareholderSchema } from "@/types";
import { formatPhoneForDisplayWithSpacing } from "@/utils/formatters";
import { addDays } from "date-fns";
import { ProgressBar } from "./ProgressBar";
import { ShareholderLookupEmailActions } from "./shareholder-lookup-email-actions";

interface ShareholderDetailsProps {
  shareholderInfo: shareholderSchema & {
    sacrifice?: {
      sacrifice_id: string;
      sacrifice_no: string;
      sacrifice_time?: string;
      planned_delivery_time?: string | null;
      share_price?: number;
      share_weight?: string | number;
    };
  };
  lookupContext?: { phoneDigits: string; securityCode: string };
  inAccordion?: boolean;
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground leading-snug break-words md:text-base">
        {children}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
      {children}
    </h3>
  );
}

export function ShareholderDetails({
  shareholderInfo,
  lookupContext,
  inAccordion = false,
}: ShareholderDetailsProps) {
  const branding = useTenantBranding();

  const lastDepositDate = addDays(
    new Date(shareholderInfo.purchase_time),
    branding.deposit_deadline_days
  );

  const formatSacrificeTime = (timeString: string | null | undefined) => {
    if (!timeString) return "-";
    try {
      if (timeString.split(":").length > 2) {
        const parts = timeString.split(":");
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const deliveryFee = Number(shareholderInfo.delivery_fee ?? 0);
  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n) + " TL";

  const depositOk = shareholderInfo.paid_amount >= branding.deposit_amount;
  const hasEmail = Boolean(shareholderInfo.email?.trim());

  const content = (
    <div className="divide-y divide-border">
      {!inAccordion && (
        <div className="border-b border-border bg-muted/40 px-4 py-4 md:px-6 md:py-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl break-words">
            {shareholderInfo.shareholder_name}
          </h2>
        </div>
      )}

      {/* İletişim ve Teslimat + E-posta aksiyonları yan yana */}
      <section className="px-4 py-5 md:px-6 md:py-6">
        <SectionHeading>İletişim ve Teslimat</SectionHeading>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Sol: iletişim & teslimat alanları */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefon">
              {formatPhoneForDisplayWithSpacing(shareholderInfo.phone_number ?? "")}
            </Field>
            {shareholderInfo.second_phone_number?.trim() ? (
              <Field label="İkinci Telefon">
                {formatPhoneForDisplayWithSpacing(shareholderInfo.second_phone_number)}
              </Field>
            ) : null}
            {hasEmail ? (
              <Field label="E-posta" className="col-span-2">
                {shareholderInfo.email!.trim()}
              </Field>
            ) : null}
            <Field label="Teslimat Tercihi">
              {getDeliveryTypeDisplayLabel(
                branding.logo_slug,
                getDeliverySelectionFromLocation(
                  branding.logo_slug,
                  shareholderInfo.delivery_location ?? ""
                ),
                null,
                false
              )}
            </Field>
            <Field label="Teslimat Yeri">
              {shareholderInfo.delivery_location &&
              shareholderInfo.delivery_location !== "-"
                ? shareholderInfo.delivery_location
                : "-"}
            </Field>
          </div>

          {/* Sağ: e-posta aksiyonları (lookupContext varsa) */}
          {lookupContext ? (
            <div className="flex flex-col justify-start">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                Özet Gönder
              </p>
              <ShareholderLookupEmailActions
                shareholderId={shareholderInfo.shareholder_id}
                phoneDigits={lookupContext.phoneDigits}
                securityCode={lookupContext.securityCode}
                registeredEmail={shareholderInfo.email}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Kurbanlık Bilgileri */}
      <section className="px-4 py-5 md:px-6 md:py-6">
        <SectionHeading>Kurbanlık Bilgileri</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kurbanlık No">
            {shareholderInfo.sacrifice?.sacrifice_no ?? "-"}
          </Field>
          <Field label="Hisse Bedeli">
            {fmt(Number(shareholderInfo.sacrifice?.share_price ?? 0))}
          </Field>
          <Field label="Kesim Saati">
            {formatSacrificeTime(shareholderInfo.sacrifice?.sacrifice_time)}
          </Field>
          {showPlannedTeslimSaatiOnPublicPages(branding.logo_slug) && (
            <Field label="Teslim Saati">
              {formatSacrificeTime(shareholderInfo.sacrifice?.planned_delivery_time)}
            </Field>
          )}
          <Field label="Kilogram">
            {shareholderInfo.sacrifice?.share_weight
              ? `${shareholderInfo.sacrifice.share_weight} ±3 kg`
              : "-"}
          </Field>
        </div>
      </section>

      {/* Ödeme Detayları */}
      <section className="px-4 py-5 md:px-6 md:py-6">
        <SectionHeading>Ödeme Detayları</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Son Kapora Ödeme Tarihi">
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{lastDepositDate.toLocaleDateString("tr-TR")}</span>
              {depositOk ? (
                <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Kapora ödendi
                </span>
              ) : null}
            </span>
          </Field>
          <Field label="Teslimat Ücreti">{fmt(deliveryFee)}</Field>
          <Field label="Toplam Ücret">
            {fmt(Number(shareholderInfo.total_amount))}
          </Field>
        </div>

        <div className="mt-6 space-y-3 border-t border-border pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium md:text-base">
              Ödenen: {fmt(shareholderInfo.paid_amount)}
            </p>
            <p
              className={cn("text-sm font-semibold md:text-base", {
                "text-sac-red": shareholderInfo.paid_amount < branding.deposit_amount,
                "text-sac-yellow":
                  shareholderInfo.paid_amount >= branding.deposit_amount &&
                  shareholderInfo.remaining_payment > 0,
                "text-foreground":
                  shareholderInfo.remaining_payment <= 0 &&
                  shareholderInfo.paid_amount >= branding.deposit_amount,
              })}
            >
              {shareholderInfo.paid_amount < branding.deposit_amount
                ? "Kapora bekleniyor"
                : shareholderInfo.remaining_payment > 0
                  ? "Tam ödeme bekleniyor"
                  : "Ödeme tamamlandı"}
            </p>
          </div>
          <ProgressBar
            paidAmount={shareholderInfo.paid_amount}
            totalAmount={shareholderInfo.total_amount}
            depositAmount={branding.deposit_amount}
          />
        </div>
      </section>
    </div>
  );

  if (inAccordion) {
    return content;
  }

  return (
    <div className="mx-auto mb-4 max-w-3xl overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      {content}
    </div>
  );
}
