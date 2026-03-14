# Hisseal Rezervasyon Timeout Akışı

Bu doküman hisseal sayfasındaki **session timer** ve **inactivity timer** mantığını, uyarıların kapatılmasını ve redirect akışını detaylıca açıklar. Bu mantığın bozulmaması kritiktir.

## Genel Bakış

| Timer | Tetikleyici | Süre | Kaynak |
|-------|-------------|------|--------|
| **Session timer** | 2. adıma (details/confirmation) geçişten itibaren | `TIMEOUT_DURATION` (örn. 30 sn) | `useReservationAndWarningManager` — `requestAnimationFrame` |
| **Inactivity timer** | Son mouse/klavye/scroll/focus etkileşiminden itibaren | `INACTIVITY_TIMEOUT` (örn. 10 sn) | `useHandleInteractionTimeout` — `setInterval` (1 sn) |

Her iki timer da süre dolduğunda **aynı redirect akışını** kullanır: `handleTimeoutRedirect` (page.tsx) → `performRedirect`.

## Sabitler (lib/constants/reservation-timer.ts)

| Sabit | Açıklama |
|-------|----------|
| `TIMEOUT_DURATION` | Oturum süresi — session timer + DB `expires_at` |
| `INACTIVITY_TIMEOUT` | Hareketsizlik süresi — mouse/klavye yoksa redirect |
| `INACTIVITY_WARNING_THRESHOLD` | Inactivity uyarı banner eşiği (kalan sn) |
| `THREE_MINUTE_WARNING` | "3 dk kaldı" session uyarısı eşiği |
| `ONE_MINUTE_WARNING` | "1 dk kaldı" session uyarısı eşiği |

## Uyarı Türleri

| Uyarı | State | Gösterim |
|-------|-------|----------|
| **Inactivity banner** | `showWarning` | Üstte amber banner — "X saniye içerisinde işlem yapmazsanız..." |
| **3 dk session uyarısı** | `showThreeMinuteWarning` | AlertDialog |
| **1 dk session uyarısı** | `showOneMinuteWarning` | AlertDialog |

## Redirect Öncesi Zorunlu Adımlar

**Her timeout/redirect yolunda** aşağıdaki state'ler mutlaka kapatılmalıdır. Aksi halde:
- Inactivity banner 1. adıma dönünce ekranda kalır
- Session uyarı dialogları açık kalır

```ts
setShowWarning(false);           // Inactivity banner
setIsDialogOpen(false);
setShowReservationInfo(false);
setShowThreeMinuteWarning(false);
setShowOneMinuteWarning(false);
```

## Timeout Yolları ve Sıra

### 1. Session timer (handleTimeLeft — requestAnimationFrame)

**Dosya:** `useReservationAndWarningManager.ts` — `handleTimeLeft` callback

- `s <= 0` olduğunda:
  1. `cancelAnimationFrame`, `startTimeRef = null`
  2. Toast
  3. `setShowThreeMinuteWarning(false)`, `setShowOneMinuteWarning(false)`, **`setShowWarning(false)`**
  4. `handleTimeoutRedirect()`

### 2. Inactivity timer (useHandleInteractionTimeout — setInterval)

**Dosya:** `helpers/hisseal/timeout.ts`

- `timeLeft <= 0` ve `!firedRef.current` olduğunda:
  1. `firedRef.current = true`, `clearInterval`
  2. `setShowWarning(false)`
  3. `openDialogs`: `setIsDialogOpen(false)`, `setShowReservationInfo(false)`, `setShowThreeMinuteWarning(false)`, `setShowOneMinuteWarning(false)`
  4. **`requestAnimationFrame(() => void handler())`** — handler'ı bir sonraki frame'de çalıştır (session ile aynı faz; sayfa yanıt vermeme sorununu önler)

**Handler:** `createHandleCustomTimeout` (timeout-handlers.ts) → `performRedirect` (handleTimeoutRedirect)

- `createHandleCustomTimeout` içinde:
  1. Tüm dialog/warning state'leri false
  2. `setCameFromTimeout(true)`
  3. `await performRedirect()`
  4. Toast

### 3. Bootstrap (expiryData.timeLeftSeconds <= 0)

**Dosya:** `useReservationAndWarningManager.ts` — Supabase bootstrap

- Tüm dialog/warning state'leri false → `handleTimeoutRedirect()`

### 4. Supabase realtime (status === 'expired')

**Dosya:** `useReservationAndWarningManager.ts` — postgres_changes subscription

- Tüm dialog/warning state'leri false → Toast → `handleTimeoutRedirect()`

### 5. reservationStatus (React Query — status === EXPIRED)

**Dosya:** `useReservationAndWarningManager.ts` — useEffect

- Tüm dialog/warning state'leri false → Toast → `handleTimeoutRedirect()`

## handleTimeoutRedirect Akışı (page.tsx)

```ts
1. transaction_id ile /api/expire-reservation (status: 'timed_out')
2. resetStore()
3. generateNewTransactionId()
4. goToStep("selection")
5. needsRerender.current = true
6. router.refresh()
7. refetchSacrifices()
```

**Kritik:** `resetStore()` + `generateNewTransactionId()` + `goToStep("selection")` sırası asla bozulmamalı.

## Inactivity Handler — requestAnimationFrame Zorunluluğu

`useHandleInteractionTimeout` içinde handler **mutlaka** `requestAnimationFrame` ile defer edilmelidir:

```ts
requestAnimationFrame(() => {
  void handler();
});
```

**Sebep:** `setInterval` callback'i timer fazında çalışır. Session timeout `requestAnimationFrame` (animation fazı) içinde çalışır. Handler'ı `requestAnimationFrame` ile çalıştırmak:
- React'ın setState batch'lerini işlemesine izin verir
- Session timeout ile aynı event loop fazında çalıştırır
- Inactivity sonrası sayfa yanıt vermeme (buton tıklanamama) sorununu önler

**Yasak:** `setTimeout(0)` veya doğrudan `void handler()` — sayfa kilitlenmesine yol açabilir.

## Etkileşim Takibi (useTrackInteractions)

**Dosya:** `helpers/hisseal/timeout.ts`

- `currentStep === "details"` veya `"confirmation"` iken: `mousedown`, `keydown`, `scroll`, `focus` → `setLastInteractionTime(Date.now())`, `setShowWarning(false)`
- **Yasak:** `setTimeLeft` burada çağrılmamalı — session timer display'dan gelir; her tıklamada timer sıçrar

## Dosya Referansları

| Dosya | Rol |
|-------|-----|
| `lib/constants/reservation-timer.ts` | Tüm sabitler |
| `app/(public)/(hisse)/hisseal/page.tsx` | `handleTimeoutRedirect` |
| `app/(public)/(hisse)/hisseal/hooks/useReservationAndWarningManager.ts` | Session timer, tüm timeout yolları, dialog state |
| `app/(public)/(hisse)/hisseal/handlers/timeout-handlers.ts` | `createHandleCustomTimeout` — inactivity handler |
| `helpers/hisseal/timeout.ts` | `useHandleInteractionTimeout`, `useTrackInteractions` |
| `app/(public)/(hisse)/hisseal/components/dialogs/warning-dialogs.tsx` | `showInactivityWarning` (= `showWarning`) |

## İlgili Kurallar

- `.cursor/rules/reservation-timer-invariants.mdc` — değişiklik yaparken uyulması gereken kurallar
- `.project-architecture/db/tables/reservation_transactions/timer_constants.md` — sabitler dokümantasyonu
