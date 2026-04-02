-- Elya Hayvancılık (tenant …0003) — 31 hissedarı 2026 verisiyle geri yükleme
--
-- MCP ile doğrulandı: Eski dump’taki sacrifice_id UUID’leri artık yok (yeniden numaralandırma / silme sonrası).
-- Aşağıdaki sacrifice_id değerleri şu anki DB’den alındı (kg + fiyat + mod eşlemesi).
--
-- Yerleştirme kuralı (senin tarifin):
--   • Aynı “Kurban No” grubundakiler aynı sacrifice_id’ye gider.
--   • Gruplar, gruptaki en erken kayıt tarihine göre sıralandı; aynı kg için en küçük
--     sacrifice_no’lu boş hayvan sırayla atandı (FIFO).
--
-- Atama özeti (sacrifice_no → sacrifice_id):
--   50 kg grup 18 (5 kişi)     → no 31  f0b420c9-6b80-4227-86c0-ee8d5cbbd36d
--   25 kg grup 74 (6 kişi)     → no 56  998369bc-46a7-4688-a723-8100aa6414db
--   25 kg grup 76 (7 kişi)     → no 57  9c530279-f7c5-42d1-9125-566af17d30a7
--   32 kg grup 69 (5 kişi)     → no 46  e5762197-6f9e-479b-8641-3c6d6784b794
--   28 kg grup 73 (3 kişi)     → no 51  03a5992f-4a44-45e6-bc8a-09e2165b0dfb
--   43 kg grup 41 (2 kişi)     → no 38  8f0a0d1e-9faf-4fbf-8b1c-88dc4f008257
--   39 kg grup 42 (1 kişi)     → no 40  b39e8b49-1946-4e0b-8dbb-1e5b0fe353da
--   23 kg grup 77 (1 kişi)     → no 62  1c02e87a-1470-4d2e-a30d-0c00d43d8b63
--   canlı baskül grup 1 (Hasan) → no 1   801ee2b5-cee7-41ed-a1ee-a21d24aac8fa
--
-- DİKKAT:
--   • transaction_id: reservation_transactions FK için tüm satırlarda NULL (rezervasyon satırı yoksa).
--     Eski işlem kodlarını notes veya ayrı tabloda saklamak istersen elle ekle.
--   • Canlı baskül no 1 (Hasan): INSERT öncesi bu hayvanda hissedar yoksa empty_share = 1; INSERT sonrası
--     toplu empty_share düşümünde −1 ile 0 olur.
--   • Ham INSERT sonrası empty_share elle düşürülür (uygulama akışındaki gibi).
--   • Nazik Karaoğlu satırında orijinal dump’ta shareholder_id yoktu; yeni UUID üretildi.
--
-- Çalıştırmadan önce yedek alın.

BEGIN;

-- Canlı baskül no 1: hissedar yokken tek kişilik slot (INSERT öncesi empty_share = 1)
UPDATE public.sacrifice_animals sa
SET empty_share = 1,
    last_edited_by = 'SQL restore 31 shareholders prep',
    last_edited_time = now()
WHERE sa.sacrifice_id = '801ee2b5-cee7-41ed-a1ee-a21d24aac8fa'::uuid
  AND NOT EXISTS (SELECT 1 FROM public.shareholders sh WHERE sh.sacrifice_id = sa.sacrifice_id);

