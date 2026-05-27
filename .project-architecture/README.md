# .project-architecture – Klasör Yapısı

Bu klasör projenin mimari dokümantasyonunu içerir. Proje hakkında bilgi almak için önce bu klasöre bakın; tüm projeyi gezmeye gerek yoktur.

## Klasör ve Dosya Açıklamaları

| Yol | Açıklama |
|-----|----------|
| `project-details.md` | Ana giriş noktası. Proje özeti, sayfa/db/tools referansları |
| `audit-rpc-and-triggers.md` | `change_logs`, tetikleyiciler, RPC listesi ve kaldırılan fonksiyonların gerekçesi |
| `architecture.md` | Mimari: tenant, auth, uygulama yapısı |
| `role-permissions.md` | Rol yetkileri: editor, admin, super_admin – kim ne yapabilir |
| `pages/` | Sayfa açıklamaları (public, admin) |
| `db/` | Veritabanı şeması: tablolar, view'lar, trigger'lar, operational script'ler |
| `tools-versions.md` | Kullanılan paketler ve versiyonları |
| `sms-operations.md` | Bizim SMS backend akışı, API listesi, dedup mantığı özeti |
| `sms-admin-and-tenant-flag.md` | Tenant `sms_enabled`; sidebar/Hissedar sütunu; PDF sırası; süper admin toggle; hissedar SMS sheet davranışı |
| `changelogs/changelog-2026-05-kurban-gunu-istatistikleri.md` | Kurban günü istatistikleri, arıza kayıtları, ortalama süre düzeltmesi, public banner |
| `changelogs/changelog-2026-05-admin-table-ux-sms-picker.md` | SMS hissedar seçici sayfalama; kurbanlık tablo kayıt sayısı; hissedar hisse sıralama/filtre |
| `changelogs/changelog-2026-05-sms-templates-variables-payment-filter.md` | SMS değişken standardizasyonu, ödeme otomatik SMS, şablon filtresi, FK CASCADE |
| `changelogs/changelog-2026-05-operator-queue-access-delivery-offset-sms-ux.md` | Operatör sıra PIN, planlı teslim offset, güvenlik ayarları, SMS UX |
| `changelogs/changelog-2026-05-butcher-started-delivery-pickup-offset.md` | Teslim Almaya Çağrı (`butcher_started`) offset hedef kurban davranışı |
| `changelogs/changelog-2026-05-queue-missing-sacrifice-navigation.md` | Operatör sıra sayfaları: silinmiş kurban no navigasyonu, `exists` API, switch uyarıları |

## db/ Alt Yapısı

| Yol | Açıklama |
|-----|----------|
| `db/tables/<tablo_adi>/table.sql` | Tablo tanımı |
| `db/tables/<tablo_adi>/functions_and_triggers/` | Trigger ve fonksiyonlar |
| `db/tables/<tablo_adi>/operational_scripts/` | Seed, migration, düzeltme script'leri |
| `db/views/` | View tanımları |
| `db/migrations/` | Migration SQL dosyaları |
| `db/rls-and-realtime.md` | RLS ve Realtime durumu |
| `changelogs/` | Tarihli mimari changelog dosyaları ([changelogs/README.md](changelogs/README.md)); admin tablo başlık haritaları özeti: [changelogs/changelog-2026-04-admin-table-column-labels.md](changelogs/changelog-2026-04-admin-table-column-labels.md) |

## Güncelleme

Mimari değişiklik yapıldığında ilgili dosyayı güncelleyin (örn. yeni sayfa → pages/, DB değişikliği → db/).
