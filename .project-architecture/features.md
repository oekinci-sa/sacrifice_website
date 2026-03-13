# Component Features


---

## Sidebar
- Dar ve geniş görünüm.
- Dar modda ikonlar görünür.
- Giriş yapan kullanıcı bilgisi sol alt; dark/light mode seçimi.

## Türkçe UI
- Tüm kullanıcıya görünen metinler Türkçe (label, buton, placeholder, tooltip).
- Varsayılan İngilizce bırakma: Submit, Cancel, Search vb.
- Terminoloji tutarlı; Türkçe karakterler doğru (Ş, İ, Ğ, Ü, Ö, Ç).

## Bana Haber Ver (Takip sayfası)
- `reminder_requests` tablosu: tenant_id, name, phone (tenant+phone unique)
- POST /api/reminder-requests, GET /api/reminder-requests/check
- Daha önce kayıtlıysa uyarı toast, yoksa kayıt + başarı toast

## Admin Tablo Sayfaları
- **Rezervasyonlar** (`/kurban-admin/rezervasyonlar`): reservation_transactions tablosu (tenant kapsamlı)
- **Aşama Metrikleri** (`/kurban-admin/asama-metrikleri`): stage_metrics tablosu (tenant kapsamlı)
