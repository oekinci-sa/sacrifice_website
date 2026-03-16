import "@/app/globals.css";
import { AdminDataProvider } from "@/app/providers/AdminDataProvider";
import { TenantBrandingProvider } from "@/app/providers/TenantBrandingProvider";
import { ClientLayout } from "@/app/(admin)/kurban-admin/client-layout";
import { getTenantBranding } from "@/lib/tenant-branding";
import { Instrument_Sans } from "next/font/google";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata = {
  title: "Yönetim Paneli",
  description: "Kurban yönetim sistemi yönetim paneli",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getTenantBranding();

  return (
    <TenantBrandingProvider initialBranding={branding}>
      <div className={`${instrumentSans.variable} font-heading`}>
        <AdminDataProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AdminDataProvider>
      </div>
    </TenantBrandingProvider>
  );
} 