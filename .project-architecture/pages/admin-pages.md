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
- **Infinite scroll + kayıt sayısı:** Tüm Kurbanlıklar `infiniteScroll` kullanır; tablo altında «Toplam X adet sonuç bulundu» (henüz yüklenmemiş satırlar varsa «Y satır görüntüleniyor»). Sayfalı tablolarda (örn. Tüm Hissedarlar) tam footer (`CustomDataTableFooter`) korunur. Detay: [changelogs/changelog-2026-05-admin-table-ux-sms-picker.md](../changelogs/changelog-2026-05-admin-table-ux-sms-picker.md).

## Sayfa Listesi

### /kurban-admin/genel-bakis

Genel bilgiler: hayvan sayısı, toplanan para vb. Grafik ve tablo görselleştirmeleri.

### /kurban-admin/kurbanliklar

- Grafikler
- **Kurbanlıklar** tablosu (menü adı = sayfa başlığı) ve detay sayfalarına erişim
- **Alt menü:** Tüm Kurbanlıklar (`/tum-kurbanliklar`), **Kurban Günü İstatistikleri** (`/kurban-gunu-istatistikleri`)
- Silme: `DELETE /api/sacrifices/[id]` → `rpc_delete_sacrifice` (`app.actor` = oturum e-postası; ilişkili hissedar silme kayıtları dahil)
- Ödeme durumu popup: 2 sütun, 1-2-3-4 etiketleri; hissedarı olmayan hayvanda popup açılmaz

### /kurban-admin/kurbanliklar/tum-kurbanliklar

- **Kurbanlıklar** ana liste tablosu (`storageKey="kurbanliklar"`).
- **Infinite scroll:** İlk 50 satır, kaydırınca +50 (`infiniteScroll={{ initialCount: 50, step: 50 }}`).
- **Alt bilgi:** Filtrelenmiş toplam kayıt sayısı («Toplam X adet sonuç bulundu»); tüm satırlar henüz yüklenmediyse görünen satır sayısı notu.
- **Filtreler:** Kurban No, Hisse Bilgisi (`share_price`), Boş Hisse, Cins, Referans, Ödeme; arama yalnızca notlar sütununda.

### /kurban-admin/kurbanliklar/kurban-gunu-istatistikleri

Kurban günü operasyon paneli (editor+).

| Bölüm | Veri / API |
|-------|------------|
| Aşama durumu | `GET /api/get-stage-metrics` — 3 kart (sıra no, ort. süre) |
| Kurbanlıklar tablosu | `GET /api/get-sacrifice-animals` — kesim/parçalama/teslimat saatleri |
| Arıza kayıtları | `GET/POST /api/admin/stage-downtime`, `PUT/DELETE .../[id]` → `stage_downtime_events` |
| Arıza duyurusu | `GET/PUT /api/admin/incident-banner` → `tenant_settings.incident_banner_*` |

Arıza kayıtları `update_stage_metrics` tetikleyicilerinde ortalama süreden düşülür (aşamaya göre cascade). Detay: [changelog-2026-05-kurban-gunu-istatistikleri.md](../changelogs/changelog-2026-05-kurban-gunu-istatistikleri.md).

**Kaldırıldı:** `/kurban-admin/asama-metrikleri` (içerik bu sayfaya taşındı).

### /kurban-admin/kurbanliklar/ayrintilar/[id]

Belirli kurbanlığın hissedar özeti; **Tüm Hissedarlar** ve SMS geçmişine yönlendirme.

### /kurban-admin/hissedarlar/tum-hissedarlar

