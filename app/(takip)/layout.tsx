import "@/app/globals.css";
import { Instrument_Sans, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export default function FollowLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${inter.variable} ${instrumentSans.variable} flex flex-col min-h-screen justify-between`}>
      {children}
    </div>
  );
}
