# E-posta (Resend) ve HTML içerik

## Admin: toplu / tek tek mail (`app/api/admin/send-email`)

- Mesaj gövdesi sunucuda **sanitize** edilir: `lib/mail-rich-text.ts` → `buildInstrumentSansEmailDocument` ile tam HTML + Google Fonts Instrument Sans (`lib/email-font-stack.ts`).
- **Önemli:** `isomorphic-dompurify` kullanılmamalı. Paket, Vercel production’da `ERR_REQUIRE_ESM` üretebilir (DOM Purify ESM-only). Kalıcı çözüm: **`sanitize-html`**.
- İlgili Cursor kuralı: `.cursor/rules/email-html-sanitize-and-logos.mdc`.

## Transactional: işlem özeti, hisse sorgula özeti

- Şablon: `lib/emails/purchase-confirmation-html.ts`, gönderim: `app/api/purchase-confirmation-email`, `app/api/send-shareholder-lookup-summary`.
- **İşlem özeti (Hisse Al sonrası) e-posta tipografisi:** Google Fonts’tan Instrument Sans (`lib/email-font-stack.ts`) + `<style>` ve `body` inline ile yedek font yığını; tüm istemcilerde yükleme garantisi yok.
- **Logo:** Gmail ve benzeri istemciler e-postada **`data:image/...;base64`** `<img src>` kaynaklarını genelde göstermez. Bu yüzden üretimde logo **`https://www.<tenant_domain>/logos/<logo_slug>/email-logo.png`** ile verilir (`lib/email-logo-url.ts`, `tenant_settings.website_url` tabanlı).
- Statik dosyalar: `public/logos/<slug>/email-logo.png`. İçerik `lib/logoBase64.ts` ile hizalı tutulmak için: `node scripts/write-email-logo-pngs.cjs`.
- PDF / react-pdf tarafında (`ReceiptPDF`) base64 kullanımı sorun değil; sadece **HTML e-posta** için HTTPS PNG kuralı geçerlidir.

## Resend

- Ortam: `RESEND_API_KEY`; tenant başına yapılandırma `lib/resend-client.ts` içinde özetlenir.
