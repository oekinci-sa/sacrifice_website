"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmsCharacterCounterDisplay } from "./sms-character-counter-display";

/** Desteklenen şablon değişkenleri. */
const VARIABLES: { label: string; value: string }[] = [
  { label: "Ad Soyad", value: "{{ad_soyad}}" },
  { label: "Telefon", value: "{{telefon}}" },
  { label: "Kurbanlık No", value: "{{hayvan_no}}" },
  { label: "Kalan Tutar", value: "{{kalan_tutar}}" },
  { label: "Ödenen Tutar", value: "{{odenen_tutar}}" },
  { label: "Toplam Tutar", value: "{{toplam_tutar}}" },
  { label: "Kapora", value: "{{kapora_tutari}}" },
  { label: "Kesim Saati", value: "{{kesim_saati}}" },
  { label: "Kesim Tarihi", value: "{{kesim_tarihi}}" },
  { label: "Teslimat Tercihi", value: "{{teslimat_tercihi}}" },
  { label: "Teslimat Adresi", value: "{{teslimat_adresi}}" },
  { label: "Sorgulama Linki", value: "{{sorgulama_linki}}" },
  { label: "Güvenlik Kodu", value: "{{guvenlik_kodu}}" },
  { label: "IBAN", value: "{{iban}}" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function SmsEditor({
  value,
  onChange,
  label = "Mesaj İçeriği",
  placeholder = "SMS mesajını buraya yazın...",
  disabled,
}: Props) {
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("sms-editor-textarea") as HTMLTextAreaElement | null;
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

  return (
    <div className="space-y-2">
      <Label htmlFor="sms-editor-textarea">{label}</Label>
      <div className="flex flex-wrap gap-1 mb-2">
        {VARIABLES.map((v) => (
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
      <Textarea
        id="sms-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        disabled={disabled}
        className="font-mono text-sm resize-none"
        maxLength={882}
      />
      <SmsCharacterCounterDisplay text={value} />
    </div>
  );
}
