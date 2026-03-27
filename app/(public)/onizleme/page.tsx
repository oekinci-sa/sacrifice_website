import Link from "next/link";

/** DB homepage_mode değeri → önizleme URL eşlemesi */
const PREVIEW_PAGES = [
  {
    href: "/onizleme/anasayfa",
    title: "Satış aktif — klasik anasayfa (live)",
    description:
      "Tam header ve footer; tanıtım bileşenleri. Canlıya `live` modunda geçmeden buradan kontrol edin.",
    highlight: true,
  },
  {
    href: "/onizleme/bana-haber-ver",
    title: "Ön bilgilendirme (bana_haber_ver)",
    description:
      "Duyuru metni ve «Bana Haber Ver» formu — Takip (minimal header) düzeni.",
  },
  {
    href: "/onizleme/geri-sayim",
    title: "Yakında açılıyor (geri_sayim)",
    description: "Geri sayım ve fiyat listesi; hisseal yönlendirmesi kapalı.",
  },
  {
    href: "/onizleme/tesekkur",
    title: "Teşekkür (tesekkur)",
    description: "Hisse tükendi ekranı ve hisse sorgulama — Takip düzeni.",
  },
  {
    href: "/onizleme/takip",
    title: "Kurban takip (follow_up)",
    description: "Kesim takip ekranı — canlıdaki takip sayfasıyla aynı içerik.",
  },
] as const;

export default function OnizlemePage() {
  return (
    <div className="container max-w-2xl py-12 md:py-16">
      <h1 className="text-2xl font-bold mb-2">Anasayfa önizlemesi</h1>
      <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed">
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">homepage_mode</code> değerini
        değiştirmeden, seçili tenant için (host üzerinden) her evrenin nasıl görüneceğini buradan
        açabilirsiniz. Tema ve metinler{" "}
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">tenant_settings</code>
        &apos;ten gelir.
      </p>
      <ul className="flex flex-col gap-4">
        {PREVIEW_PAGES.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className={`block rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                "highlight" in p && p.highlight
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <span className="font-medium text-primary">{p.title}</span>
              <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
