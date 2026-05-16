# Admin Sayfaları

Admin paneli birden fazla admin tarafından yönetilebilir.

## Tema ve Realtime

- **Admin tema**: Nötr gri UI; badge ve CTA butonları tenant renginde. Detay: [colors.md](../colors.md)
- **Rezervasyonlar**: Supabase Realtime ile badge ve tablo anında güncellenir.

## Tablolar (CustomDataTable)

- Liste sayfalarında **`storageKey`** zorunlu: sütun görünürlüğü ve sıra kullanıcıya özel `localStorage`’da tutulur; başlıktan sütun taşıma aktif olur.
- Uyumsuz hisseler gibi **aynı sayfada iki tablo** varsa sekme başına ayrı `storageKey` (örn. bilinmeyenler / bilinenler).
- Detay: [changelogs/changelog-2026-03-admin-column-reorder.md](../changelogs/changelog-2026-03-admin-column-reorder.md).
- **Sütun / filtre / Excel metinleri:** Kurbanlıklar, Tüm Hissedarlar, Ödemeler ve Uyumsuz hisseler listelerinde başlık ve filtre etiketleri `lib/admin-table-column-labels/` altında tek kaynakta tutulur. Detay: [changelogs/changelog-2026-04-admin-table-column-labels.md](../changelogs/changelog-2026-04-admin-table-column-labels.md).

## Sayfa Listesi

### /kurban-admin/genel-bakis

Genel bilgiler: hayvan sayısı, toplanan para vb. Grafik ve tablo görselleştirmeleri.

### /kurban-admin/kurbanliklar

- Grafikler
- **Kurbanlıklar** tablosu (menü adı = sayfa başlığı) ve detay sayfalarına erişim
- Silme: `DELETE /api/sacrifices/[id]` → `rpc_delete_sacrifice` (`app.actor` = oturum e-postası; ilişkili hissedar silme kayıtları dahil)
- Ödeme durumu popup: 2 sütun, 1-2-3-4 etiketleri; hissedarı olmayan hayvanda popup açılmaz

### /kurban-admin/kurbanliklar/ayrintilar/[id]

Belirli kurbanlığın hissedar özeti; **Tüm Hissedarlar** ve SMS geçmişine yönlendirme.

### /kurban-admin/hissedarlar/tum-hissedarlar

- **Menü ile eş**: **Hissedarlar** başlığı; liste `CustomDataTable` (`storageKey="hissedarlar"`).
- **SMS görünümü:** Yalnız `tenant_settings.sms_enabled === true` iken `sms_history` sütunu tablo tanımına eklenir (`getColumns(smsEnabled)`). **Varsayılan sütun sırası:** SMS sütunu **PDF sütununun solunda**; kullanıcı sütun sırasını yerel olarak değiştirebilir (localStorage).
- **SMS geçmiş paneli:** Satır aksiyonu / SMS hücresi → sağdan sheet (`shareholder-sms-timeline-sheet`). Veri `GET /api/admin/sms/shareholder-history`. Listede `skipped` alıcı satırları gösterilmez; tam kişisel metin; durum rozeti ve SMS boy sayısı gösterimi yok. Yeni SMS: şablon veya elle → `POST /api/admin/sms/send` tekil hissedar.

### /kurban-admin/hissedarlar/odemeler

Ödeme analizi ve filtreleri.

### /kurban-admin/teslimatlar

Teslimat yönetimi.

### /kurban-admin/rezervasyonlar

**Realtime**: Supabase `postgres_changes` ile tablo anında güncellenir. reservation_transactions tablosu.

### /kurban-admin/uyumsuz-hisseler

Uyumsuz hisseler (mismatched_shares). Aktif rezervasyonu olan hayvanlar listeden çıkarılır.

### /kurban-admin/iletisim-mesajlari

İletişim mesajları.

### /kurban-admin/reminder-talepleri

Bana Haber Ver talepleri.

### /kurban-admin/sms-islemleri

Görünür yalnızca `tenant_settings.sms_enabled === true` ise (sidebar). Tekil/toplu gönderim; şablon; önizleme diyalogu (mükerrer açıklaması cep numarası + kurban kapsamı, isim kullanılmaz); gönderim sonrası toast’ta geçersiz/mükerrer dışlanma sayıları. Gerçek API gönderimi `lib/sms-config.ts` + env ile bağlıdır (`getSmsCredentials`).

### /kurban-admin/sms-islemleri/sablonlari

SMS şablon CRUD: başlık, kategori (genel/odeme/kesim/teslimat/bilgilendirme), mesaj içeriği, değişken butonları, aktif/pasif toggle. Soft delete. İlk yüklemede yalnız aktif şablonlar; «Pasif şablonları da göster» ile pasifler aktiflerin altında listelenir (`GET /api/admin/sms/templates?inactive=true`).

### /kurban-admin/sms-islemleri/kayitli-toplu-gonderimleri

Hazırlayıp kaydedilen toplu gönderimler (`status=draft`). **Menüde yok**; doğrudan URL ile erişim. Staleness uyarısı (>2 gün). Gönder butonu.

### /kurban-admin/sms-islemleri/gecmis

Gönderim geçmişi tablosu. Detay sheet: per-recipient durum, atlanma sebebi. Durumlar operatöre iletimi ifade eder (DLR takibi yok).

### /kurban-admin/sms-islemleri/ayarlar

API özeti (`api.sms.bizimsms.mobi`), kredi/originator, test gönderimi. **Sidebar:** admin, editor ve süper admin. `GET /api/admin/sms/credit` ve `GET /api/admin/sms/originators` aynı rol seti. Bazı bloklar klasik monospace yerine tema fontunda tutulmuş olabilir (env’de kullanıcı adı gösterilmez).

### /kurban-admin/mail-islemleri

Panel ve hissedar e-posta listeleri; konu/HTML ile toplu gönderim (`GET /api/admin/email-recipients`, `POST /api/admin/send-email`). Ortam: `RESEND_API_KEY`, isteğe bağlı `RESEND_FROM_EMAIL`.

### /kurban-admin/kullanici-yonetimi

Kullanıcı yönetimi (admin, editor vb.).

### /kurban-admin/degisiklik-kayitlari

Değişiklik kayıtlarının görüntülendiği sayfa.

### /kurban-admin/asama-metrikleri

**Aşama Metrikleri** tablosu (`stage_metrics`). Okuma: GET /api/get-stage-metrics. Sıra numarası güncelleme: POST /api/update-stage-metrics (`rpc_update_stage_metrics`, değişiklik kaydı).

### /kurban-admin/tenant-ayarlari

**Sadece super_admin.** Tenant başına tema, iletişim, IBAN, sözleşme metni, kapora tarihleri vb. Liste: `GET /api/admin/tenant-settings`. Satır güncelleme: `PATCH /api/admin/tenant-settings/[tenantId]`.

**SMS modülü (`sms_enabled`):** Tabloda **SMS** sütunu — `SmsEnabledToggleCell` ile anahtarlama; PATCH ile kalıcı. Bu bayrak sidebar’daki **SMS İşlemleri** menüsünü ve Tüm Hissedarlar’da **`sms_history` sütununu** kontrol eder (varsayılan konum PDF’in solunda). Gönderimin çalışması ayrıca `lib/sms-config.ts` + Bizim SMS env ile mümkündür.

Ayrıntı: [sms-admin-and-tenant-flag.md](../sms-admin-and-tenant-flag.md).
