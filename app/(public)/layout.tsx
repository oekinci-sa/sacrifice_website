import { Instrument_Sans } from 'next/font/google';
import "../globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Footer from "../../components/layout/footer/footer";
import Header from "../../components/layout/header/header";

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
    // overflow-x-hidden belki lazım olur.
    <div className={`${instrumentSans.variable} min-h-screen`}>
      <Header />
      {children}
      <Analytics />
      <SpeedInsights />
      <Footer />
    </div>
  );
}
