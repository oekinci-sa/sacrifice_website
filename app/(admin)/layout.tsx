import { Inter, Instrument_Sans } from "next/font/google";
import "/app/globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "../../components/layout/public/Header/ModeToggle";
import Logo from "../../components/layout/public/Header/Logo";
import AdminNavbar from "./kurban-admin/components/admin-navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
          <div className="flex m-8 mt-4 gap-4 justify-between items-center">
            <Logo></Logo>
            <AdminNavbar></AdminNavbar>
            <div className="flex items-center space-x-2">
              <ModeToggle></ModeToggle>
              <Avatar className="mr-2 h-5 w-5">
                <AvatarImage
                  src={`https://avatar.vercel.sh/acme-inc.png`}
                  alt="Acme Inc."
                />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="p-4 pt-0">{children}</div>
          {/* </SidebarInset>
          </SidebarProvider> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
