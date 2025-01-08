import { Inter, Instrument_Sans } from "next/font/google";
import "/app/globals.css";

import { ThemeProvider } from "@/components/common/theme-provider";

import AdminHeader from "./kurban-admin/components/layout/admin-header";
import AdminFooter from "./kurban-admin/components/layout/admin-footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export default function KurbanAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrumentSans.variable} flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col">
            <div className="mx-8">
              <AdminHeader></AdminHeader>
              {children}
            </div>
            <AdminFooter></AdminFooter>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
