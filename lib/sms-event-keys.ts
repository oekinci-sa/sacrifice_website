/** Kurban günü + ödeme güncellemesi otomatik SMS event anahtarları. */
export const SMS_AUTO_EVENT_KEYS = [
  "slaughter_approaching",
  "slaughter_imminent",
  "slaughter_completed",
  "butcher_started",
  "delivery_completed",
  "delivery_pickup_approaching",
  "payment_amount_updated",
] as const;

export type SmsAutoEventKey = (typeof SMS_AUTO_EVENT_KEYS)[number];

export const SMS_AUTO_EVENT_LABELS: Record<SmsAutoEventKey, string> = {
  slaughter_approaching: "Kesim Yaklaşıyor",
  slaughter_imminent: "Kesilmek Üzere",
  slaughter_completed: "Kesim Tamamlandı",
  butcher_started: "Parçalama Başladı",
  delivery_completed: "Teslim Edildi",
  delivery_pickup_approaching: "Teslim Almaya Çağrı",
  payment_amount_updated: "Ödeme Tutarı Güncellendi",
};

export const SMS_AUTO_EVENT_OPTIONS = SMS_AUTO_EVENT_KEYS.map((value) => ({
  value,
  label: SMS_AUTO_EVENT_LABELS[value],
}));

/** Kesim / parçalama / teslimat sırası sayfalarından tetiklenen event'ler. */
export const SMS_STAGE_AUTO_EVENT_KEYS = [
  "slaughter_approaching",
  "slaughter_imminent",
  "slaughter_completed",
  "butcher_started",
  "delivery_completed",
  "delivery_pickup_approaching",
] as const satisfies readonly SmsAutoEventKey[];

/** Hedef kurban + aralık ile giden SMS'ler; atlama kuralları her zaman uygulanır. */
export const SMS_OFFSET_AUTO_EVENT_KEYS = [
  "slaughter_approaching",
  "slaughter_imminent",
  "delivery_pickup_approaching",
] as const satisfies readonly SmsAutoEventKey[];

export function isSmsOffsetAutoEventKey(key: string): boolean {
  return (SMS_OFFSET_AUTO_EVENT_KEYS as readonly string[]).includes(key);
}

export function isSmsAutoEventKey(key: string | null | undefined): key is SmsAutoEventKey {
  return key != null && (SMS_AUTO_EVENT_KEYS as readonly string[]).includes(key);
}

export function smsAutoEventLabel(key: string | null | undefined): string | null {
  if (!key || !isSmsAutoEventKey(key)) return null;
  return SMS_AUTO_EVENT_LABELS[key];
}

/** Şablonlar sayfasında otomatik SMS kart sırası: ödeme → kesim → teslimat. */
export const SMS_AUTO_EVENT_UI_ORDER = [
  "payment_amount_updated",
  "slaughter_approaching",
  "slaughter_imminent",
  "slaughter_completed",
  "butcher_started",
  "delivery_completed",
  "delivery_pickup_approaching",
] as const satisfies readonly SmsAutoEventKey[];

function autoEventSortIndex(eventKey: string | null | undefined): number {
  if (!eventKey || !isSmsAutoEventKey(eventKey)) return 999;
  const idx = (SMS_AUTO_EVENT_UI_ORDER as readonly string[]).indexOf(eventKey);
  return idx === -1 ? 999 : idx;
}

/** Otomatik SMS şablonlarını gruplu sıralar (ödeme, kesim, teslimat). */
export function compareSmsAutoTemplatesByEventOrder<
  T extends { event_key: string | null },
>(a: T, b: T): number {
  return autoEventSortIndex(a.event_key) - autoEventSortIndex(b.event_key);
}

/** İpucu balonu: SMS ne zaman, kime gider (sade Türkçe). */
export type SmsAutoEventWhenInfo = {
  when: string;
  who: string;
  example?: (offset: number) => string;
};

