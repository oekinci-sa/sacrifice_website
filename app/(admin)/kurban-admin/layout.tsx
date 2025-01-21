import type { Metadata } from "next";
import { Inter, Instrument_Sans, Playfair_Display } from "next/font/google";
import AdminLayout from "./components/layout/admin-layout";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});



export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Kurban yönetim sistemi admin paneli",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return(
    <html lang="tr">
      <body
        className={`${inter.variable} ${instrumentSans.variable}`}
      >
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  );
} 