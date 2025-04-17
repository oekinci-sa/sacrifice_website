import type { Metadata } from "next";
import { Instrument_Sans, Inter, Playfair_Display } from 'next/font/google';
import "../globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Footer from "./components/layout/footer";
import Header from "./components/layout/header";

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

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${instrumentSans.variable} ${playfairDisplay.variable} ${inter.variable} min-h-screen overflow-x-hidden`}>
      <Header />
      {children}
      <Analytics />
      <SpeedInsights />
      <Footer />
    </div>
  );
}