INSERT INTO public.shareholders (
  shareholder_name,
  phone_number,
  purchase_time,
  purchased_by,
  transaction_id,
  security_code,
  delivery_fee,
  total_amount,
  paid_amount,
  remaining_payment,
  delivery_location,
  sacrifice_consent,
  last_edited_by,
  last_edited_time,
  notes,
  sacrifice_id,
  shareholder_id,
  tenant_id,
  sacrifice_year,
  email,
  contacted_at,
  delivery_type,
  second_phone_number
) VALUES
-- Kurban 18 — 50 kg — sacrifice 31
('Nazik Karaoğlu', '+905545631020', '2026-04-01 14:30:03.160503+00', 'Nazik Karaoğlu', NULL, '768893', 0.00, 51000.00, 0.00, 51000.00, 'Gölbaşı', false, 'oekinci.sa@gmail.com', '2026-04-02 06:43:56.739848+00', 'Bu hissedardan 1 TL kapora alınacak.', 'f0b420c9-6b80-4227-86c0-ee8d5cbbd36d'::uuid, gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Mustafa Dağtekin', '+905058198022', '2026-04-02 07:36:24.622551+00', 'Mustafa Dağtekin', NULL, '036255', 0.00, 51000.00, 0.00, 51000.00, 'Gölbaşı', false, 'Hisse al akışı', '2026-04-02 07:36:24.622551+00', NULL, 'f0b420c9-6b80-4227-86c0-ee8d5cbbd36d'::uuid, '04768abc-0d8a-4dc6-abc7-7a3b27f112bd'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, 'mustafadagtekin@gmail.com', NULL, 'Kesimhane', NULL),
('Muhammed Resul Kılıçlı', '+905446278277', '2026-04-02 07:36:24.622551+00', 'Mustafa Dağtekin', NULL, '036255', 0.00, 51000.00, 0.00, 51000.00, 'Gölbaşı', false, 'Hisse al akışı', '2026-04-02 07:36:24.622551+00', NULL, 'f0b420c9-6b80-4227-86c0-ee8d5cbbd36d'::uuid, '8e5cbf81-e713-412e-9d6f-28cbdd46a6d7'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, 'muhammetresulkilicli@gmail.com', NULL, 'Kesimhane', NULL),
('Kazım Dağtekin', '+905068602523', '2026-04-02 07:36:24.622551+00', 'Mustafa Dağtekin', NULL, '036255', 0.00, 51000.00, 0.00, 51000.00, 'Gölbaşı', false, 'Hisse al akışı', '2026-04-02 07:36:24.622551+00', NULL, 'f0b420c9-6b80-4227-86c0-ee8d5cbbd36d'::uuid, '094688ea-348c-4d2e-9b18-47c492c7ce63'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, 'dagtekinkazim@gmail.com', NULL, 'Kesimhane', NULL),
('Nurettin Tokustepe', '+905338176193', '2026-03-25 09:34:43.254675+00', 'Nurettin Tokustepe', NULL, '012345', 0.00, 51000.00, 0.00, 51000.00, 'Gölbaşı', false, 'ekinci.omer.68@gmail.com', '2026-03-26 12:43:21.782942+00', NULL, 'f0b420c9-6b80-4227-86c0-ee8d5cbbd36d'::uuid, '0315c939-f11b-4e84-9a6f-d5d08873b1c8'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),

-- Kurban 1 — canlı baskül — sacrifice 1
('Hasan Numanoğlu', '+905304552971', '2026-04-01 19:40:40.943544+00', 'Hasan Numanoğlu', NULL, '839836', 0.00, 0.00, 0.00, 0.00, 'Gölbaşı', false, 'mehmetinanli@gmail.com', '2026-04-01 22:19:25.632749+00', 'Bu hissedardan 1 TL kapora alınacak.', '801ee2b5-cee7-41ed-a1ee-a21d24aac8fa'::uuid, 'e453ebc6-b29f-475c-88b1-ce40017c3a3b'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, 'hasnum@gmail.com', NULL, 'Kesimhane', NULL),

-- Kurban 77 — 23 kg — sacrifice 62
('Hanim Suren', '+905378667756', '2026-03-25 09:40:48.145629+00', 'Hanim Suren', NULL, '012345', 0.00, 25000.00, 0.00, 25000.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-25 09:40:48.145629+00', NULL, '1c02e87a-1470-4d2e-a30d-0c00d43d8b63'::uuid, '9cc60d59-89e5-425a-998d-1a219becf53b'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),

-- Kurban 42 — 39 kg — sacrifice 40
('Seref Tokustepe', '+905368655411', '2026-03-25 09:48:16.147731+00', 'Seref Tokustepe', NULL, '012345', 0.00, 41500.00, 0.00, 41500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-25 09:48:16.147731+00', NULL, 'b39e8b49-1946-4e0b-8dbb-1e5b0fe353da'::uuid, '0e10fdf4-7086-4b26-be16-bdbcbbe7419b'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),

-- Kurban 74 — 25 kg — sacrifice 56
('Tuğçe Karabıyık', '+905467849102', '2026-03-25 10:26:40.470354+00', 'Başak Karabıyık', NULL, '199306', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-25 10:26:40.470354+00', NULL, '998369bc-46a7-4688-a723-8100aa6414db'::uuid, 'be8da321-7d52-4293-9381-327d2cc6be46'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Dilaver Karabıyık', '+905467849102', '2026-03-25 10:26:40.470354+00', 'Başak Karabıyık', NULL, '199306', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-25 10:26:40.470354+00', NULL, '998369bc-46a7-4688-a723-8100aa6414db'::uuid, '9ae8a63d-29cb-4113-81d7-fcf10013b3cc'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Nevcet Karabıyık', '+905467849102', '2026-03-25 10:26:40.470354+00', 'Başak Karabıyık', NULL, '199306', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-25 10:26:40.470354+00', NULL, '998369bc-46a7-4688-a723-8100aa6414db'::uuid, '5188366d-a825-4f3a-a83b-b08b396938c9'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Başak Karabıyık', '+905467849102', '2026-03-25 10:26:40.470354+00', 'Başak Karabıyık', NULL, '199306', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-25 10:26:40.470354+00', NULL, '998369bc-46a7-4688-a723-8100aa6414db'::uuid, 'd9df9ccb-1c7e-482c-9f9b-67d920cd47f1'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Ali Güllü', '+905327726172', '2026-03-25 11:33:00.138501+00', 'Ali Güllü', NULL, '012345', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'yuusufmuhammed@gmail.com', '2026-03-25 11:33:00.138501+00', NULL, '998369bc-46a7-4688-a723-8100aa6414db'::uuid, 'a7e4b829-9198-40d3-a999-aaefa816f9a0'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Ali Güllü', '+905327726172', '2026-03-28 08:28:37.286512+00', 'Ali Güllü', NULL, '012345', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'yuusufmuhammed@gmail.com', '2026-03-28 08:28:37.286512+00', NULL, '998369bc-46a7-4688-a723-8100aa6414db'::uuid, '38d024dd-e819-473e-a113-e67cb0963725'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),

-- Kurban 76 — 25 kg — sacrifice 57
('Ekrem Afşar', '+905378697266', '2026-03-27 08:07:01.073468+00', 'Ekrem Afşar', NULL, '839836', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:07:01.073468+00', NULL, '9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, '3e69d3eb-6f13-482c-a5a0-eeb8e3139a0f'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Mustafa Doğmuş', '+905058811515', '2026-03-27 08:07:01.073468+00', 'Ekrem Afşar', NULL, '839836', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:07:01.073468+00', NULL, '9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, '3174b98c-38a9-4935-8154-50606995da74'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Osman Gündoğan', '+905359248745', '2026-03-27 08:07:01.073468+00', 'Ekrem Afşar', NULL, '839836', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:07:01.073468+00', NULL, '9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, '206d9137-59ca-4986-9249-65555809bb90'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Şaban Cengiz', '+905552330750', '2026-03-27 08:07:01.073468+00', 'Ekrem Afşar', NULL, '839836', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:07:01.073468+00', NULL, '9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, 'baf6dfbf-68dd-4995-81b4-c54007cb1329'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Türkan Altıok', '+905466102754', '2026-03-27 08:07:01.073468+00', 'Ekrem Afşar', NULL, '839836', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:07:01.073468+00', NULL, '9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, '8c2b1713-7bed-4e21-9edf-0753f5ee28a0'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Yaşar Cengiz', '+905552330750', '2026-03-27 08:07:01.073468+00', 'Ekrem Afşar', NULL, '839836', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:07:01.073468+00', NULL, '9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, 'd4934889-66ae-472d-90c8-0ee85479c435'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Mahmut Ulucan', '+905308267816', '2026-03-27 08:07:01.073468+00', 'Ekrem Afşar', NULL, '839836', 0.00, 26500.00, 0.00, 26500.00, 'Gölbaşı', false, 'mahmutkvci@gmail.com', '2026-03-30 20:05:21.82397+00', NULL, '9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, '50078b3b-440a-4816-8adf-edd5699e0b3d'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, '2026-03-30 20:05:21.787+00', 'Kesimhane', NULL),

-- Kurban 41 — 43 kg — sacrifice 38
('Gülbiye Dulkar', '+905308267816', '2026-03-27 08:12:11.191807+00', 'Gülbiye Dulkar', NULL, '839836', 0.00, 45000.00, 0.00, 45000.00, 'Gölbaşı', false, 'mahmutkvci@gmail.com', '2026-03-30 20:05:17.055109+00', NULL, '8f0a0d1e-9faf-4fbf-8b1c-88dc4f008257'::uuid, 'e31534ad-0b56-453f-be2d-487c9db8cc9b'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, '2026-03-30 20:05:17.024+00', 'Kesimhane', NULL),
('Yüksel Keser', '+905362034810', '2026-03-27 08:12:11.191807+00', 'Gülbiye Dulkar', NULL, '839836', 0.00, 45000.00, 10000.00, 35000.00, 'Gölbaşı', false, 'mahmutkvci@gmail.com', '2026-03-30 20:05:12.687704+00', NULL, '8f0a0d1e-9faf-4fbf-8b1c-88dc4f008257'::uuid, '1a640b07-d743-4406-9e89-2480b7b282f7'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, '2026-03-30 20:05:12.663+00', 'Kesimhane', NULL),

-- Kurban 69 — 32 kg — sacrifice 46
('Tekin Sertkaya', '+905453555025', '2026-03-27 08:17:42.808346+00', 'Tekin Sertkaya', NULL, '839836', 0.00, 34000.00, 0.00, 34000.00, 'Gölbaşı', false, 'mahmutkvci@gmail.com', '2026-03-30 20:04:58.200063+00', NULL, 'e5762197-6f9e-479b-8641-3c6d6784b794'::uuid, 'b7f47b30-ac69-4c1c-a057-890bff0434a8'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, '2026-03-30 20:04:58.176+00', 'Kesimhane', NULL),
('Halis Ergün', '+905559823236', '2026-03-27 08:20:08.537193+00', 'Halis Ergün', NULL, '839836', 0.00, 34000.00, 0.00, 34000.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:20:08.537193+00', NULL, 'e5762197-6f9e-479b-8641-3c6d6784b794'::uuid, '3131f1a3-9525-4d9e-8f2b-003502563037'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Selami Şahin', '+905342117699', '2026-03-27 08:20:08.537193+00', 'Halis Ergün', NULL, '839836', 0.00, 34000.00, 0.00, 34000.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:20:08.537193+00', NULL, 'e5762197-6f9e-479b-8641-3c6d6784b794'::uuid, '84d92ebd-3ff8-43ef-bd30-bfa91b83581d'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Muhammed Şahin', '+905342117699', '2026-03-27 08:20:08.537193+00', 'Halis Ergün', NULL, '839836', 0.00, 34000.00, 0.00, 34000.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:20:08.537193+00', NULL, 'e5762197-6f9e-479b-8641-3c6d6784b794'::uuid, 'e6ddb642-cad1-4381-bcf2-393b1b78fa78'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),
('Havva Çalışır', '+905342117699', '2026-03-27 08:20:08.537193+00', 'Halis Ergün', NULL, '839836', 0.00, 34000.00, 0.00, 34000.00, 'Gölbaşı', false, 'hisseal-akisi', '2026-03-27 08:20:08.537193+00', NULL, 'e5762197-6f9e-479b-8641-3c6d6784b794'::uuid, 'ce304524-f69d-4a3a-a3d4-1b736f657283'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL),

-- Kurban 73 — 28 kg — sacrifice 51
('Esra Yüksel', '+905454042775', '2026-03-27 08:16:06.964032+00', 'Şahin Yavuz Yüksel', NULL, '839836', 0.00, 29500.00, 0.00, 29500.00, 'Gölbaşı', false, 'mahmutkvci@gmail.com', '2026-03-30 20:05:08.632008+00', NULL, '03a5992f-4a44-45e6-bc8a-09e2165b0dfb'::uuid, '078234cd-668c-455d-8f09-b4c18e1b8773'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, '2026-03-30 20:05:08.586+00', 'Kesimhane', NULL),
('Şahin Yavuz Yüksel', '+905534440142', '2026-03-27 08:16:06.964032+00', 'Şahin Yavuz Yüksel', NULL, '839836', 0.00, 29500.00, 0.00, 29500.00, 'Gölbaşı', false, 'mahmutkvci@gmail.com', '2026-03-30 20:05:11.044292+00', NULL, '03a5992f-4a44-45e6-bc8a-09e2165b0dfb'::uuid, '78d51b97-fd0f-441a-9dd1-81e9639999c5'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, '2026-03-30 20:05:10.995+00', 'Kesimhane', NULL),
('Emre Gazi Karaca', '+905436196119', '2026-03-31 08:19:06.832553+00', 'Emre Gazi Karaca', NULL, '839836', 0.00, 29500.00, 0.00, 29500.00, 'Gölbaşı', false, 'mahmutkvci@gmail.com', '2026-03-31 08:19:06.832553+00', NULL, '03a5992f-4a44-45e6-bc8a-09e2165b0dfb'::uuid, '42d8945b-6437-4d68-a89b-46973cae3ad4'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 2026, NULL, NULL, 'Kesimhane', NULL);

-- empty_share düşür (INSERT tetiklemez; uygulama ile tutarlı olsun). Hasan: önce 1 → −1 ile 0.
UPDATE public.sacrifice_animals sa
SET empty_share = GREATEST(0, sa.empty_share - v.cnt),
    last_edited_by = 'SQL restore 31 shareholders',
    last_edited_time = now()
FROM (
  VALUES
    ('f0b420c9-6b80-4227-86c0-ee8d5cbbd36d'::uuid, 5),
    ('801ee2b5-cee7-41ed-a1ee-a21d24aac8fa'::uuid, 1),
    ('1c02e87a-1470-4d2e-a30d-0c00d43d8b63'::uuid, 1),
    ('b39e8b49-1946-4e0b-8dbb-1e5b0fe353da'::uuid, 1),
    ('998369bc-46a7-4688-a723-8100aa6414db'::uuid, 6),
    ('9c530279-f7c5-42d1-9125-566af17d30a7'::uuid, 7),
    ('8f0a0d1e-9faf-4fbf-8b1c-88dc4f008257'::uuid, 2),
    ('e5762197-6f9e-479b-8641-3c6d6784b794'::uuid, 5),
    ('03a5992f-4a44-45e6-bc8a-09e2165b0dfb'::uuid, 3)
) AS v(sid, cnt)
WHERE sa.sacrifice_id = v.sid;

COMMIT;
