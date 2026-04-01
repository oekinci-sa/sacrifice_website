"use client";

import ReceiptPDF from "@/app/(public)/(hisse)/hisseal/components/success-state/ReceiptPDF";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { buildPurchaseReceiptData } from "@/lib/purchase-receipt-data";
import { buildMergedAdminImportantNotesBlock } from "@/lib/receipt-pdf-admin-notes";
import { shareholderSchema } from "@/types";
import { BlobProvider } from "@react-pdf/renderer";
import { FileDown } from "lucide-react";
import { useMemo, useState } from "react";

function parseOptionalDepositTl(input: string): number | undefined {
  const digits = input.replace(/\D/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

function downloadPdfBlob(blob: Blob, shareholderName: string | undefined) {
  const safeName = shareholderName
    ? shareholderName.replace(/\s+/g, "-")
    : "hissedar";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kurban-hisse-bilgilendirme-${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type Props = {
  shareholder: shareholderSchema | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminHissedarPdfDialog({ shareholder, open, onOpenChange }: Props) {
  const branding = useTenantBranding();
  const { toast } = useToast();
  const [depositInput, setDepositInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const receiptData = useMemo(() => {
    if (!shareholder?.sacrifice) return null;
    const sac = shareholder.sacrifice;
    const sh = shareholder as shareholderSchema & { proxy_status?: string | null };
    const sacrificeForReceipt = {
      sacrifice_no: sac.sacrifice_no,
      sacrifice_time: sac.sacrifice_time ?? null,
      share_price: sac.share_price ?? null,
      share_weight:
        sac.share_weight != null ? String(sac.share_weight) : undefined,
      pricing_mode: sac.pricing_mode ?? null,
      live_scale_total_kg: sac.live_scale_total_kg ?? null,
      live_scale_total_price: sac.live_scale_total_price ?? null,
    };
    return buildPurchaseReceiptData(
      sh,
      sacrificeForReceipt,
      { created_at: shareholder.purchase_time },
      shareholder.transaction_id ?? "",
      branding
    );
  }, [shareholder, branding]);

  const depositOverride = useMemo(
    () => parseOptionalDepositTl(depositInput),
    [depositInput]
  );

  const defaultDepositLabel = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(branding.deposit_amount);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDepositInput("");
    }
    onOpenChange(next);
  };

  const titleLine = shareholder
    ? `${shareholder.shareholder_name}${
        shareholder.sacrifice?.sacrifice_no != null
          ? ` — Kurban ${shareholder.sacrifice.sacrifice_no}`
          : ""
      }`
    : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>PDF bilgilendirme indir</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {shareholder ? (
            <p className="text-sm font-medium leading-snug">{titleLine}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Hissedar seçilmedi.</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-pdf-deposit">
              PDF&apos;te gösterilecek kapora tutarı (₺)
            </Label>
            <Input
              id="admin-pdf-deposit"
              inputMode="numeric"
              placeholder={`Varsayılan: ${defaultDepositLabel} TL`}
              value={depositInput}
              onChange={(e) => setDepositInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Boş bırakırsanız bu tenant için tanımlı kapora (
              {defaultDepositLabel} TL) kullanılır. Özel tutar girmek için rakam yazın.
              Özel kapora ile PDF indirdiğinizde ilgili cümle hissedar notlarına da kaydedilir (mevcut
              not silinmez).
            </p>
          </div>

          {shareholder && !shareholder.sacrifice ? (
            <p className="text-sm text-destructive">
              Bu kayıtta kurbanlık bilgisi yok; PDF oluşturulamaz.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Kapat
          </Button>
          {receiptData && shareholder?.sacrifice ? (
            <BlobProvider
              key={`${shareholder.shareholder_id}-${depositInput}`}
              document={
                <ReceiptPDF
                  data={receiptData}
                  branding={branding}
                  depositAmountOverride={depositOverride}
                />
              }
            >
              {({ blob, loading, error }) => (
                <Button
                  type="button"
                  className="gap-2"
                  disabled={loading || !!error || savingNotes}
                  onClick={async () => {
                    if (depositInput.trim() && depositOverride === undefined) {
                      toast({
                        variant: "destructive",
                        title: "Geçersiz tutar",
                        description:
                          "Kapora için geçerli pozitif bir tutar girin veya alanı boş bırakın.",
                      });
                      return;
                    }
                    if (!blob) return;

                    /* Özel kapora girildiyse PDF’teki not metni DB’ye yazılır; boş kapora ile indirmede not silinmez. */
                    if (depositOverride !== undefined) {
                      const merged = buildMergedAdminImportantNotesBlock(
                        shareholder.notes,
                        depositOverride
                      );
                      const currentNotes = (shareholder.notes || "").trim();
                      if (merged != null && merged !== currentNotes) {
                        setSavingNotes(true);
                        try {
                          const res = await fetch("/api/update-shareholder", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              shareholder_id: shareholder.shareholder_id,
                              notes: merged,
                            }),
                          });
                          const payload = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            toast({
                              variant: "destructive",
                              title: "Notlar kaydedilemedi",
                              description:
                                typeof payload.error === "string"
                                  ? payload.error
                                  : "Hissedar güncellenemedi.",
                            });
                            return;
                          }
                          window.dispatchEvent(new Event("shareholders-updated"));
                        } finally {
                          setSavingNotes(false);
                        }
                      }
                    }

                    downloadPdfBlob(blob, shareholder.shareholder_name);
                    handleOpenChange(false);
                  }}
                >
                  <FileDown className="h-4 w-4" />
                  {loading
                    ? "Hazırlanıyor…"
                    : savingNotes
                      ? "Kaydediliyor…"
                      : error
                        ? "Hata"
                        : "PDF indir"}
                </Button>
              )}
            </BlobProvider>
          ) : (
            <Button type="button" disabled className="gap-2">
              <FileDown className="h-4 w-4" />
              PDF indir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
