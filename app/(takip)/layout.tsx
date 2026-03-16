import StageMetricsRealtimeProvider from "@/app/(takip)/components/stage-metrics-realtime-provider";
import { TenantBrandingProvider } from "@/app/providers/TenantBrandingProvider";
import "@/app/globals.css";
import FooterMinimal from "@/components/layout/footer/footer-minimal";
import HeaderMinimal from "@/components/layout/header/header-minimal";
import { getTenantBranding } from "@/lib/tenant-branding";
import { Instrument_Sans } from "next/font/google";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export default async function FollowLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getTenantBranding();

  return (
    <TenantBrandingProvider initialBranding={branding}>
      <div className={`${instrumentSans.variable} flex flex-col min-h-screen`}>
        <HeaderMinimal />
      <main className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-auto">
        <StageMetricsRealtimeProvider>
          {children}
        </StageMetricsRealtimeProvider>
      </main>
      <FooterMinimal />
      </div>
    </TenantBrandingProvider>
  );
}
