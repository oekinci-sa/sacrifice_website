import type { Metadata } from "next";
import { Inter, Instrument_Sans, Playfair_Display } from "next/font/google";
import AdminLayout from "./components/layout/admin-layout";
import "@/app/globals.css";
import { Home, Cow, Users, FileText } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const sidebarNav = [
  {
    title: "Genel Bakış",
    href: "/kurban-admin/genel-bakis",
    icon: <Home size={20} />,
  },
  {
    title: "Kurbanlıklar",
    href: "/kurban-admin/kurbanliklar",
    icon: <Cow size={20} />,
  },
  {
    title: "Hissedarlar",
    href: "/kurban-admin/hissedarlar",
    icon: <Users size={20} />,
  },
  {
    title: "Değişiklik Kayıtları",
    href: "/kurban-admin/degisiklik-kayitlari",
    icon: <FileText size={20} />,
  },
];

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
        <AdminLayout sidebarNav={sidebarNav}>{children}</AdminLayout>
      </body>
    </html>
  );
} 