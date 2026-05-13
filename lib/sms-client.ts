/**
 * Bizim SMS API istemcisi.
 *
 * API belgeleri: .sms-api-docs/bizim-sms/
 * Taban URL: `sms-config` → `apiBase` (env `BIZIM_SMS_API_BASE`; varsayılan dokümantasyon HTTPS adresi).
 *
 * SMS gönderim: POST /api/smspost/v1  (XML body)
 * Kredi sorgu:  GET  /api/credit/v1
 * Originator:   GET  /api/originator/v1
 */

export interface SmsSendMessage {
  phone: string;      // 12 hane: 905xxxxxxxxx
  message: string;
}

export interface SmsSendParams {
  credentials: { username: string; password: string; originator: string; apiBase: string };
  messages: SmsSendMessage[];
  /** Faz 3: zamanlanmış gönderim — "2025.7.23.9.30.0" */
  sendDateTime?: string;
}

export interface SmsSendSuccess {
  ok: true;
}

export interface SmsError {
  ok: false;
  code: string;
  message: string;
}

export type SmsSendResult = SmsSendSuccess | SmsError;
export type SmsCreditResult = { ok: true; credits: number } | SmsError;

const SMS_ERROR_MESSAGES: Record<string, string> = {
  "99": "Bilinmeyen hata oluştu",
  "97": "İstek HTTP POST ile gönderilmeli",
  "95": "İstek HTTP GET ile gönderilmeli",
  "93": "GET parametrelerinde eksik var",
  "91": "POST verisi okunamadı",
  "89": "XML formatı hatalı",
  "87": "Kullanıcı adı veya şifre hatalı",
  "85": "Mesaj başlığı bulunamadı veya onaylanmamış",
  "84": "Gönderim zamanı hatalı veya 1 yıldan fazla ileriye işaret ediyor",
  "83": "Geçerli telefon veya mesaj metni yok",
  "81": "Yetersiz SMS kredisi",
  "79": "DLR ID bulunamadı",
  "77": "Aynı mesaj son 2 dakika içinde zaten gönderildi",
};

function getSmsErrorMessage(code: string): string {
  return SMS_ERROR_MESSAGES[code] ?? `SMS API hatası (kod: ${code})`;
}

/** Tek taban URL (`sms-config` → `credentials.apiBase`, env: `BIZIM_SMS_API_BASE`). İkinci adres denemesi yok. */
type BizimFetched = { ok: true; res: Response; text: string } | SmsError;

