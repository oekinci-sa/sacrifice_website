import { Instrument_Sans } from "next/font/google";
import "@/app/globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata = {
  title: "Admin Panel",
  description: "Kurban yönetim sistemi admin paneli",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${instrumentSans.variable} font-heading`}>
        {children}
      </body>
    </html>
  );
} 