- **Menü ile eş**: **Hissedarlar** başlığı; liste `CustomDataTable` (`storageKey="hissedarlar"`).
- **SMS görünümü:** Yalnız `tenant_settings.sms_enabled === true` iken `sms_history` sütunu tablo tanımına eklenir (`getColumns(smsEnabled)`). **Varsayılan sütun sırası:** SMS sütunu **PDF sütununun solunda**; kullanıcı sütun sırasını yerel olarak değiştirebilir (localStorage).
- **Kesim / teslim saati:** `sacrifice_time`, `planned_delivery_time` — kurban join’inden `HH:MM`; **varsayılan gizli** (`columnVisibility`); Sütunlar popover ile açılır.
- **Hisse Bilgisi:** Sütun başlığından sıralanabilir (sabit fiyat / canlı baskül toplamına göre). Toolbar’da **Hisse Bilgisi** faceted filtresi — verideki `share_price` kademelerine göre (Kurbanlıklar tablosu ile aynı mantık; canlı baskül satırları filtre seçeneklerinde yok).
- **SMS geçmiş paneli:** Satır aksiyonu / SMS hücresi → sağdan sheet (`shareholder-sms-timeline-sheet`). Veri `GET /api/admin/sms/shareholder-history`. Listede `skipped` alıcı satırları gösterilmez; tam kişisel metin; durum rozeti ve SMS boy sayısı gösterimi yok. Yeni SMS: şablon veya elle → `POST /api/admin/sms/send` tekil hissedar.

### /kurban-admin/hissedarlar/odemeler

Ödeme analizi ve filtreleri. **Ödenen tutar** inline düzenleme → `POST /api/update-shareholder`; `sms_enabled` açıksa aktif `payment_amount_updated` şablonu ile otomatik SMS (`lib/sms-payment-notification.ts`, sunucu tarafı).

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

**Gönderim tipi «Hissedarlardan seç» (`shareholder_pick`):** `SmsShareholderPicker` — `GET /api/admin/sms/shareholder-search` ile sayfalı arama (kurban no → isim sırası); dropdown’da infinite scroll. Seçilen hissedarlar doğrudan alıcı listesine dönüştürülür (`/api/admin/sms/recipients` çağrılmaz).

### /kurban-admin/sms-islemleri/sablonlari

SMS şablon CRUD: başlık, kategori (genel/odeme/kesim/teslimat/bilgilendirme), mesaj içeriği, değişken butonları, aktif/pasif toggle, **otomatik gönderim** (`event_key` — manuel, kurban günü event’leri veya `payment_amount_updated`). Soft delete.

**Liste filtresi:** Toolbar **Şablonları filtrele** popover — çoklu seçim:

| Seçenek | İçerik |
|---------|--------|
| Sizin yazdıklarınız | Aktif manuel (`event_key` NULL) |
| Otomatik SMS'ler | Aktif otomatik (`event_key` dolu) |
| Pasif SMS'ler | Pasif tüm şablonlar |

Varsayılan: üç seçenek de işaretli. Aktif + pasif listeler ilk yüklemede birlikte gelir.

**Düzenleme diyalogu:** `event_key` Select — gruplar: Kurban günü (sıra sayfaları), Ödeme. Otomatik değişken butonları yalnızca kurban günü event’lerinde görünür.

Kurban günü otomatik gönderimin açık/kapalı ayarı bu sayfada değil; Organizasyon Ayarları **Oto. SMS** sütunu.

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

### /kurban-admin/tenant-ayarlari

**Sadece super_admin.** Tenant başına tema, iletişim, IBAN, sözleşme metni, kapora tarihleri vb. Liste: `GET /api/admin/tenant-settings`. Satır güncelleme: `PATCH /api/admin/tenant-settings/[tenantId]`.

**SMS modülü (`sms_enabled`):** Tabloda **SMS** sütunu — `SmsEnabledToggleCell`. Sidebar **SMS İşlemleri** + Tüm Hissedarlar `sms_history` (PDF’in solunda varsayılan).

**Otomatik SMS (`sms_auto_enabled`):** Tabloda **Oto. SMS** sütunu — `SmsAutoEnabledToggleCell`. Kesim/parçalama/teslimat takip ekranlarında aşama tamamlanınca `lib/sms-auto-sender` (ayrıca `sms_enabled` açık ve eşleşen aktif şablon gerekir). Offset’ler: düzenleme diyalogu (`sms_slaughter_approach_offset`, `sms_delivery_pickup_offset`).

Ayrıntı: [sms-admin-and-tenant-flag.md](../sms-admin-and-tenant-flag.md), [sms-operations.md](../sms-operations.md).
