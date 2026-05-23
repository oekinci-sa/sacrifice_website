# Kontrol Listesi (Özellik Kaybı Kontrolü)

Değişiklik yapıldıktan sonra bu özelliklerin hâlâ çalıştığından emin ol.

## Tenant Kapsamı (ZORUNLU)

Tüm admin API'leri `getTenantId()` ile mevcut tenant'a göre filtreler. Veri her zaman sadece o tenant'a aittir. Yeni API eklerken `tenant_id` filtresi unutulmamalı.

## Hisse Alma (/hisseal)

| Özellik | Kontrol |
|---------|---------|
| Hisse Seçimi | Tablo, hisse al butonu, empty_share 0 ise pasif |
| Hisse sayısı seçimi | Pop-up, seçilen değer kadar empty_share azalır |
| Hisse Onayı sekmesi | Accordion'lar, hissedar bilgileri (ad, soyad vb.) |
| Yeni Hissedar Ekle | empty_share kontrolü, accordion artar |
| Onay butonu | shareholders INSERT, /hissesorgula'ya yönlendirme |
| Timeout (10 dk) | 3 dk sonra 1 dk kala uyarı, süre bitince empty_share artar (Beacon API) |
| Sayfa terk / sekme kapatma | empty_share accordion sayısı kadar artar (Beacon API) |

## Hisse Sorgulama (/hissesorgula)

| Özellik | Kontrol |
|---------|---------|
| Telefon + güvenlik kodu | 6 haneli kod ile sorgulama |
| Hissedar bilgileri | Ödeme durumu, teslimat noktası |
| PDF indirme | Makbuz çıktısı |

## Admin Paneli

| Özellik | Sayfa/URL | Kontrol |
|---------|-----------|---------|
| Genel Bakış | `/kurban-admin/genel-bakis` | Dashboard metrikleri görünüyor mu |
| Kurbanlıklar listesi | `/kurban-admin/kurbanliklar/tum-kurbanliklar` | Tablo, filtreler, sıralama |
| Hissedarlar listesi | `/kurban-admin/hissedarlar/tum-hissedarlar` | Tablo, filtreler |
| Değişiklik Kayıtları | `/kurban-admin/degisiklik-kayitlari` | Log tablosu, arama, filtreler |
| Kullanıcı Yönetimi | `/kurban-admin/kullanici-yonetimi` | Kullanıcı listesi, rol/durum |
| Rezervasyonlar | `/kurban-admin/rezervasyonlar` | reservation_transactions tablosu |
| Kurban Günü İstatistikleri | `/kurban-admin/kurbanliklar/kurban-gunu-istatistikleri` | Aşama kartları, arıza CRUD, duyuru switch |
| Bana Haber Ver | `/takip` | reminder_requests kayıt, tekrar kayıt uyarısı |
| Sıra ekranları | `/kesimsirasi`, `/parcalamasirasi`, `/teslimatsirasi` | Min 1, max kurban no; henüz başlamadıysa 1 göster |
| Public arıza banner | Public + takip layout | Dialog + sticky şerit; admin’den açılır |

## Sidebar Menü

- Tüm menü öğeleri görünür mü
- Rol bazlı gizleme (Kullanıcı Yönetimi sadece admin)

## Renk / UI

- [colors.md](./colors.md) token'ları kullanılıyor mu, hardcoded renk yok mu

## Türkçe UI

- Label, buton, placeholder, tooltip Türkçe mi
