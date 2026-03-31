# change_logs: correlation, katman (primary/detail) ve türetilmiş kolonlar

Bu dosya, `change_logs` tablosuna yazan akışlar için **tek uygulanabilir çerçeve**dir. Her senaryoyu tek tek anlatmak yerine aşağıdaki kurallar yeterlidir.

## 1. Amaç

- **Bir mantıksal kullanıcı işlemi** (tek RPC çağrısı, tek “kaydet”): mümkünse **aynı `correlation_id`** ile gruplansın.
- **Primary**: doğrudan niyet — kullanıcı veya RPC’nin o işlemde değiştirdiği asıl alanlar.
- **Detail**: aynı işlemin **yan etkisi** — başka tablo tetikleri, türetilmiş kolonlar, zincirleme güncellemeler.

UI tarafında genelde: grupta **primary** satır özet / üst satır, **detail** satırlar genişletmede.

## 2. Oturum değişkenleri (transaction-local)

| Değişken | Anlamı |
|----------|--------|
| `app.actor` | Kim yaptı (ör. admin adı, “Hisse al akışı”). |
| `app.correlation_id` | UUID string; **bir mantıksal işlem** boyunca sabit. |
| `app.log_layer` | `'primary'` veya `'detail'` — çoğu INSERT’ta okunur; tetikleyici içinde gerektiğinde `set_config` ile güncellenebilir. |

**Kural:** RPC veya üst seviye fonksiyon, UPDATE/INSERT’ten **hemen önce** actor + (gerekiyorsa) yeni `correlation_id` + başlangıç `log_layer` atamalıdır. Aynı statement içinde birden fazla tablo tetikleniyorsa, **önce** ana tablo, **sonra** yan etkiler için `detail` geçişi (ilgili tetikleyicide) yapılır.

## 3. İki satır = iki farklı şey olabilir

Aynı tabloda **tek UPDATE** ile birden fazla `change_logs` satırı normaldir:

1. **Birden fazla kolon** gerçekten değiştiyse — her kolon için bir satır (mevcut `log_*` pattern’i).
2. **Bir kolon kullanıcı girdisi**, **diğeri türetilmiş** — örnek: `paid_amount` değişince `update_shareholder_amounts` (BEFORE) `remaining_payment`’ı `total_amount - paid_amount` ile günceller; AFTER tetikleyici ikisini de loglar.

Bu ikinci durumda **parent RPC yok**; “parent” hissi, **türetilmiş kolonun `log_layer = 'detail'`** ve **aynı `correlation_id`** ile çözülür.

## 4. Repo taraması: hangi tablolarda DB türetimi var?

`.project-architecture/db` içinde `NEW.<kolon> :=` atan tüm BEFORE tetikleyiciler:

| Tetikleyici | Tablo | Ne türetiliyor? |
|-------------|--------|-----------------|
| `update_shareholder_amounts` | shareholders | `delivery_fee` değişince `total_amount`; `total_amount` veya `paid_amount` değişince `remaining_payment`. |
| `sync_delivery_fee_on_delivery_change` | shareholders | `delivery_location` / `delivery_type` değişince `delivery_fee`, `total_amount`, `remaining_payment`. |
| `set_reservation_completed_at` | reservation_transactions | Koşulda `completed_at := now()` — **change_logs’a yazan audit tetikleyicisi yok** (rezervasyon tablosu izlenmiyor). |
| `update_empty_share` | (AFTER; `sacrifice_animals` UPDATE) | `empty_share` — ayrı statement; `log_sacrifice_changes` ile izlenir, `app.actor` = Hisse al akışı. |

**Diğer audit tabloları** (`users`, `user_tenants`, `stage_metrics`, `mismatched_share_acknowledgments`): bu repoda **BEFORE ile aynı satırda türetilmiş alan + çoklu kolon logu** pattern’i yok.

**Zincirleme (farklı tablo):** `update_shareholder_amounts_on_sacrifice_price_change` (AFTER UPDATE `sacrifice_animals`) tüm hissedarlarda `total_amount` / `remaining_payment` günceller; her satır için `log_shareholder_changes` çalışır. Bu güncellemelerde **RPC’nin `correlation_id`’si hissedar UPDATE’lerine taşınmaz** — gruplama boşluğu; ileride tetikleyicide `current_setting('app.correlation_id')` korunursa veya tek “toplu işlem” logu tercih edilirse kapanır.

## 5. Türetilmiş kolonlar (shareholders) — uygulanan sezgisel kural

| Kolon | `detail` ne zaman? |
|-------|---------------------|
| `delivery_fee` | Aynı UPDATE’te `delivery_location` veya `delivery_type` da değiştiyse (`sync_delivery_fee` yolu; elle sadece ücret değişince primary kalır). |
| `total_amount` | Aynı satırda `delivery_fee` de değiştiyse ve `total_amount` da değiştiyse (`update_shareholder_amounts` yolu). |
| `remaining_payment` | Aynı satırda `paid_amount` veya `total_amount` da değiştiyse (kalan = toplam − ödenen zinciri). |

Sadece `remaining_payment` elle değişip `paid_amount` / `total_amount` aynı kaldıysa → **detail değil** (oturumdaki `v_layer`, genelde primary).

## 5b. Türetilmiş kolonlar (sacrifice_animals)

| Kolon | `detail` ne zaman? |
|-------|---------------------|
| `planned_delivery_time` | Aynı UPDATE’te `sacrifice_time` da değiştiyse (`rpc_update_sacrifice_core` patch’inde kesim saati değişince planlı teslim genelde +90 dk ile güncellenir; ikisi birden değişince planlı teslim **detail**). |

## 6. `rpc_update_shareholder`

- Çağrı başında: `app.correlation_id := gen_random_uuid()`, `app.log_layer := 'primary'`.
- Böylece hissedar güncellemesinden gelen tüm kolon logları **aynı korelasyon**da toplanır; türetilmiş kolonlar yukarıdaki CASE ile **detail** işaretlenir.

## 7. Diğer `change_logs` yazarları (özet envanter)

| Kaynak | Not |
|--------|-----|
| `log_shareholder_changes` | shareholders INSERT/UPDATE/DELETE |
| `log_sacrifice_changes` | sacrifice_animals (+ parçalı merge) |
| `log_user_changes` | users |
| `log_user_tenants_changes` | user_tenants |
| `log_stage_metrics_changes` | stage_metrics |
| `log_mismatch_changes` | mismatched_share_acknowledgments |

Yeni tablo veya yeni RPC eklerken: **actor + correlation + layer** sözleşmesini bu dosyaya uygun şekilde genişlet; sadece migration yetmez (bkz. workspace `new-column-change-logs.mdc`).

## 8. Senaryoları tek tek yazma ihtiyacı

Hayır. Özet: **(1)** RPC başına correlation, **(2)** doğrudan alan = primary / türetilmiş veya zincir = detail, **(3)** aynı işlemde çok kolon = çok satır ama tek correlation — bu üçü UI ve sorgu tarafında tutarlı gruplama sağlar.
