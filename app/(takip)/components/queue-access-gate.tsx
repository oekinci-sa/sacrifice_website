"use client";

import { PageKey } from "@/lib/queue-access-hash";
import { Lock, ShieldCheck } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

type Status = "checking" | "locked" | "open";

interface Props {
  pageKey: PageKey;
  children: React.ReactNode;
}

const PAGE_LABELS: Record<PageKey, string> = {
  slaughter: "Kesim Sırası",
  butcher: "Parçalama Sırası",
  delivery: "Teslimat Sırası",
};

export function QueueAccessGate({ pageKey, children }: Props) {
  const [status, setStatus] = useState<Status>("checking");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lockedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [remainingMin, setRemainingMin] = useState<number>(0);

  const checkAccess = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue-access/check?pageKey=${pageKey}`);
      if (res.ok) {
        const data = (await res.json()) as { valid?: boolean };
        if (data.valid) {
          setStatus("open");
          return;
        }
      }
    } catch {
      // Ağ hatası → kilidi göster
    }
    setStatus("locked");
  }, [pageKey]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  // Kilit geri sayım timer'ı
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const diff = lockedUntil.getTime() - Date.now();
      if (diff <= 0) {
        setLockedUntil(null);
        setError("Tekrar deneyebilirsiniz.");
        if (lockedTimerRef.current) clearInterval(lockedTimerRef.current);
      } else {
        setRemainingMin(Math.ceil(diff / 60000));
      }
    };
    tick();
    lockedTimerRef.current = setInterval(tick, 10000);
    return () => {
      if (lockedTimerRef.current) clearInterval(lockedTimerRef.current);
    };
  }, [lockedUntil]);

  const handleDigitChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    setError(null);
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter") {
      void handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleSubmit = async () => {
    const code = digits.join("");
    if (code.length < 6) {
      setError("Lütfen 6 haneli şifreyi eksiksiz girin.");
      return;
    }
    if (lockedUntil && lockedUntil > new Date()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/queue-access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, code }),
      });

      interface VerifyResponse {
        success?: boolean;
        error?: string;
        locked?: boolean;
        locked_until?: string;
      }
      const data = (await res.json()) as VerifyResponse;

      if (res.ok && data.success) {
        setStatus("open");
        return;
      }

      if (data.locked && data.locked_until) {
        setLockedUntil(new Date(data.locked_until));
      }
      setError(data.error ?? "Hatalı şifre.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white [color-scheme:light]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" />
          <span className="text-sm">Yükleniyor…</span>
        </div>
      </div>
    );
  }

  if (status === "locked") {
    const isLockedOut = !!(lockedUntil && lockedUntil > new Date());

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm [color-scheme:light]">
        <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 bg-gray-50 px-6 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{PAGE_LABELS[pageKey]}</h2>
            <p className="text-sm text-gray-500">
              Bu sayfaya erişmek için 6 haneli şifreyi girin.
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 px-6 py-6">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={submitting || isLockedOut}
                className={`h-12 w-10 rounded-lg border-2 text-center text-xl font-bold transition-colors outline-none
                  ${error ? "border-rose-400 bg-rose-50" : "border-gray-300 bg-white"}
                  focus:border-primary
                  disabled:cursor-not-allowed disabled:opacity-50`}
              />
            ))}
          </div>

          {/* Error / lockout message */}
          {error && (
            <p className="px-6 pb-2 text-center text-sm text-rose-600">{error}</p>
          )}
          {isLockedOut && (
            <p className="px-6 pb-2 text-center text-sm text-amber-600">
              {remainingMin} dakika sonra tekrar deneyebilirsiniz.
            </p>
          )}

          {/* Submit */}
          <div className="px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || isLockedOut || digits.join("").length < 6}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Doğrulanıyor…" : "Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}

export function QueueAccessBadge({ pageKey }: { pageKey: PageKey }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>{PAGE_LABELS[pageKey]}</span>
    </div>
  );
}
