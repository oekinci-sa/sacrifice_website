import type { Metadata } from "next";
import { Inter, Instrument_Sans, Playfair_Display } from "next/font/google";
import "@/app/globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/common/theme-provider";
import Header from "./(anasayfa)/layout/header";
import Footer from "./(anasayfa)/layout/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  title: "Anasayfa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrumentSans.variable} ${playfairDisplay.variable} flex flex-col min-h-screen justify-between`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col">
            <Header></Header>
            {children}
            <Analytics />
            <SpeedInsights />
            <Footer></Footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
