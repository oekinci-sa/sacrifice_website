import Link from "next/link";

export default function OnizlemeTakipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b bg-muted/40 py-2 text-center text-sm text-muted-foreground">
        <Link href="/onizleme" className="text-primary hover:underline">
          ← Tüm anasayfa önizlemeleri
        </Link>
      </div>
      {children}
    </div>
  );
}
