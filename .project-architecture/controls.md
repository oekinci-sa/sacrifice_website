# Kontrol Listesi (Özellik Kaybı Kontrolü)

Değişiklik yapıldıktan sonra bu özelliklerin hâlâ çalıştığından emin ol.

## Tenant Kapsamı (ZORUNLU)

Tüm admin API'leri `getTenantId()` ile mevcut tenant'a göre filtreler. Veri her zaman sadece o tenant'a aittir. Yeni API eklerken `tenant_id` filtresi unutulmamalı.

## Admin Paneli

| Özellik | Sayfa/URL | Kontrol |
|---------|-----------|---------|
| Genel Bakış | `/kurban-admin/genel-bakis` | Dashboard metrikleri görünüyor mu |
| Kurbanlıklar listesi | `/kurban-admin/kurbanliklar/tum-kurbanliklar` | Tablo, filtreler, sıralama |
| Hissedarlar listesi | `/kurban-admin/hissedarlar/tum-hissedarlar` | Tablo, filtreler |
| Değişiklik Kayıtları | `/kurban-admin/degisiklik-kayitlari` | Log tablosu, arama, filtreler |
| Kullanıcı Yönetimi | `/kurban-admin/kullanici-yonetimi` | Kullanıcı listesi, rol/durum |
| Rezervasyonlar | `/kurban-admin/rezervasyonlar` | reservation_transactions tablosu |
| Aşama Metrikleri | `/kurban-admin/asama-metrikleri` | stage_metrics tablosu |

## Sidebar Menü

- Tüm menü öğeleri görünür mü
- Rol bazlı gizleme (Kullanıcı Yönetimi sadece admin)

## Renk / UI

- [colors.md](./colors.md) token'ları kullanılıyor mu, hardcoded renk yok mu

## Türkçe UI

- Label, buton, placeholder, tooltip Türkçe mi
