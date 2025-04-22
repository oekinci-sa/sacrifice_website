import "@/app/globals.css";
import { AdminDataProvider } from "@/app/providers/AdminDataProvider";
import { Instrument_Sans } from "next/font/google";

export const dynamic = 'force-dynamic'
export const revalidate = 0

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata = {
  title: "Yönetim Paneli",
  description: "Kurban yönetim sistemi yönetim paneli",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${instrumentSans.variable} font-heading`}>
      <AdminDataProvider>
        {children}
      </AdminDataProvider>
    </div>
  );
} 