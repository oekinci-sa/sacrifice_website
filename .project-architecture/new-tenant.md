# Yeni Tenant Ekleme Rehberi

Yeni bir tenant (dernek/site) eklendiğinde aşağıdaki adımlar sırayla yapılmalıdır.

---

## 1. Veritabanı (Supabase)

### 1.1 `tenants` tablosuna kayıt

Yeni tenant için UUID ve slug belirle. Örnek: `yenidernek` slug'ı ile.

```sql
INSERT INTO tenants (id, slug, name) VALUES
  ('00000000-0000-0000-0000-000000000004', 'yenidernek', 'Yeni Dernek Adı')
ON CONFLICT (id) DO NOTHING;
```

- `id`: Benzersiz UUID (örnekte 04 = 4. tenant)
- `slug`: Küçük harf, tire ile (örn. `yenidernek`, `keciboren`)
- `name`: Görünen ad

### 1.2 `tenant_domains` tablosuna domain

```sql
INSERT INTO tenant_domains (tenant_id, domain, is_primary) VALUES
  ('00000000-0000-0000-0000-000000000004', 'yenidernek.localhost', true)
ON CONFLICT (domain) DO NOTHING;
```

Production domain’i varsa ayrıca ekle:

```sql
INSERT INTO tenant_domains (tenant_id, domain, is_primary) VALUES
  ('00000000-0000-0000-0000-000000000004', 'yenidernek.com.tr', false)
ON CONFLICT (domain) DO NOTHING;
```

### 1.3 `tenant_settings` tablosuna tema

`tenant_settings` tablosunda her tenant için bir satır olmalı. `theme_json` tema renklerini tutar.

```sql
INSERT INTO tenant_settings (tenant_id, theme_json) VALUES
  ('00000000-0000-0000-0000-000000000004', '{}'::jsonb)
ON CONFLICT (tenant_id) DO NOTHING;
```

Tema renkleri için `colors.md` içindeki örnekleri kullan. Örnek (yeşil tema):

```json
{
  "primary": "142 71% 45%",
  "primary-dark": "142 71% 38%",
  "secondary": "142 39% 94%",
  "sidebar-primary": "142 71% 45%",
  "sac-primary": "#16a34a",
  "sac-primary-lightest": "#E8F5E9",
  "sac-icon-primary": "#16a34a",
  "sac-avatar-bg": "#E8F5E9",
  "sac-muted": "#64748b",
  "sac-border-light": "#BBF7D0",
  "sac-icon-light": "#BBF7D0",
  "sac-icon-bg": "#E8F5E9",
  "sac-primary-muted": "rgb(22 163 74 / 0.2)"
}
```

### 1.4 `stage_metrics` tablosuna satırlar

Aşama metrikleri sayfası için her tenant için 3 aşama satırı eklenmeli:

```sql
INSERT INTO stage_metrics (tenant_id, stage) VALUES
  ('00000000-0000-0000-0000-000000000004', 'slaughter_stage'),
  ('00000000-0000-0000-0000-000000000004', 'butcher_stage'),
  ('00000000-0000-0000-0000-000000000004', 'delivery_stage')
ON CONFLICT (tenant_id, stage) DO NOTHING;
```

---

## 2. Kod (lib/tenant-resolver.ts)

### 2.1 Tenant ID sabiti

Dosyanın başına yeni tenant sabitini ekle:

```ts
const YENIDERNEK_TENANT_ID = "00000000-0000-0000-0000-000000000004";
```

### 2.2 Port map

Yeni port için eşleme ekle (varsayılan: 3003 = 4. tenant):

```ts
// portMap içine:
"localhost:3003": YENIDERNEK_TENANT_ID,
"127.0.0.1:3003": YENIDERNEK_TENANT_ID,
```

### 2.3 Subdomain map (local geliştirme)

```ts
// subdomainMap içine:
"yenidernek.localhost": YENIDERNEK_TENANT_ID,
```

### 2.4 Production domain map

