# Renk Yönetimi (ZORUNLU)

**Yasak:** Hex (#xxx), rgb(), rgba(), `bg-[#xxx]`, `text-[#xxx]` vb. hardcoded/arbitrary renk kullanımı.

**Kaynak:** Renk paleti için `app/globals.css` ve `tailwind.config.ts` dosyalarına bak. Kafana göre renk ekleme.

## Proje renk token'ları (globals.css + tailwind.config.ts)

| Kullanım | Token | Örnek |
|----------|-------|-------|
| Yeşil (status/başarı) | sac-green, sac-green-lightest | text-sac-green, bg-sac-green-lightest |
| Kırmızı (hata/uyarı) | sac-red, sac-red-light | text-sac-red, bg-sac-red-light |
| Sarı (beklemede) | sac-yellow, sac-yellow-light | text-sac-yellow, bg-sac-yellow-light |
| Mavi (bilgi/link) | sac-blue, sac-blue-light | text-sac-blue, bg-sac-blue-light |
| Primary (buton/CTA) | primary | bg-primary, text-primary |
| Primary disabled | primary-muted | disabled:bg-primary-muted |
| İkon/avatar yeşil | sac-icon-green, sac-avatar-bg | text-sac-icon-green, bg-sac-avatar-bg |
| Ek: sac-icon-light-green, sac-icon-bg-green | tailwind.config.ts | |
| Form border (yeşilimsi) | sac-border-light | border-sac-border-light |
| Form border (mavimsi) | sac-border-blue | border-sac-border-blue |
| Label/metin (soluk yeşil) | sac-muted-green | text-sac-muted-green |
| Form kart arka planı | sac-form-bg | bg-sac-form-bg |
| Grafik yeşil tonları | sac-graph-green-tone-* | Grafik bileşenlerinde |
| Section arka planı | sac-section-background | |

## Shadcn/Genel token'lar
- Arka plan: bg-background, bg-card, bg-muted
- Metin: text-foreground, text-muted-foreground
- Hata: text-destructive, bg-destructive
- Border: border-border, border-input

## Yeni renk ihtiyacı
Listede yoksa kullanıcıya sor; kafana göre hex/arbitrary renk ekleme.