async function fetchBizimGet(url: string, errorPrefix: string): Promise<BizimFetched> {
  const headers = {
    Accept: "text/plain, */*",
    "User-Agent": "ankarakurban-sms/1.0",
  } as const;

  try {
    const res = await fetch(url, { method: "GET", headers });
    const text = await res.text();
    return { ok: true, res, text };
  } catch (e) {
    return {
      ok: false,
      code: "NETWORK",
      message: `${errorPrefix}: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

async function fetchBizimPostXml(
  url: string,
  xml: string,
  errorPrefix: string
): Promise<BizimFetched> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8" },
      body: xml,
    });
    const text = await res.text();
    return { ok: true, res, text };
  } catch (e) {
    return {
      ok: false,
      code: "NETWORK",
      message: `${errorPrefix}: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/** 1-N veya N-N XML oluşturur. */
function buildSmsXml(params: SmsSendParams): string {
  const { credentials, messages, sendDateTime } = params;
  const { username, password, originator } = credentials;

  const header = `<username>${username}</username>\n  <password>${password}</password>\n  <header>${originator}</header>\n  <validity>2880</validity>`;
  const dateTimeTag = sendDateTime
    ? `\n  <sendDateTime>${sendDateTime}</sendDateTime>`
    : "";

  // Tüm mesajlar aynıysa 1-N, farklıysa N-N
  const uniqueMessages = new Set(messages.map((m) => m.message));
  const isSingleMessage = uniqueMessages.size === 1;

  if (isSingleMessage && messages.length > 0) {
    const noTags = messages
      .map((m) => `      <no>${m.phone}</no>`)
      .join("\n");
    const msg = messages[0].message;
    return `<sms>\n  ${header}${dateTimeTag}\n  <message>\n    <gsm>\n${noTags}\n    </gsm>\n    <msg><![CDATA[${msg}]]></msg>\n  </message>\n</sms>`;
  }

  const mbTags = messages
    .map(
      (m) =>
        `    <mb>\n      <no>${m.phone}</no>\n      <msg><![CDATA[${m.message}]]></msg>\n    </mb>`
    )
    .join("\n");
  return `<sms>\n  ${header}${dateTimeTag}\n  <messages>\n${mbTags}\n  </messages>\n</sms>`;
}

/** SMS gönderir. Başarıda Bizim SMS `00 …` yanıtı doğrulanır (iletim raporu uygulamada tutulmaz). */
export async function sendSms(params: SmsSendParams): Promise<SmsSendResult> {
  if (!params.messages.length) {
    return { ok: false, code: "83", message: "Gönderilecek alıcı yok" };
  }

  const xml = buildSmsXml(params);
  const url = `${params.credentials.apiBase}/api/smspost/v1`;

  const fetched = await fetchBizimPostXml(url, xml, "SMS API'ye bağlanılamadı");
  if (!fetched.ok) return fetched;

  const responseText = fetched.text;
  const trimmed = responseText.trim();
  if (trimmed.startsWith("00 ")) {
    return { ok: true };
  }

  const code = trimmed.split(" ")[0];
  return { ok: false, code, message: getSmsErrorMessage(code) };
}

/** Mevcut kredi bakiyesini sorgular. */
export async function queryCredit(credentials: {
  username: string;
  password: string;
  apiBase: string;
}): Promise<SmsCreditResult> {
  const url = `${credentials.apiBase}/api/credit/v1?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

  const fetched = await fetchBizimGet(url, "Kredi sorgusu başarısız");
  if (!fetched.ok) return fetched;

  const { res, text: responseText } = fetched;

  if (!res.ok) {
    return {
      ok: false,
      code: "HTTP",
      message: `SMS API yanıt vermedi (HTTP ${res.status}).`,
    };
  }

  let trimmed = responseText.trim();
  if (trimmed.charCodeAt(0) === 0xfeff) {
    trimmed = trimmed.slice(1).trim();
  }
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";

  if (firstLine.startsWith("00 ")) {
    const credits = parseInt(firstLine.slice(3).trim(), 10);
    return { ok: true, credits: isNaN(credits) ? 0 : credits };
  }

  const code = firstLine.split(/\s+/)[0] || "?";
  return { ok: false, code, message: getSmsErrorMessage(code) };
}

/** Onaylı SMS başlıklarını sorgular. */
export async function queryOriginators(credentials: {
  username: string;
  password: string;
  apiBase: string;
}): Promise<{ ok: true; originators: string[] } | SmsError> {
  const url = `${credentials.apiBase}/api/originator/v1?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

  const fetched = await fetchBizimGet(url, "Originator sorgusu başarısız");
  if (!fetched.ok) return fetched;

  const { res, text: responseText } = fetched;

  if (!res.ok) {
    return {
      ok: false,
      code: "HTTP",
      message: `SMS API yanıt vermedi (HTTP ${res.status}).`,
    };
  }

  let trimmed = responseText.trim();
  if (trimmed.charCodeAt(0) === 0xfeff) {
    trimmed = trimmed.slice(1).trim();
  }
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";

  if (firstLine.startsWith("00 ")) {
    const list = firstLine
      .slice(3)
      .trim()
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    return { ok: true, originators: list };
  }

  const code = firstLine.split(/\s+/)[0] || "?";
  return { ok: false, code, message: getSmsErrorMessage(code) };
}
