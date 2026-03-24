"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Mail } from "lucide-react";
import { useState } from "react";

interface ShareholderLookupEmailActionsProps {
  shareholderId: string;
  phoneDigits: string;
  securityCode: string;
  registeredEmail: string | null | undefined;
}

export function ShareholderLookupEmailActions({
  shareholderId,
  phoneDigits,
  securityCode,
  registeredEmail,
}: ShareholderLookupEmailActionsProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [alternateEmail, setAlternateEmail] = useState("");
  const [showAlternatePanel, setShowAlternatePanel] = useState(false);

  const hasRegistered = Boolean(registeredEmail?.trim());

  const postSummary = async (alternate?: string) => {
    const body: Record<string, unknown> = {
      phone: phoneDigits,
      security_code: securityCode,
      shareholder_id: shareholderId,
    };
    const trimmed = alternate?.trim();
    if (trimmed) {
      body.alternate_email = trimmed;
    }

    const res = await fetch("/api/send-shareholder-lookup-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        typeof data.error === "string"
          ? data.error
          : "E-posta gönderilemedi"
      );
    }

    const sentTo =
      typeof data.sent_to === "string" ? data.sent_to : "e-posta adresinize";
    toast({
      title: "E-posta gönderildi",
      description: `Özet ${sentTo} adresine iletildi.`,
    });
  };

  const sendToRegistered = async () => {
    setPending(true);
    try {
      await postSummary(undefined);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Gönderilemedi",
        description:
          e instanceof Error ? e.message : "Bir hata oluştu. Tekrar deneyin.",
      });
    } finally {
      setPending(false);
    }
  };

  const sendToAlternate = async () => {
    const alt = alternateEmail.trim();
    if (!alt) {
      toast({
        variant: "destructive",
        title: "E-posta gerekli",
        description: "Lütfen geçerli bir e-posta adresi girin.",
      });
      return;
    }
    setPending(true);
    try {
      await postSummary(alt);
      setAlternateEmail("");
      setShowAlternatePanel(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Gönderilemedi",
        description:
          e instanceof Error ? e.message : "Bir hata oluştu. Tekrar deneyin.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasRegistered ? (
        <div className="flex flex-col gap-3 items-stretch sm:items-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-fit sm:max-w-full justify-center sm:justify-start"
            disabled={pending}
            onClick={() => void sendToRegistered()}
          >
            <Mail className="h-4 w-4 shrink-0" />
            {pending ? "Gönderiliyor…" : "Kayıtlı e-postama gönder"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary h-auto py-1 px-0 justify-start w-full sm:w-fit"
            disabled={pending}
            onClick={() => setShowAlternatePanel((v) => !v)}
          >
            {showAlternatePanel
              ? "Başka adrese göndermeyi kapat"
              : "Başka bir adrese gönder"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Kayıtlı e-posta adresiniz yok. Özeti göndermek için aşağıdan adres
          girin.
        </p>
      )}

      {(!hasRegistered || showAlternatePanel) && (
        <div className="flex flex-col gap-2 max-w-md">
          <Input
            type="email"
            autoComplete="email"
            placeholder="E-posta adresi"
            value={alternateEmail}
            onChange={(e) => setAlternateEmail(e.target.value)}
            className="text-sm md:text-base"
            disabled={pending}
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2 w-full sm:w-fit sm:max-w-full"
            disabled={pending}
            onClick={() => void sendToAlternate()}
          >
            <Mail className="h-4 w-4 shrink-0" />
            Bu adrese gönder
          </Button>
        </div>
      )}
    </div>
  );
}
