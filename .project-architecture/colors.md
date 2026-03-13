# Renk Yönetimi (ZORUNLU)

**Yasak:** Hex (#xxx), rgb(), rgba(), `bg-[#xxx]`, `text-[#xxx]` vb. hardcoded/arbitrary renk kullanımı.

**Kaynak:** Renk paleti için `app/globals.css` ve `tailwind.config.ts` dosyalarına bak. Kafana göre renk ekleme.

## Tenant Tema Override (DB)

Tenant bazlı tema renkleri `tenant_settings.theme_json` ile saklanır.

### Tema Enjeksiyon Akışı (Sunucu Tarafı – FOUC Önleme)

Tema **ilk HTML yanıtında** sunucu tarafında enjekte edilir. Böylece tarayıcı ilk paint'te doğru tenant renklerini görür; varsayılan shadcn temasından tenant temasına geçiş (flash) olmaz.

| Bileşen | Rol |
|---------|-----|
| **ThemeStyles** (`components/theme/ThemeStyles.tsx`) | Server Component. `headers()` ile tenant_id okur, `tenant_settings.theme_json` çeker, `:root { --primary: ...; }` inline style olarak `<head>` içine yazar |
| **app/layout.tsx** | `<head>` içinde `<ThemeStyles />` render eder |
| **ThemeProvider** | Geçmişte client-side fetch yapıyordu; artık passthrough. Tema sunucuda enjekte edildiği için client fetch kaldırıldı |
| **`/api/tenant-settings`** | API route; tema değişikliği gerektiren diğer kullanımlar için (örn. admin önizleme) mevcut |

**Desteklenen theme_json anahtarları:**
- **HSL formatı** (örn. `"142 71% 45%"`): `primary`, `primary-foreground`, `primary-dark`, `primary-muted`, `secondary`, `secondary-foreground`, `sidebar-*`
- **Hex/rgb formatı** (tenant tema rengine göre): `sac-primary`, `sac-primary-lightest`, `sac-icon-primary`, `sac-avatar-bg`, `sac-muted`, `sac-border-light`, `sac-icon-light`, `sac-icon-bg`, `sac-primary-muted`

**İlk yükleme:** `ThemeStyles` sunucuda HTML içinde tema değişkenlerini enjekte ettiği için ilk paint'te doğru tenant teması görünür. `theme_json` boşsa `globals.css` varsayılanları kullanılır.

**Örnek (Gölbaşı mavi tema):**
```json
{
  "primary": "210 71% 45%",
  "primary-dark": "210 71% 38%",
  "secondary": "210 39% 94%",
  "sidebar-primary": "210 71% 45%",
  "sac-primary": "#2563eb",
  "sac-primary-lightest": "#EFF6FF",
  "sac-icon-primary": "#2563eb",
  "sac-avatar-bg": "#EFF6FF",
  "sac-muted": "#64748b",
  "sac-border-light": "#BFDBFE",
  "sac-icon-light": "#BFDBFE",
  "sac-icon-bg": "#EFF6FF",
  "sac-primary-muted": "rgb(37 99 235 / 0.2)"
}
```

**Varsayılan:** `theme_json` boş veya anahtar yoksa `app/globals.css` içindeki `:root` nötr gri değerleri kullanılır. Test ve Kahramankazan tenant'larında yeşil tema override edilir.

## Proje renk token'ları (globals.css + tailwind.config.ts)

| Kullanım | Token | Örnek |
|----------|-------|-------|
| Primary (status/başarı) – tenant override edebilir | sac-primary, sac-primary-lightest | text-sac-primary, bg-sac-primary-lightest |
| Ödeme tamamlandı / başarı göstergesi | sac-primary | bg-sac-primary, text-sac-primary |
| Kırmızı (hata/uyarı) | sac-red, sac-red-light | text-sac-red, bg-sac-red-light |
| Sarı (beklemede) | sac-yellow, sac-yellow-light | text-sac-yellow, bg-sac-yellow-light |
| Mavi (bilgi/link) | sac-blue, sac-blue-light | text-sac-blue, bg-sac-blue-light |
| Primary (buton/CTA) | primary | bg-primary, text-primary |
| Primary disabled | primary-muted | disabled:bg-primary-muted |
| İkon/avatar – tenant override edebilir | sac-icon-primary, sac-avatar-bg | text-sac-icon-primary, bg-sac-avatar-bg |
| Ek: sac-icon-light, sac-icon-bg | tenant override edebilir | |
| Form border (tema rengine göre) | sac-border-light | border-sac-border-light |
| Form border (mavimsi) | sac-border-blue | border-sac-border-blue |
| Label/metin (soluk) – tenant override edebilir | sac-muted | text-sac-muted |
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
