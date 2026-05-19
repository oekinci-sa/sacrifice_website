"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmsCharacterCounterDisplay } from "./sms-character-counter-display";

/** Desteklenen şablon değişkenleri — tüm şablonlarda (manuel + otomatik) ortak set. */
const VARIABLES: { label: string; value: string; group?: string }[] = [
  // Hissedar
  { label: "Ad Soyad", value: "{{ad_soyad}}" },
  { label: "Telefon", value: "{{telefon}}" },
  { label: "Güvenlik Kodu", value: "{{guvenlik_kodu}}" },
  // Kurban
  { label: "Kurban No", value: "{{kurban_no}}" },
  { label: "Küpe No", value: "{{kupe_no}}" },
  { label: "Kesim Saati", value: "{{kesim_saati}}" },
  { label: "Kesim Tarihi", value: "{{kesim_tarihi}}" },
  // Ödeme
  { label: "Kalan Tutar", value: "{{kalan_tutar}}" },
  { label: "Ödenen Tutar", value: "{{odenen_tutar}}" },
  { label: "Toplam Tutar", value: "{{toplam_tutar}}" },
  { label: "Kapora", value: "{{kapora_tutari}}" },
  { label: "IBAN", value: "{{iban}}" },
  // Teslimat
  { label: "Teslimat Tercihi", value: "{{teslimat_tercihi}}" },
  { label: "Teslimat Adresi", value: "{{teslimat_adresi}}" },
  // Linkler
  { label: "Sorgulama Linki", value: "{{sorgulama_linki}}" },
  // Otomatik SMS — tetikleyici kurban
  { label: "Şu An Kesilen No", value: "{{kesilen_kurban_no}}", group: "oto" },
  // Otomatik SMS — ham ortalama süreler (dakika / kurban başına)
  { label: "Kesim Ort. Süre (dk)", value: "{{kesim_ortalama_suresi}}", group: "oto" },
  { label: "Parçalama Ort. Süre (dk)", value: "{{parcalama_ortalama_suresi}}", group: "oto" },
  { label: "Teslimat Ort. Süre (dk)", value: "{{teslimat_ortalama_suresi}}", group: "oto" },
  // Otomatik SMS — tahmini bekleme (ortalama × tenant offset)
  { label: "Kesim Tahmini Süre (dk)", value: "{{kesim_tahmini_sure}}", group: "oto" },
  { label: "Parçalama Tahmini Süre (dk)", value: "{{parcalama_tahmini_sure}}", group: "oto" },
  { label: "Teslimat Tahmini Süre (dk)", value: "{{teslimat_tahmini_sure}}", group: "oto" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Varsayılan `sms-editor-textarea`; iki editör yan yana ise benzersiz verin. */
  textareaId?: string;
}

export function SmsEditor({
  value,
  onChange,
  label = "Mesaj İçeriği",
  placeholder = "SMS mesajını buraya yazın...",
  disabled,
  textareaId = "sms-editor-textarea",
}: Props) {
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!textarea) {
      onChange(value + variable);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + variable + value.slice(end);
    onChange(newValue);
    // Cursor'u değişken sonrasına taşı
    requestAnimationFrame(() => {
      const pos = start + variable.length;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  };

  const generalVars = VARIABLES.filter((v) => !v.group);
  const autoVars = VARIABLES.filter((v) => v.group === "oto");

  return (
    <div className="space-y-2">
      <Label htmlFor={textareaId}>{label}</Label>
      <div className="space-y-1 mb-2">
        <div className="flex flex-wrap gap-1">
          {generalVars.map((v) => (
            <Button
              key={v.value}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => insertVariable(v.value)}
              disabled={disabled}
            >
              {v.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 pt-1 border-t border-dashed border-muted-foreground/30">
          <span className="text-[10px] text-muted-foreground self-center mr-1 shrink-0">Otomatik SMS:</span>
          {autoVars.map((v) => (
            <Button
              key={v.value}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2 text-blue-700 border-blue-200 hover:bg-blue-50"
              onClick={() => insertVariable(v.value)}
              disabled={disabled}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>
      <Textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={10}
        disabled={disabled}
        className="text-sm resize-none min-h-[12rem]"
        maxLength={882}
      />
      <SmsCharacterCounterDisplay text={value} />
    </div>
  );
}
