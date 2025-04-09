import "../globals.css";
import type { Metadata } from "next";
import { Inter, Instrument_Sans, Playfair_Display } from 'next/font/google';

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Header from "./components/layout/header";
import Footer from "./components/layout/footer";

// Fonts
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
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
    <html lang="tr">
      <body className={`${inter.variable} ${playfairDisplay.variable} ${instrumentSans.variable} font-heading min-h-screen overflow-x-hidden`}>
        <Header />
        {children}
        <Analytics />
        <SpeedInsights />
        <Footer />
      </body>
    </html>
  );
}
