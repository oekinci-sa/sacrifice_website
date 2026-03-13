import { ThemeStyles } from "@/components/theme/ThemeStyles";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers/providers";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "Ankara Kurban Hisse Organizasyonu",
  description:
    "İMH Ankara Kurban organizasyonu olarak, bu mukaddes ibadeti huzurla ve gönül rahatlığıyla yerine getirin. Allah’a sadece takvanız ulaşır…",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        {/* Sunucu tarafı tema enjeksiyonu: ilk paint'te doğru tenant renkleri (FOUC önleme) */}
        <ThemeStyles />
      </head>
      <body className={`${instrumentSans.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
