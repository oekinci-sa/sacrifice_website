"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Alt önizleme sayfalarında menüye dönüş; kök /onizleme listesinde şerit gösterilmez.
 */
export default function OnizlemePublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isIndex = pathname === "/onizleme";

  return (
    <div>
      {!isIndex && (
        <div className="border-b bg-muted/40 py-2 text-center text-sm text-muted-foreground">
          <Link href="/onizleme" className="text-primary hover:underline">
            ← Tüm anasayfa önizlemeleri
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
