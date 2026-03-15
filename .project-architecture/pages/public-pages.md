# Public Sayfalar

## Genel

Proje e-ticaret benzeri bir kurban hisse alma sitesidir. Müslüman kullanıcılar siteye girip kurbanlık seçer, hisse alır; telefonlarına gelen kod ile kayıt doğrulaması yapar ve PDF çıktı alır. Ödeme nakit toplanır, online ödeme yoktur.

## Sayfa Listesi

### /
Ana sayfa. `tenant_settings.homepage_mode` değerine göre içerik:
- `anasayfa`: Tam anasayfa (Features, Prices, Process, FAQ)
- `thanks`: Teşekkürler sayfası (hisseler satıldı)
- `takip`: Kurbanlık takip sayfası (kesim/parçalama/teslimat sırası)

### /onizleme, /onizleme/anasayfa, /onizleme/thanks, /onizleme/takip
Önizleme route'ları. DB değişikliği yapmadan sayfa içeriklerini görmek için.

### /hakkimizda
Organizasyonu düzenleyenlerin tanıtıldığı sayfa.

### /hisseal
Kurbanlık seçimi ve hisse bilgilerinin girildiği sayfa. İki sekme vardır: **Hisse Seçimi** ve **Hisse Onayı**.

**Hisse Seçimi sekmesi:**
- Tabloda her satırda hisse al butonu
- empty_share 0 ise buton pasif
- Butona basınca "Kaç hisse almak istiyorsunuz?" pop-up
- Seçilen değer kadar db'de empty_share azalır, Hisse Onayı sekmesine geçilir

**Hisse Onayı sekmesi:**
- Seçilen hisse sayısı kadar accordion; her birinde hissedar bilgileri (ad, soyad vb.)
- "Yeni Hissedar Ekle" butonu: db'de yer varsa ekler, empty_share azalır
- Onay butonu: hissedar bilgileri shareholders tablosuna yazılır, hisse sorgulama sayfasına yönlendirilir

**Edge case'ler:**
1. **Timeout:** Form 10 dk açık kalırsa, 3 dk sonra 1 dk kala uyarı pop-up. Süre bitince empty_share, accordion sayısı kadar artar. (Beacon API ile)
2. **Sekme kapatma / sayfa terk:** Kullanıcı sekme kapatır veya sayfadan çıkarsa empty_share accordion sayısı kadar artar. (Beacon API)
3. Timeout dışında Hisse Seçimi sekmesine dönülmez; sadece timeout'ta dönülür.

### /hissesorgula
Telefona gelen kod ile hisse bilgisi sorgulama ve PDF çıktı alma.

### /yazilar
Kurban ibadeti hakkında yazılar (blog).

### /iletisim
Kurumla iletişim bilgileri.
