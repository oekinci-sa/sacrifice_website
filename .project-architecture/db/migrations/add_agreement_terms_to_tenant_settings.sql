-- agreement_terms: tenant bazlı sözleşme maddeleri (JSONB array)
-- Her madde: { "title": "...", "description": "..." }
ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS agreement_terms JSONB DEFAULT '[]'::jsonb;

-- Mevcut tenant_settings kayıtlarına varsayılan sözleşme maddelerini ata
UPDATE tenant_settings
SET agreement_terms = '[
  {"title": "Ödeme ve Kapora", "description": "Her hisse için hisse alımdan itibaren 3 gün içerisinde en az 5000₺ kapora ödenmesi zorunludur. Kalan tutarın ise 20 Mayıs Çarşamba gününe kadar eksiksiz olarak tamamlanması beklenmektedir. Belirtilen tarihlere kadar ödeme tamamlanmazsa hisse hakkı iptal edilebilir."},
  {"title": "Vekalet ve Dini Usuller", "description": "Hissedar, bu organizasyona katılarak kurban ibadetinin vekâleten gerçekleştirilmesini kabul etmiş sayılır. Kurban kesimi, İslami usullere ve hijyenik koşullara uygun olarak ehil kişilerce gerçekleştirilecektir."},
  {"title": "İptal ve İade Koşulları", "description": "Kurban kesim tarihinden en az 1 ay önce yazılı olarak talepte bulunmanız halinde, hisse bedelinizin iadesi mümkündür. Kesim gününe 1 aydan daha kısa bir süre kaldıysa iade yapılamaz."},
  {"title": "Adres ve Bilgi Güncellemeleri", "description": "Teslimat adresi veya iletişim bilgilerinizde bir değişiklik olduysa, bu bilgileri kesim gününden önce bizimle paylaşmanız gerekmektedir. Aksi halde hissenizin size zamanında ve doğru şekilde ulaşması garanti edilemez."},
  {"title": "Bilgilendirme ve Takip", "description": "Hisse kaydınızı, telefon numaranız ve güvenlik kodunuz ile \"Hisse Sorgula\" sayfası üzerinden görüntüleyebilirsiniz. Bayram günü ise web sitemizin ana sayfasında yayınlanacak \"Kurbanlık Takip Ekranı\" aracılığıyla, kesim, paylaştırma ve teslimat işlemleri sırasında hangi kurbanlık üzerinde işlem yapıldığını anlık olarak takip edebilirsiniz."},
  {"title": "Gizlilik ve Veri Güvenliği", "description": "Paylaştığınız kişisel bilgiler sadece bu organizasyon kapsamında kullanılacak, hiçbir şekilde üçüncü şahıslarla paylaşılmayacaktır."},
  {"title": "Mücbir Sebep ve Gecikmeler", "description": "Tüm süreci titizlikle planlıyor ve uyguluyoruz. Ancak hava durumu, ulaşım engelleri veya diğer öngörülemeyen sebeplerden dolayı kurban kesimi veya hisse teslimatında gecikmeler yaşanabilir. Böyle bir durumda en kısa sürede bilgilendirme yapılacaktır."}
]'::jsonb
WHERE agreement_terms = '[]'::jsonb OR agreement_terms IS NULL;