export const SMS_AUTO_EVENT_WHEN_INFO: Record<SmsAutoEventKey, SmsAutoEventWhenInfo> = {
  slaughter_approaching: {
    when:
      "Kesim sırası ekranında bir kurbanın kesimi tamamlandı olarak işaretlendiğinde otomatik gider.",
    who: "Kesimhaneden teslim alacak hissedarlar; mesaj, işaretlenen kurban numarasının ilerisindeki (ayarladığınız kadar sonraki) kurbanlığa gider.",
    example: (n) =>
      `Örnek: 2 numara kesildi, aralık ${n} → 2 + ${n} = ${2 + n} numaralı kurbanın hissedarlarına “sıranız yaklaşıyor” benzeri mesaj gider.`,
  },
  slaughter_imminent: {
    when:
      "Kesim sırası ekranında bir kurbanın kesimi tamamlandı olarak işaretlendiğinde otomatik gider.",
    who: "Kesimhaneden teslim alacak hissedarlar; mesaj, sıraya çok yaklaşan kurbanlığa gider. Bu mesaj genelde daha kısa bir aralıkla kullanılır.",
    example: (n) =>
      `Örnek: 2 numara kesildi, aralık ${n} → ${2 + n} numaralı kurbanın hissedarlarına “kurbanlığınız kesilmek üzere” mesajı gider.`,
  },
  slaughter_completed: {
    when: "Kesim sırası ekranında o kurban kesildi olarak işaretlendiğinde.",
    who: "Aynı kurban numarasının hissedarları (kimlere gideceğini ayarlardan seçebilirsiniz).",
    example: () =>
      "Örnek: 12 numara kesildi olarak işaretlenirse, 12 numaralı kurbanın hissedarlarına kesim tamamlandı mesajı gider.",
  },
  butcher_started: {
    when: "Parçalama sırası ekranında o kurban parçalandı olarak işaretlendiğinde.",
    who: "Aynı kurban numarasının hissedarları; çoğunlukla kesimhaneden alacak olanlar.",
    example: () =>
      "Örnek: 12 numara parçalama aşamasına alındıysa, 12 numaralı kurbanın hissedarlarına parçalama başladı mesajı gider.",
  },
  delivery_completed: {
    when: "Teslimat sırası ekranında o kurban teslim edildi olarak işaretlendiğinde.",
    who: "Kesimhaneden teslim alacak hissedarlara bir metin, kesimhane dışında teslim alacak hissedarlara şablondaki ikinci metin kutusundan ayrı mesaj gider.",
    example: () =>
      "Örnek: 18 numara teslim edildi olarak işaretlenirse, 18 numaralı kurbanın kesimhaneden alacaklarına ve dış teslimat alacaklarına ayrı SMS gider.",
  },
  delivery_pickup_approaching: {
    when:
      "Teslimat sırası ekranında bir kurban teslim edildi olarak işaretlendiğinde (kesim değil, teslimat sırası).",
    who: "Kesimhaneden teslim alacak hissedarlar; mesaj, teslim edilen numaranın ilerisindeki kurbanlığa gider.",
    example: (n) =>
      `Örnek: 18 numara teslim edildi, aralık ${n} → ${18 + n} numaralı kurbanın hissedarlarına “teslim için gelin” mesajı gider.`,
  },
  payment_amount_updated: {
    when: "Ödemeler veya hissedar kaydında ödenen tutar değiştirildiğinde.",
    who: "Sadece o satırdaki hissedarın kayıtlı cep telefonuna.",
    example: () =>
      "Örnek: Ayşe Yılmaz’ın ödenen tutarı değiştirildiğinde, mesaj yalnızca Ayşe Yılmaz’ın kayıtlı cep telefonuna gider.",
  },
};

/** Offset event ayarlarında sabit notlar (her zaman uygulanır). */
export const SMS_OFFSET_EVENT_FIXED_RULES_NOTES = {
  missing: "Hedef kurban yoksa gönderme — işaretlenen numara + aralık ile hesaplanan kurban kayıtlı değilse SMS atlanır.",
  completedSlaughter:
    "Hedef kurbanın kesimi zaten işaretlendiyse gönderme — sıra çok ilerlediyse gereksiz uyarı gitmesin diye.",
  completedDelivery:
    "Hedef kurbanın teslimatı zaten işaretlendiyse gönderme — sıra çok ilerlediyse gereksiz uyarı gitmesin diye.",
} as const;
