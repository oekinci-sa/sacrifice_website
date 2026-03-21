"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import Image from "next/image";
import { useTenantBranding } from "@/hooks/useTenantBranding";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { logo_slug } = useTenantBranding();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "TenantAccessDenied") {
      toast({
        variant: "destructive",
        title: "Erişim reddedildi",
        description: "Bu organizasyona erişim yetkiniz bulunmuyor.",
      });
    } else if (error === "TenantPendingApproval") {
      toast({
        variant: "destructive",
        title: "Onay bekleniyor",
        description: "Bu organizasyona erişim için yönetici onayı gerekiyor.",
      });
    }
  }, [searchParams, toast]);

  const handleGoogleLogin = () => {
    signIn("google", {
      callbackUrl: `${window.location.origin}/kurban-admin/genel-bakis`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/80 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-[60%] h-[60%] -translate-y-1/4 translate-x-1/4 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(251,207,232,0.5) 0%, rgba(254,215,170,0.4) 40%, rgba(254,249,195,0.3) 70%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
        <div className="flex justify-center mb-6">
          <div
            className={
              logo_slug === "elya-hayvancilik"
                ? "w-[100px] h-auto"
                : "w-[180px] h-auto"
            }
          >
            <Image
              src={`/logos/${logo_slug}/${logo_slug}.svg`}
              alt="Logo"
              width={logo_slug === "elya-hayvancilik" ? 100 : 180}
              height={logo_slug === "elya-hayvancilik" ? 40 : 60}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>

        <div className="space-y-1 text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Tekrar hoş geldiniz!
          </h1>
          <p className="text-sm text-gray-500">
            Devam etmek için Google hesabınızla giriş yapın.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-10 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google ile Giriş Yap
        </Button>
      </div>
    </div>
  );
}
