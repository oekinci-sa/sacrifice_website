# Teslim Almaya Çağrı (`butcher_started`) — offset hedef kurban (2026-05)

## Özet

**Teslim Almaya Çağrı** otomatik SMS’i (`butcher_started`) artık parçalanan kurban numarasına değil, **işaretlenen no + offset** ile hesaplanan **hedef kurban** hissedarlarına gider. Kesim yaklaşıyor / kesilmek üzere event’leriyle aynı offset kalıbı kullanılır.

**Örnek:** 12 numara parçalandı, offset = 1 → **13 numaralı** kurbanın (kesimhane teslim) hissedarlarına «teslim almaya gelin» mesajı gider.

---

## Davranış (önce / sonra)

| Durum | Önce | Sonra |
|-------|------|-------|
| Parçalama sırasında N tamamlandı | SMS **N** numaralı kurban hissedarlarına | SMS **N + offset** numaralı kurban hissedarlarına |
| Offset kaynağı | `target_offset` yanlışlıkla «bekleme süresi katsayısı» olarak kullanılıyordu | Per-event `target_offset` veya tenant `sms_delivery_pickup_offset` |
| Hedef yok / teslim edilmiş | Gönderim deneniyordu | Atlanır (offset event sabit kuralları) |

---

## Offset çözümleme sırası

`lib/sms-auto-sender.ts` — `butcher_stage` tamamlanınca:

1. `sms_auto_event_settings.target_offset` (şablon **Gönderim Kuralı** diyalogu; kayıt yoksa `NULL`)
2. `tenant_settings.sms_delivery_pickup_offset` (Organizasyon Ayarları — «Teslim çağrısı — kaç kurban öncesinde?»; varsayılan **2**)
3. `targetNo = sacrificeNo + offset`

Kesim offset event’lerinde olduğu gibi:

- Hedef kurban kayıtlı değilse → gönderme
- Hedef kurbanın `delivery_time` doluysa (teslimat zaten işaretli) → gönderme

---

## Offset event listesi

`lib/sms-event-keys.ts` — `SMS_OFFSET_AUTO_EVENT_KEYS`:

| `event_key` | Tetikleyici aşama | Varsayılan offset | Sabit atlama |
|-------------|-------------------|-------------------|--------------|
| `slaughter_approaching` | Kesim tamamlandı | 20 (event ayarı) | Hedef yok / hedef kesimi tamam |
| `slaughter_imminent` | Kesim tamamlandı | 3 (event ayarı) | Aynı |
| `butcher_started` | Parçalama tamamlandı | Tenant `sms_delivery_pickup_offset` (2) | Hedef yok / hedef teslimi tamam |

---

## Şablon değişkenleri

| Değişken | Anlam |
|----------|--------|
| `{{kurban_no}}` | **Hedef** kurban no (mesajın gittiği hissedarın kurbanı) |
| `{{parcalanan_kurban_no}}` | Parçalamayı tetikleyen kurban no (işaretlenen) |
| `{{parcalama_tahmini_bekleme_suresi}}` | Geçmiş `delivery_time(N) − butcher_time(N−1)` ortalaması (dakika); katsayı çarpanı kaldırıldı |

Idempotency anahtarı hedef kurbanın `sacrifice_id` değerine bağlıdır: `auto:butcher_started:{tenant}:{hedef_sacrifice_id}:{year}`.

---

## Kod ve UI

| Dosya | Değişiklik |
|-------|------------|
| `lib/sms-auto-sender.ts` | `butcher_started` → `targetNo = sacrificeNo + offset`; tenant pickup offset okuma |
| `lib/sms-event-keys.ts` | `butcher_started` → `SMS_OFFSET_AUTO_EVENT_KEYS`; ipucu metinleri |
| `app/(admin)/kurban-admin/sms-islemleri/components/sms-auto-event-settings-dialog.tsx` | «Bekleme süresi katsayısı» kaldırıldı; offset alanı + sabit kurallar (teslim tamam) |
| `app/api/admin/sms/auto-event-settings/route.ts` | `butcher_started` default: `target_offset: null`, skip bayrakları `true` |

---

## Admin yapılandırma

- **Organizasyon Ayarları** (super_admin düzenleme diyalogu): `sms_delivery_pickup_offset` — tenant geneli varsayılan teslim çağrısı offset’i.
- **SMS Şablonları → Gönderim Kuralı** (`butcher_started` şablonu): event bazlı `target_offset` override; alıcı kapsamı (varsayılan: sadece Kesimhane teslim).

---

## Notlar

- Eski `delivery_pickup_approaching` event anahtarı kodda tetiklenmiyor; teslim çağrısı offset mantığı **`butcher_started`** üzerinden uygulanır.
- Daha önce `butcher_started` için `target_offset = 1` kaydedilmiş tenant’larda bu değer artık **kurban numarası offset’i** olarak yorumlanır (bekleme katsayısı değil).
