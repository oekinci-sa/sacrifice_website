import type { Metadata } from "next";
import AdminLayout from "./components/layout/admin-layout";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Kurban yönetim sistemi admin paneli",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
} 