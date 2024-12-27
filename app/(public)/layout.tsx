import type { Metadata } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "@/app/globals.css";
import Header from "./components/layout/Header/header";
import Footer from "./components/layout/Footer/Footer";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "Anasayfa",
  // description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrumentSans.variable} flex flex-col min-h-screen justify-between`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="container mx-auto ">
            <Header></Header>
            {children}
          </div>
          <Footer></Footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
