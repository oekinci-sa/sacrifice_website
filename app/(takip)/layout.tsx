import StageMetricsRealtimeProvider from "@/app/(takip)/components/stage-metrics-realtime-provider";
import "@/app/globals.css";
import FooterMinimal from "@/components/layout/footer/footer-minimal";
import HeaderMinimal from "@/components/layout/Header/header-minimal";
import { Instrument_Sans } from "next/font/google";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export default function FollowLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${instrumentSans.variable} min-h-screen flex flex-col justify-between`}>
      <HeaderMinimal />
      <StageMetricsRealtimeProvider>
        {children}
      </StageMetricsRealtimeProvider>
      <FooterMinimal />
    </div>
  );
}
