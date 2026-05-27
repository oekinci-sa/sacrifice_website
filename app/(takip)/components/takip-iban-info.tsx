"use client";

import { useTenantBranding } from "@/hooks/useTenantBranding";
import { getIbanAccountHolderDisplay } from "@/lib/receipt-reminders";
import { GOLBASI_TENANT_ID } from "@/lib/tenant-resolver";
import { formatIbanForDisplay } from "@/utils/formatters";
import { motion, type Variants } from "framer-motion";

type TakipIbanInfoProps = {
  variants?: Variants;
};

export function TakipIbanInfo({ variants }: TakipIbanInfoProps) {
  const branding = useTenantBranding();

  if (branding.tenant_id === GOLBASI_TENANT_ID) return null;

  const ibanDisplay = formatIbanForDisplay(branding.iban);
  const holder = getIbanAccountHolderDisplay(branding);

  if (!ibanDisplay.trim()) return null;

  return (
    <motion.div
      className="font-sans w-full max-w-2xl rounded-xl border border-primary/20 bg-white/90 px-6 py-3.5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm"
      variants={variants}
    >
      <div className="flex flex-col gap-1 text-[15px] leading-snug md:text-lg md:leading-normal">
        {holder && (
          <p>
            <span className="text-muted-foreground">IBAN Sahibi: </span>
            <span className="font-semibold text-foreground">{holder}</span>
          </p>
        )}
        <p>
          <span className="text-muted-foreground">IBAN: </span>
          <span className="font-semibold text-foreground tracking-[0.04em]">{ibanDisplay}</span>
        </p>
      </div>
    </motion.div>
  );
}
