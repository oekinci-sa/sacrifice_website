import { Instrument_Sans } from 'next/font/google';
import "../globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Footer from "./components/layout/footer";
import Header from "./components/layout/header";

// Fonts
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${instrumentSans.variable} min-h-screen overflow-x-hidden`}>
      <Header />
      {children}
      <Analytics />
      <SpeedInsights />
      <Footer />
    </div>
  );
}
