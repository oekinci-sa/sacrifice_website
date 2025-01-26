import type { Metadata } from "next";

import "./globals.css";

import { Inter } from "next/font/google";
import { Instrument_Sans } from "next/font/google";

import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });
import "@/app/globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "Sacrifice Website",
  description: "Sacrifice Website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} ${instrumentSans.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 