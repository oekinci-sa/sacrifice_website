"use client";

import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";

type PageKey = "slaughter" | "butcher" | "delivery";

interface CodeStatus {
  page_key: PageKey;
  is_set: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

const PAGE_LABELS: Record<PageKey, string> = {
  slaughter: "Kesim Sırası",
  butcher: "Parçalama Sırası",
  delivery: "Teslimat Sırası",
};

const PAGE_DESCRIPTIONS: Record<PageKey, string> = {
  slaughter: "/kesimsirasi sayfasına erişim şifresi",
  butcher: "/parcalamasirasi sayfasına erişim şifresi",
  delivery: "/teslimatsirasi sayfasına erişim şifresi",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CodeCardProps {
  status: CodeStatus;
  onSaved: () => void;
}

function CodeCard({ status, onSaved }: CodeCardProps) {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast({
        variant: "destructive",
        title: "Geçersiz şifre",
        description: "Şifre 6 haneli rakamdan oluşmalıdır.",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/security/queue-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey: status.page_key, code }),
      });
      interface SaveResponse { success?: boolean; error?: string }
      const data = (await res.json()) as SaveResponse;
      if (!res.ok) {
        toast({ variant: "destructive", title: "Hata", description: data.error ?? "Kaydedilemedi." });
        return;
      }
      toast({ title: "Kaydedildi", description: `${PAGE_LABELS[status.page_key]} şifresi güncellendi.` });
      setCode("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch {
      toast({ variant: "destructive", title: "Hata", description: "Sunucuya ulaşılamadı." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{PAGE_LABELS[status.page_key]}</p>
          <p className="text-xs text-gray-500">{PAGE_DESCRIPTIONS[status.page_key]}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status.is_set
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {status.is_set ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Ayarlandı
            </>
          ) : (
            <>
              <ShieldOff className="h-3 w-3" />
              Ayarlanmadı
            </>
          )}
        </span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {status.is_set && (
          <p className="text-xs text-gray-500">
            Son güncelleme: <span className="font-medium text-gray-700">{formatDate(status.updated_at)}</span>
            {status.updated_by && (
              <> &nbsp;·&nbsp; <span className="font-medium text-gray-700">{status.updated_by}</span></>
            )}
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={showCode ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && void handleSave()}
              placeholder="Yeni 6 haneli şifre"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm text-gray-900 outline-none tracking-widest focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400 placeholder:tracking-normal"
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || code.length !== 6}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : null}
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  const [codes, setCodes] = useState<CodeStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security/queue-codes");
      if (res.ok) {
        const data = (await res.json()) as { codes?: CodeStatus[] };
        setCodes(data.codes ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCodes();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Güvenlik Ayarları</h1>
        <p className="mt-1 text-sm text-gray-500">
          Operatör sıra sayfalarına erişimi kısıtlamak için 6 haneli şifreler belirleyin.
          Şifre ayarlanmayan sayfalar herkese açık kalır.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Yükleniyor…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {codes.map((status) => (
            <CodeCard key={status.page_key} status={status} onSaved={() => void fetchCodes()} />
          ))}
        </div>
      )}
    </div>
  );
}
