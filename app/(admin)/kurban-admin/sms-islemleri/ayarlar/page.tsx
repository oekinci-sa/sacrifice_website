"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function SmsAyarlarPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const [originators, setOriginators] = useState<string[]>([]);
  const [loadingOriginators, setLoadingOriginators] = useState(false);

  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const fetchCredits = async () => {
    setLoadingCredits(true);
    try {
      const res = await fetch("/api/admin/sms/credit");
      const data = await res.json();
      if (res.ok) {
        setCredits(data.credits);
      } else {
        toast({ title: "Kredi sorgulanamadı", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setLoadingCredits(false);
    }
  };

  const fetchOriginators = async () => {
    setLoadingOriginators(true);
    try {
      const res = await fetch("/api/admin/sms/originators");
      const data = await res.json();
      if (res.ok) {
        setOriginators(data.originators ?? []);
      } else {
        toast({
          title: "Originator listesi alınamadı",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setLoadingOriginators(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    fetchOriginators();
  }, []);

  const handleTestSms = async () => {
    if (!testPhone.trim()) {
      toast({ title: "Telefon numarası zorunlu", variant: "destructive" });
      return;
    }
    if (!testMessage.trim()) {
      toast({ title: "Mesaj içeriği zorunlu", variant: "destructive" });
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "[Test SMS] Ayarlar Test Gönderimi",
          message_content: testMessage,
          recipients: [{ phone_number: testPhone }],
          target_type: "single",
          target_params: { is_test: true },
          deduplicate_phone_numbers: false,
          idempotency_key: uuidv4(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast({ title: "Test SMS gönderildi", description: `Gönderim ID: ${data.sendId}` });
        setTestPhone("");
        setTestMessage("");
      } else {
        toast({
          title: "Test SMS gönderilemedi",
          description: data.error ?? "Bilinmeyen hata",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SMS Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">
          SMS API özeti, kredi bakiyesi ve test gönderimi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="text-base">API Yapılandırması</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Sağlayıcı</span>
              <span className="font-medium">Bizim SMS</span>
              <span className="text-muted-foreground">API adresi</span>
              <span className="text-xs break-all">api.sms.bizimsms.mobi</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none rounded-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">SMS kredi bakiyesi</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={fetchCredits}
                disabled={loadingCredits}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingCredits ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCredits ? (
              <div className="text-sm text-muted-foreground">Sorgulanıyor...</div>
            ) : credits === null ? (
              <div className="text-sm text-muted-foreground">Bakiye alınamadı</div>
            ) : (
              <div className="text-3xl font-bold tabular-nums">
                {credits.toLocaleString("tr-TR")}
                <span className="text-base font-normal text-muted-foreground ml-2">kredi</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none rounded-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Onaylı SMS başlıkları (originator)</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchOriginators}
              disabled={loadingOriginators}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingOriginators ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingOriginators ? (
            <div className="text-sm text-muted-foreground">Sorgulanıyor...</div>
          ) : originators.length === 0 ? (
            <div className="text-sm text-muted-foreground">Originator listesi alınamadı.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {originators.map((o) => (
                <Badge key={o} variant="secondary">
                  {o}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none rounded-md">
        <CardHeader>
          <CardTitle className="text-base">Test SMS gönder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Test gönderimler <code className="text-xs">target_params.is_test</code> ile işaretlenir.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefon numarası *</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="05xx xxx xx xx"
              />
            </div>
            <div className="space-y-2">
              <Label>Mesaj içeriği *</Label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test mesajı..."
                rows={3}
              />
            </div>
          </div>
          <Button
            onClick={handleTestSms}
            disabled={sendingTest}
            size="sm"
            className="admin-tenant-accent"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendingTest ? "Gönderiliyor..." : "Test SMS gönder"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