Production domain varsa ekle:

```ts
// productionDomainMap içine:
"yenidernek.com.tr": YENIDERNEK_TENANT_ID,
"www.yenidernek.com.tr": YENIDERNEK_TENANT_ID,
"yenidernek.com": YENIDERNEK_TENANT_ID,
"www.yenidernek.com": YENIDERNEK_TENANT_ID,
```

---

## 3. Middleware (middleware.ts)

### 3.1 Subdomain → port yönlendirmesi (OAuth)

OAuth ile local subdomain kullanılıyorsa `SUBDOMAIN_TO_PORT` map’ine ekle:

```ts
const SUBDOMAIN_TO_PORT: Record<string, number> = {
  "golbasi.localhost": 3000,
  "kahramankazan.localhost": 3001,
  "yenidernek.localhost": 3003,  // yeni ekleme
};
```

---

## 4. package.json

### 4.1 Dev script

Yeni port için script ekle:

```json
"dev:yenidernek": "cross-env NEXTAUTH_URL=http://localhost:3003 next dev -p 3003"
```

### 4.2 dev:all (birden fazla tenant)

`dev:all` script’ine yeni tenant’ı ekle:

```json
"dev:all": "concurrently -n \"test,kahramankazan,golbasi,yenidernek\" -c \"blue,green,yellow,cyan\" \"cross-env NEXTAUTH_URL=http://localhost:3000 next dev -p 3000\" \"cross-env NEXTAUTH_URL=http://localhost:3001 next dev -p 3001\" \"cross-env NEXTAUTH_URL=http://localhost:3002 next dev -p 3002\" \"cross-env NEXTAUTH_URL=http://localhost:3003 next dev -p 3003\""
```

---

## 5. Kullanıcı Yönetimi – "Diğer siteye de ekle" (app/api/users/[id]/status/route.ts)

`getOtherTenantId` fonksiyonu şu anda sadece Kahramankazan ve Gölbaşı için tanımlı. **3. tenant eklendiğinde** bu mantık değiştirilmeli:

- Seçenek A: "Diğer siteye de ekle" yerine "Diğer sitelere ekle" checkbox listesi
- Seçenek B: "Diğer siteye de ekle" sadece 2 tenant için kalsın; 3+ tenant’ta bu özellik kaldırılır veya genişletilir

Yeni tenant için bu fonksiyon güncellenmediyse sadece mevcut 2 tenant arasında çalışır.

---

## 6. Vercel (Production)

Domain production’da kullanılacaksa:

1. **Vercel → Settings → Domains**: `yenidernek.com.tr` ve `www.yenidernek.com.tr` ekle
2. **DNS**: Domain’i Vercel’e yönlendir (CNAME veya A kaydı)
3. **OAuth**: Google vb. varsa callback URL’lerinde `https://yenidernek.com.tr/api/auth/callback/google` ekle

---

## 7. Kontrol Listesi

- [ ] `tenants` tablosuna INSERT
- [ ] `tenant_domains` tablosuna INSERT (local + production)
- [ ] `tenant_settings` tablosuna INSERT (theme_json)
- [ ] `stage_metrics` tablosuna satırlar (3 aşama)
- [ ] `lib/tenant-resolver.ts`: sabit, portMap, subdomainMap, productionDomainMap
- [ ] `middleware.ts`: SUBDOMAIN_TO_PORT (varsa)
- [ ] `package.json`: dev:yenidernek, dev:all
- [ ] `app/api/users/[id]/status/route.ts`: getOtherTenantId (3+ tenant için)
- [ ] Vercel domain’leri (production)
- [ ] `controls.md` kontrol listesi ile test

---

## Mevcut Tenant Referansı

| Tenant | ID (son 2 hane) | Port | Slug |
|--------|-----------------|------|------|
| Test | 01 | 3000 | test |
| Kahramankazan | 02 | 3001 | kahramankazan |
| Gölbaşı | 03 | 3002 | golbasi |
