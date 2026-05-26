'use client';

import { normalizeDecimalInput, parseDecimalInput } from "@/lib/decimal-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DeliveryShareInfoFormProps {
    sacrificeNo: number;
}

interface DeliveryInfoData {
    delivered_share_kg: number | null;
    delivery_notes: string | null;
}

export function DeliveryShareInfoForm({ sacrificeNo }: DeliveryShareInfoFormProps) {
    const [kgInput, setKgInput] = useState("");
    const [notesInput, setNotesInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const savedRef = useRef<{ kg: string; notes: string }>({ kg: "", notes: "" });
    const { toast } = useToast();

    const loadData = useCallback(async (no: number) => {
        if (!no || no < 1) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/check-sacrifice-timing?sacrifice_no=${no}`);
            if (!response.ok) throw new Error("load failed");
            const data: DeliveryInfoData = await response.json();
            const kg =
                data.delivered_share_kg != null
                    ? normalizeDecimalInput(String(data.delivered_share_kg))
                    : "";
            const notes = data.delivery_notes ?? "";
            setKgInput(kg);
            setNotesInput(notes);
            savedRef.current = { kg, notes };
        } catch {
            toast({
                variant: "destructive",
                title: "Yükleme hatası",
                description: "Teslimat bilgileri yüklenemedi.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        void loadData(sacrificeNo);
    }, [sacrificeNo, loadData]);

    const handleSave = async () => {
        const kgTrimmed = normalizeDecimalInput(kgInput.trim());
        const notesTrimmed = notesInput.trim();

        const parsedKg = parseDecimalInput(kgTrimmed);
        if (kgTrimmed !== "" && (parsedKg === null || parsedKg < 0)) {
            toast({
                variant: "destructive",
                title: "Geçersiz değer",
                description: "Teslim edilen kg pozitif bir sayı olmalıdır.",
            });
            return;
        }

        if (
            kgTrimmed === savedRef.current.kg &&
            notesTrimmed === savedRef.current.notes
        ) {
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/update-sacrifice-delivery-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sacrifice_no: sacrificeNo,
                    delivered_share_kg: parsedKg,
                    delivery_notes: notesTrimmed === "" ? null : notesTrimmed,
                }),
            });

            if (!response.ok) throw new Error("save failed");

            savedRef.current = { kg: kgTrimmed, notes: notesTrimmed };
            toast({
                title: "Kaydedildi",
                description: "Teslimat bilgileri güncellendi.",
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Kayıt başarısız",
                description: "Teslimat bilgileri kaydedilemedi. Tekrar deneyin.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleKgChange = (raw: string) => {
        const normalized = normalizeDecimalInput(raw).replace(/[^\d.]/g, "");
        const dotIndex = normalized.indexOf(".");
        const sanitized =
            dotIndex === -1
                ? normalized
                : normalized.slice(0, dotIndex + 1) +
                  normalized.slice(dotIndex + 1).replace(/\./g, "");
        setKgInput(sanitized);
    };

    const hasChanges =
        normalizeDecimalInput(kgInput.trim()) !== savedRef.current.kg ||
        notesInput.trim() !== savedRef.current.notes;

    return (
        <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-4 shadow-sm [color-scheme:light]">
            <h3 className="mb-4 text-center text-base font-semibold text-black/80">
                Hisse Teslimat Bilgisi
            </h3>

            {isLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yükleniyor…
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="delivered-share-kg" className="text-sm text-black/75">
                            Hissedarlara teslim edilen toplam kg
                        </Label>
                        <div className="flex items-center gap-2">
                            <input
                                id="delivered-share-kg"
                                type="text"
                                inputMode="decimal"
                                value={kgInput}
                                onChange={(e) => handleKgChange(e.target.value)}
                                placeholder="Örn. 42.5"
                                disabled={isSaving}
                                className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400"
                            />
                            <span className="text-sm font-medium text-black/60">kg</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="delivery-notes" className="text-sm text-black/75">
                            Teslimat / hisse teslim notu
                        </Label>
                        <textarea
                            id="delivery-notes"
                            rows={3}
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Teslimat veya hisse dağıtımı ile ilgili not…"
                            disabled={isSaving}
                            className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400"
                        />
                        <p className="text-xs text-gray-500">
                            Kurbanlık genel notundan bağımsızdır; yalnızca teslimat operasyonu içindir.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isSaving || !hasChanges}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Kaydet
                    </button>
                </div>
            )}
        </div>
    );
}
