/**
 * Bizim SMS API istemcisi.
 *
 * API belgeleri: .sms-api-docs/bizim-sms/
 * Base URL: https://api.sms.bizimsms.mobi (credential-info.txt)
 *
 * SMS gönderim: POST /api/smspost/v1  (XML body)
 * Kredi sorgu:  GET  /api/credit/v1
 * Originator:   GET  /api/originator/v1
 * DLR sorgu:    GET  /api/dlr/v1 (Faz 2)
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
  dlrId: number;
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

/** SMS gönderir. Başarıda dlrId döner; hata durumunda SmsError. */
export async function sendSms(params: SmsSendParams): Promise<SmsSendResult> {
  if (!params.messages.length) {
    return { ok: false, code: "83", message: "Gönderilecek alıcı yok" };
  }

  const xml = buildSmsXml(params);
  const url = `${params.credentials.apiBase}/api/smspost/v1`;

  let responseText: string;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8" },
      body: xml,
    });
    responseText = await res.text();
  } catch (err) {
    return {
      ok: false,
      code: "NETWORK",
      message: `SMS API'ye bağlanılamadı: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const trimmed = responseText.trim();
  if (trimmed.startsWith("00 ")) {
    const dlrId = parseInt(trimmed.slice(3).trim(), 10);
    return { ok: true, dlrId: isNaN(dlrId) ? 0 : dlrId };
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

  let res: Response;
  let responseText: string;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/plain, */*",
        "User-Agent": "ankarakurban-sms/1.0",
      },
    });
    responseText = await res.text();
  } catch (err) {
    return {
      ok: false,
      code: "NETWORK",
      message: `Kredi sorgusu başarısız: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

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

// ─── DLR (İletim Raporu) ───────────────────────────────────────────────────

export interface DlrEntry {
  /** API'den dönen ham telefon numarası (normalize edilmemiş). */
  phone: string;
  /** 0=Bekliyor, 5=Operatöre iletildi, 6=Ulaşmadı, 9=Telefona ulaştı */
  status: 0 | 5 | 6 | 9;
}

export interface SmsQueryDlrSuccess {
  ok: true;
  /** 25=DLR güncellenmeye devam ediyor, 23=Rapor finalize */
  operationCode: 25 | 23;
  /** operationCode=23 ise true — dlr_completed=true yapılabilir */
  isFinal: boolean;
  entries: DlrEntry[];
}

export type SmsQueryDlrResult = SmsQueryDlrSuccess | SmsError;

/**
 * Belirli bir dlrId için iletim raporu sorgular.
 *
 * Başarılı yanıt formatı: `25 905551234567 9|905557654321 6|...`
 * Operasyon kodu (25/23) ayrı, alıcı durum kodu (0/5/6/9) ayrı parse edilir.
 */
export async function queryDlr(
  credentials: { username: string; password: string; apiBase: string },
  dlrId: number
): Promise<SmsQueryDlrResult> {
  const url = `${credentials.apiBase}/api/dlr/v1?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}&id=${dlrId}`;

  let responseText: string;
  try {
    const res = await fetch(url, { method: "GET" });
    responseText = await res.text();
  } catch (err) {
    return {
      ok: false,
      code: "NETWORK",
      message: `DLR sorgusu başarısız: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const trimmed = responseText.trim();
  const spaceIdx = trimmed.indexOf(" ");
  const codeStr = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1);
  const opCode = parseInt(codeStr, 10);

  if (opCode === 25 || opCode === 23) {
    const entries: DlrEntry[] = [];
    if (rest) {
      for (const block of rest.split("|")) {
        const parts = block.trim().split(/\s+/);
        if (parts.length >= 2) {
          const phone = parts[0];
          const statusNum = parseInt(parts[parts.length - 1], 10);
          if ([0, 5, 6, 9].includes(statusNum)) {
            entries.push({ phone, status: statusNum as 0 | 5 | 6 | 9 });
          }
        }
      }
    }
    return {
      ok: true,
      operationCode: opCode as 25 | 23,
      isFinal: opCode === 23,
      entries,
    };
  }

  return { ok: false, code: codeStr, message: getSmsErrorMessage(codeStr) };
}

/** Onaylı SMS başlıklarını sorgular. */
export async function queryOriginators(credentials: {
  username: string;
  password: string;
  apiBase: string;
}): Promise<{ ok: true; originators: string[] } | SmsError> {
  const url = `${credentials.apiBase}/api/originator/v1?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`;

  let res: Response;
  let responseText: string;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/plain, */*",
        "User-Agent": "ankarakurban-sms/1.0",
      },
    });
    responseText = await res.text();
  } catch (err) {
    return {
      ok: false,
      code: "NETWORK",
      message: `Originator sorgusu başarısız: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

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
