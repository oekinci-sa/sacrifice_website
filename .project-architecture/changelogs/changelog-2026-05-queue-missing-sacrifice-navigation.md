# Operatör sıra sayfaları — silinmiş / boş kurban numarası navigasyonu (2026-05)

## Özet

Ankara Kurban 2026 sezonunda bazı kurban numaraları admin panelinden silindi (ör. 11, 13). Operatör sıra ekranlarında **+** ile bir sonraki numaraya geçilemiyordu; kullanıcı bunu “hissedar yok” sanıyordu. Asıl neden: `check-sacrifice-timing` API’sinin kayıtsız numarada hata dönmesi ve `QueueCardWithButtons` içinde numara değişiminin buna bağlanması.

**Çözüm:** Numara geçişi kurban/hissedar varlığından bağımsız; kayıtsız numarada switch kapalı ve net Türkçe uyarı; aşama işaretleme API’den gelen hatayı gösterir.

**Kapsam:** `/kesimsirasi`, `/parcalamasirasi`, `/teslimatsirasi` — üçü de `StageQueuePage` → `QueueCardWithButtons` kullanır; tek düzeltme üç sayfayı kapsar.

---

## Sorun

### Belirti

- Operatör 12 numarada **+** ile 13’e geçmek istediğinde numara **12’de kalıyordu**.
- Bazen **“Bağlantı Hatası”** toast’ı görülüyordu.
- Hissedar kartında *“Bu kurbanlıkta hissedar kaydı yok”* metni, sorunun hissedar kaynaklı olduğu izlenimini güçlendiriyordu (o mesaj aslında geçiş engeli değildi; geçiş zaten yapılamıyordu).

### Kök neden

1. **`GET /api/check-sacrifice-timing`**  
   `sacrifice_animals` sorgusu `.single()` kullanıyordu. Silinmiş numarada satır yok → PostgREST hata → API **500** → istemci `checkSwitchState` false.

2. **`QueueCardWithButtons` — `handleIncrement` / `handleDecrement` / `handleJump`**  
   Numara değiştirmeden önce `checkSwitchState(newNumber)` başarılı olmalıydı. API 500 olduğunda geçiş yapılmıyordu.

3. **Yanlış varsayım**  
   Hissedar listesi (`get-shareholders-by-sacrifice-no`) boş dönse bile geçişi engellemez; engel tamamen timing API hata akışındaydı.

### DB örneği (Ankara Kurban, 2026)

10–16 aralığında kayıtlı numaralar: 10, 12, 14, 15, 16 — **11 ve 13 yok** (kurbanlık silinmiş).

---

## Çözüm

### 1. API — `app/api/check-sacrifice-timing/route.ts`

- `.single()` → `.maybeSingle()`
- Kayıt yoksa **200** + yapılandırılmış gövde:

```json
{
  "exists": false,
  "slaughter_completed": false,
  "butcher_completed": false,
  "delivery_completed": false,
  "slaughter_time": null,
  "butcher_time": null,
  "delivery_time": null,
  "delivered_share_kg": null,
  "delivery_notes": null,
  "butcher_stage_required": true
}
```

- Kayıt varsa `exists: true` + mevcut alanlar (geriye dönük uyum: istemci `exists !== false` ile okur).

### 2. API — `app/api/get-shareholders-by-sacrifice-no/route.ts`

- Kurban yok: `{ shareholders: [], exists: false }`
- Kurban var: `{ shareholders: [...], exists: true }`

Hissedar kartında iki ayrı boş durum metni:

| Durum | Mesaj |
|-------|--------|
| Kurban yok | Bu numarada kayıtlı kurbanlık yok. |
| Kurban var, hissedar yok | Bu kurbanlıkta hissedar kaydı yok. |

### 3. UI — `app/(takip)/components/queue-card-with-buttons.tsx`

| Davranış | Uygulama |
|----------|----------|
| **+ / − / Git** | Numara doğrudan değişir (`QUEUE_NUMBER_MIN` … `maxSacrificeNumber`); timing API geçişi engellemez |
| **`exists: false`** | `sacrificeExists` state; switch **disabled** |
| Switch altı metin | *Bu numarada kurban kaydı yok* — alt: *Numara değiştirilebilir; aşama işaretlenemez.* |
| Switch açma denemesi | Toast: *Kurban bulunamadı — {no} numaralı kurbanlık kayıtlı değil.* |
| **`POST /api/update-sacrifice-timing` 404** | API `error` metni toast’ta (*Kurban kaydı bulunamadı*) |
| Teslimat formu | `delivery_stage` + kurban yok → `DeliveryShareInfoForm` gizlenir |

`checkSwitchState` kayıtsız numarada **true** döner (navigasyon başarılı sayılır); switch durumu ayrı güncellenir.

### 4. Üst sınır

`maxSacrificeNumber`: tenant + sezon için DB’deki **en büyük `sacrifice_no`**. Arada boş numaralar (11, 13) olabilir; üst limite kadar tüm numaralar seçilebilir.

---

## İlgili dosyalar

| Dosya | Rol |
|-------|-----|
| `app/(takip)/components/stage-queue-page.tsx` | Üç sıra sayfasının ortak kabuğu |
| `app/(takip)/components/queue-card-with-buttons.tsx` | Numaratör, switch, timing state |
| `app/(takip)/components/sacrifice-shareholders-card.tsx` | Hissedar listesi + `exists` mesajları |
| `app/api/check-sacrifice-timing/route.ts` | Aşama durumu + `exists` |
| `app/api/get-shareholders-by-sacrifice-no/route.ts` | Hissedar listesi + `exists` |
| `app/api/update-sacrifice-timing/route.ts` | Aşama güncelleme; kayıt yok → 404 (değişmedi) |
| `app/api/get-stage-metrics/route.ts` | `max_sacrifice_number` (değişmedi) |

---

## Test kontrol listesi

1. Kayıtlı numaradan **+** ile silinmiş numaraya geç (ör. 12 → 13) — numara değişmeli.
2. Silinmiş numarada switch kapalı ve açıklama metni görünmeli.
3. Switch’e zorla basılırsa *Kurban bulunamadı* uyarısı.
4. Kayıtlı numarada (ör. 12) kesim/parçalama/teslimat switch’i normal çalışmalı.
5. Üç sayfada (`kesimsirasi`, `parcalamasirasi`, `teslimatsirasi`) aynı davranış.

---

## İlişkili doküman

- Operatör sıra ekranı genel: [changelog-2026-05-operator-queue-access-delivery-offset-sms-ux.md](changelog-2026-05-operator-queue-access-delivery-offset-sms-ux.md)
