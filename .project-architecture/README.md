# .project-architecture – Klasör Yapısı

Bu klasör projenin mimari dokümantasyonunu içerir. Proje hakkında bilgi almak için önce bu klasöre bakın; tüm projeyi gezmeye gerek yoktur.

## Klasör ve Dosya Açıklamaları

| Yol | Açıklama |
|-----|----------|
| `project-details.md` | Ana giriş noktası. Proje özeti, sayfa/db/tools referansları |
| `architecture.md` | Mimari: tenant, auth, uygulama yapısı |
| `role-permissions.md` | Rol yetkileri: editor, admin, super_admin – kim ne yapabilir |
| `pages/` | Sayfa açıklamaları (public, admin) |
| `db/` | Veritabanı şeması: tablolar, view'lar, trigger'lar, operational script'ler |
| `tools-versions.md` | Kullanılan paketler ve versiyonları |

## db/ Alt Yapısı

| Yol | Açıklama |
|-----|----------|
| `db/tables/<tablo_adi>/table.sql` | Tablo tanımı |
| `db/tables/<tablo_adi>/functions_and_triggers/` | Trigger ve fonksiyonlar |
| `db/tables/<tablo_adi>/operational_scripts/` | Seed, migration, düzeltme script'leri |
| `db/views/` | View tanımları |
| `db/migrations/` | Migration SQL dosyaları |
| `db/rls-and-realtime.md` | RLS ve Realtime durumu |

## Changelog Dosyaları

| Dosya | Konu |
|-------|------|
| `changelog-2025-03-ui-improvements.md` | UI iyileştirmeleri, last_edited_by, badge renkleri |
| `changelog-2025-03-admin-realtime-theme.md` | Rezervasyonlar realtime, admin tema, uyumsuzluklar, ödeme durumu popup |
| `changelog-2025-03-storage-providers.md` | localStorage, provider konsolidasyonu |
| `changelog-2025-03-user-tenant-badges.md` | Kullanıcı onayı, badge, hisse bedelleri |

## Güncelleme

Mimari değişiklik yapıldığında ilgili dosyayı güncelleyin (örn. yeni sayfa → pages/, DB değişikliği → db/).
