"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculateSmsInfo } from "@/lib/sms-character-counter";
import { AlertTriangle, CheckCircle } from "lucide-react";

export interface SmsPreviewStats {
  totalRecipients: number;
  validPhones: number;
  duplicates: number;
  invalidPhones: number;
  willSend: number;
  emptyVariableWarnings: string[];
  messageContent: string;
  deduplicateEnabled: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stats: SmsPreviewStats;
  isLoading?: boolean;
}

export function SmsPreviewDialog({
  open,
  onClose,
  onConfirm,
  stats,
  isLoading,
}: Props) {
  const smsInfo = calculateSmsInfo(stats.messageContent);
  const estimatedCredits = stats.willSend * smsInfo.parts;
  const rawPreview = stats.messageContent;
  const hasPreview = Boolean(rawPreview.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Gönderim Önizlemesi</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto min-h-0 pr-1">
          {/* Mesaj önizleme — Keep benzeri: tam metin aşağıya doğru uzar */}
          <div className="rounded-md bg-muted p-3 text-sm font-normal leading-relaxed whitespace-pre-wrap break-words">
            {hasPreview ? rawPreview : (
              <span className="text-muted-foreground italic font-normal">Mesaj boş</span>
            )}
          </div>

          {/* Alıcı özeti */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Toplam hissedar</span>
              <span className="font-medium">{stats.totalRecipients}</span>
            </div>
            {stats.invalidPhones > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Geçersiz telefon</span>
                <span className="font-medium">-{stats.invalidPhones}</span>
              </div>
            )}
            {stats.deduplicateEnabled && stats.duplicates > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="pr-3">
                  Aynı kurbanlıkta aynı cep (isim dikkate alınmaz, yalnızca numara)
                </span>
                <span className="font-medium shrink-0">-{stats.duplicates}</span>
              </div>
            )}
            <div className="border-t pt-1.5 flex justify-between font-semibold">
              <span>Gönderilecek SMS</span>
              <span className={stats.willSend === 0 ? "text-destructive" : "text-green-600"}>
                {stats.willSend}
              </span>
            </div>
          </div>

          {/* SMS teknik bilgisi */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground bg-muted/50 rounded p-2">
            <span>{smsInfo.parts} SMS boyu/alıcı</span>
            <span>·</span>
            <span>
              Tahmini kredi: <strong>{estimatedCredits}</strong>
            </span>
          </div>

          {/* Boş değişken uyarıları */}
          {stats.emptyVariableWarnings.length > 0 && (
            <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm space-y-1">
                <p className="font-medium">Boş değişken uyarısı:</p>
                {stats.emptyVariableWarnings.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
                <p className="mt-1 text-xs">
                  Bu değişkenler mesajda doldurulmadan gönderilecek. Devam edebilirsiniz.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {stats.willSend === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Gönderilecek geçerli alıcı bulunamadı. Lütfen alıcı listesini kontrol edin.
              </AlertDescription>
            </Alert>
          )}

          {stats.willSend > 0 && stats.emptyVariableWarnings.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Gönderime hazır</span>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            İptal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || stats.willSend === 0}
            className="admin-tenant-accent"
          >
            {isLoading ? "Gönderiliyor..." : `${stats.willSend} Kişiye Gönder`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
