# change_logs — kısa `description` referansı

Tetikleyici SQL’deki sabit cümleler bu tabloyla hizalı tutulur. Değerler `old_value` / `new_value` sütunlarındadır.

## sacrifice_animals

| column_name | description (Güncelleme) |
|-------------|-------------------------|
| (INSERT) | Kurbanlık eklendi |
| (DELETE) | Kurbanlık silindi |
| sacrifice_no | Kurban numarası güncellendi |
| share_weight | Hisse ağırlığı güncellendi |
| share_price | Hisse bedeli güncellendi |
| empty_share | Boş hisse güncellendi |
| pricing_mode | Fiyatlama modu güncellendi |
| live_scale_total_kg | Baskül ağırlığı güncellendi |
| live_scale_total_price | Baskül tutarı güncellendi |
| notes | Notlar güncellendi |
| animal_type | Hayvan cinsi güncellendi |
| foundation | Vakıf bilgisi güncellendi |
| ear_tag | Küpe numarası güncellendi |
| barn_stall_order_no | Ahır sıra numarası güncellendi |
| planned_delivery_time | Planlı teslim saati güncellendi |
| sacrifice_time | Kesim planı güncellendi |
| slaughter_time | Kesim saati güncellendi |
| butcher_time | Parçalama saati güncellendi |
| delivery_time | Teslimat saati güncellendi |

## shareholders

| column_name | description |
|-------------|-------------|
| (INSERT) | Hissedar eklendi |
| (DELETE) | Hissedar silindi |
| shareholder_name | Hissedar adı güncellendi |
| phone_number | Telefon güncellendi |
| second_phone_number | İkinci telefon güncellendi |
| total_amount | Toplam tutar güncellendi |
| paid_amount | Ödenen tutar güncellendi |
| remaining_payment | Kalan ödeme güncellendi |
| delivery_fee | Teslimat ücreti güncellendi |
| delivery_location | Teslimat noktası güncellendi |
| delivery_type | Teslimat tipi güncellendi |
| sacrifice_consent | Vekalet durumu güncellendi |
| notes | Not güncellendi |
| email | E-posta güncellendi |
| security_code | Güvenlik kodu güncellendi |
| contacted_at | Görüşme durumu güncellendi |

## users

| column_name | description |
|-------------|-------------|
| (INSERT) | Kullanıcı eklendi |
| (DELETE) | Kullanıcı silindi |
| name | Ad güncellendi |
| email | E-posta güncellendi |
| role | Rol güncellendi |
| status | Durum güncellendi |
| image | Profil görseli güncellendi |

## user_tenants

| Olay | description |
|------|-------------|
| İkinci org onayı (INSERT) | Kullanıcı onaylandı |
| Onay kaldırma (UPDATE) | Kullanıcı onayı kaldırıldı |

## mismatched_share_acknowledgments

| Olay | description |
|------|-------------|
| INSERT | Uyumsuzluk onaylandı |
| DELETE | Uyumsuzluk kaldırıldı |

## stage_metrics

| column_name | description |
|-------------|-------------|
| current_sacrifice_number | Sıra güncellendi |
