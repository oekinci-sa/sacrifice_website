# Admin Sayfaları

Admin paneli birden fazla admin tarafından yönetilebilir.

## Tema ve Realtime

- **Admin tema**: Nötr gri UI; badge ve CTA butonları tenant renginde. Detay: [colors.md](../colors.md)
- **Rezervasyonlar**: Supabase Realtime ile badge ve tablo anında güncellenir.

## Tablolar (CustomDataTable)

- Liste sayfalarında **`storageKey`** zorunlu: sütun görünürlüğü ve sıra kullanıcıya özel `localStorage`’da tutulur; başlıktan sütun taşıma aktif olur.
- Uyumsuz hisseler gibi **aynı sayfada iki tablo** varsa sekme başına ayrı `storageKey` (örn. bilinmeyenler / bilinenler).
- Detay: [changelogs/changelog-2026-03-admin-column-reorder.md](../changelogs/changelog-2026-03-admin-column-reorder.md).

## Sayfa Listesi

### /kurban-admin/genel-bakis
Genel bilgiler: hayvan sayısı, toplanan para vb. Grafik ve tablo görselleştirmeleri.

### /kurban-admin/kurbanliklar
- Grafikler
- **Kurbanlıklar** tablosu (menü adı = sayfa başlığı) ve detay sayfalarına erişim
- Silme: `DELETE /api/sacrifices/[id]` → `rpc_delete_sacrifice` (`app.actor` = oturum e-postası; ilişkili hissedar silme kayıtları dahil)
- Ödeme durumu popup: 2 sütun, 1-2-3-4 etiketleri; hissedarı olmayan hayvanda popup açılmaz

### /kurban-admin/kurbanliklar/ayrintilar/[id]
Belirli kurbanlığın hissedarlar tablosu ve hissedar detay sayfalarına erişim.

### /kurban-admin/hissedarlar
- Grafikler
- **Hissedarlar** tablosu (menü adı = sayfa başlığı) ve detay sayfalarına erişim

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

### /kurban-admin/kullanici-yonetimi
Kullanıcı yönetimi (admin, editor vb.).

### /kurban-admin/degisiklik-kayitlari
Değişiklik kayıtlarının görüntülendiği sayfa.

### /kurban-admin/asama-metrikleri
**Aşama Metrikleri** tablosu (`stage_metrics`). Okuma: GET /api/get-stage-metrics. Sıra numarası güncelleme: POST /api/update-stage-metrics (`rpc_update_stage_metrics`, değişiklik kaydı).

### /kurban-admin/tenant-ayarlari
Organizasyon ayarları (sadece super_admin).
