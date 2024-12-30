import { Inter, Instrument_Sans } from "next/font/google";
import "/app/globals.css";

import { AppSidebar } from "@/app/(admin)/kurban-admin/components/layout/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "../(public)/(anasayfa)/components/Header/ModeToggle";
import Logo from "../(public)/(anasayfa)/components/Header/Logo";

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
          {/* <SidebarProvider
            style={
              {
                "--sidebar-width": "19rem",
              } as React.CSSProperties
            }
          > */}
          {/* <AppSidebar /> */}
          <div className="flex m-8 mt-4 gap-4 items-center">
            <Logo></Logo>
            {/* <SidebarInset> */}
            <header className="flex h-16 shrink-0 items-center gap-2 px-4">
              {/* <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" /> */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Yönetim Paneli</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Kurbanlıklar</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <ModeToggle></ModeToggle>
            </header>
          </div>

          <div className="p-4 pt-0">{children}</div>
          {/* </SidebarInset>
          </SidebarProvider> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
