# Mimari Özet

## Çoklu Tenant

- **Çözümleme:** `lib/tenant-resolver.ts` → `resolveTenantIdFromHost(host)`
- **Middleware:** host → `x-tenant-id` header
- **API:** Her route `getTenantId()` ile tenant filtresi

### Port Bazlı Geliştirme (Local)

| Port | URL | Tenant |
|------|-----|--------|
| 3000 | `http://localhost:3000` | Gölbaşı |
| 3001 | `http://localhost:3001` | Kahramankazan |
| 3002 | `http://localhost:3002` | Test (Gölbaşı) |

**Komutlar:** `npm run dev:golbasi`, `dev:kahramankazan`, `dev:test`, `dev:all`

### Google OAuth Redirect URI
- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3001/api/auth/callback/google`
- `http://localhost:3002/api/auth/callback/google`

## Auth

- NextAuth v4, JWT, Credentials + Google OAuth
- Redirect callback: request host kullanır
- Session: `tenant_id` header'dan eklenir

## Uygulama Yapısı

```
app/
├── (auth)/giris/
├── (admin)/kurban-admin/
├── (public)/          # ana sayfa, hisseal, hissesorgula, yazilar, iletisim
└── (takip)/           # kesimsirasi, parcalamasirasi, teslimatsirasi
```
