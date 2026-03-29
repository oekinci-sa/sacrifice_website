import { ThemeStyles } from "@/components/theme/ThemeStyles";
import { Toaster } from "@/components/ui/toaster";
import { publicSiteOriginFromWebsiteUrl } from "@/lib/email-logo-url";
import { getTenantBranding } from "@/lib/tenant-branding";
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers/providers";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const DEFAULT_METADATA: Metadata = {
  title: "Ankara Kurban Hisse Organizasyonu",
  description:
    "İMH Ankara Kurban organizasyonu olarak, bu mukaddes ibadeti huzurla ve gönül rahatlığıyla yerine getirin. Allah’a sadece takvanız ulaşır…",
  /** Host’a göre dinamik: `lib/tenant-favicon.ts` → `/icon` ve `/favicon.ico` */
  icons: {
    icon: "/icon",
    shortcut: "/favicon.ico",
  },
};

const ELYA_OG_IMAGE = "/logos/elya-hayvancilik/elya-hayvancilik-circular.png";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding();
  if (branding.logo_slug === "elya-hayvancilik") {
    const elyaTitle = "Elya Hayvancılık Kurban Organizasyonu";
    const elyaDescription =
      "Elya Hayvancılık Kurban organizasyonu olarak, bu mukaddes ibadeti huzurla ve gönül rahatlığıyla yerine getirin. Allah'a sadece takvanız ulaşır…";

    const originHttps = publicSiteOriginFromWebsiteUrl(branding.website_url);
    let metadataBase: URL | undefined;
    if (originHttps) {
      try {
        metadataBase = new URL(originHttps);
      } catch {
        metadataBase = undefined;
      }
    }

    return {
      ...DEFAULT_METADATA,
      title: elyaTitle,
      description: elyaDescription,
      /** Tarayıcı sekmesi / arama sonuçları ikonu: `lib/tenant-favicon.ts` → PNG (header logoları değişmez). */
      icons: {
        icon: [{ url: "/icon", type: "image/png" }],
        shortcut: "/favicon.ico",
      },
      ...(metadataBase
        ? {
            metadataBase,
            openGraph: {
              title: elyaTitle,
              description: elyaDescription,
              images: [
                {
                  url: ELYA_OG_IMAGE,
                  width: 512,
                  height: 512,
                  alt: "Elya Hayvancılık",
                },
              ],
            },
            twitter: {
              card: "summary",
              title: elyaTitle,
              description: elyaDescription,
              images: [ELYA_OG_IMAGE],
            },
          }
        : {}),
    };
  }
  return DEFAULT_METADATA;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        {/* Sunucu tarafı tema enjeksiyonu: ilk paint'te doğru tenant renkleri (FOUC önleme) */}
        <ThemeStyles />
      </head>
      <body className={`${instrumentSans.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
