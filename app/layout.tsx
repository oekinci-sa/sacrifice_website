import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

export const dynamic = 'force-dynamic'
export const revalidate = 0  // ISR’ı tamamen kapatır

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "Ankara Kurban",
  description: "Ankara Kurban",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body
        className={`${instrumentSans.variable}`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 