import { Instrument_Sans } from 'next/font/google';
import { Suspense } from "react";
import "../globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Footer from "../../components/layout/footer/footer";
import Header from "../../components/layout/header/header";
import { PublicYearProvider } from "./components/PublicYearProvider";

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
    <div className={`${instrumentSans.variable} min-h-screen flex flex-col`}>
      <Header />
      <main className="flex-1">
        <Suspense fallback={null}>
          <PublicYearProvider>
            {children}
          </PublicYearProvider>
        </Suspense>
      </main>
      <Footer />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
