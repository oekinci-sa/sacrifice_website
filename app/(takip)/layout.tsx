import "@/app/globals.css";
import { Instrument_Sans } from "next/font/google";

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
    <div className={`${instrumentSans.variable} flex flex-col min-h-screen justify-between`}>
      {children}
    </div>
  );
}
