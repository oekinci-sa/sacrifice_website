import Link from "next/link";

export default function OnizlemePage() {
  return (
    <div className="container py-16">
      <h1 className="text-2xl font-bold mb-6">Önizleme</h1>
      <p className="text-muted-foreground mb-8">
        Canlıya almadan önce sayfa içeriklerini önizleyin. DB değişikliği gerektirmez.
      </p>
      <nav className="flex flex-col gap-4">
        <Link href="/onizleme/anasayfa" className="text-primary hover:underline">
          Anasayfa
        </Link>
        <Link href="/onizleme/thanks" className="text-primary hover:underline">
          Teşekkürler
        </Link>
        <Link href="/onizleme/takip" className="text-primary hover:underline">
          Takip
        </Link>
      </nav>
    </div>
  );
}
