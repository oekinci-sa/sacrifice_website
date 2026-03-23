import { normalizeEmail } from "@/lib/email-utils";

export type MailSource = "panel" | "shareholder" | "reminder";

export type MailRecipientRow = {
  rowId: string;
  normalizedEmail: string;
  mailSahibi: string;
  mailAdresi: string;
  sources: MailSource[];
  /** Kısa kaynak etiketleri (tabloda aralıklı gösterim) */
  kaynakParcalari: string[];
  /** Arama için birleşik metin */
  kaynakKisa: string;
  /** E-posta yoksa seçilemez / gönderilemez */
  canSend: boolean;
};

type PanelUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type ShareholderContact = {
  email: string;
  shareholder_name: string;
  sacrifice_year: number;
};

type ReminderContact = {
  id: string;
  name: string;
  phone: string;
  sacrifice_year: number;
  email: string | null;
};

const SOURCE_LABEL_SHORT: Record<MailSource, string> = {
  panel: "Site Yön.",
  shareholder: "Hissedar",
  reminder: "Haber ver",
};

const SOURCE_ORDER: MailSource[] = ["panel", "reminder", "shareholder"];

function pickBetterName(a: string, b: string): string {
  const ta = a.trim();
  const tb = b.trim();
  if (!tb || tb === "—") return ta || "—";
  if (!ta || ta === "—") return tb;
  return tb.length > ta.length ? tb : ta;
}

function formatSourceLabels(sources: Set<MailSource>): { parts: string[]; kisa: string } {
  const ordered = SOURCE_ORDER.filter((s) => sources.has(s));
  const parts = ordered.map((s) => SOURCE_LABEL_SHORT[s]);
  return { parts, kisa: parts.join(" ") };
}

/**
 * Panel, hissedar ve bana haber ver kayıtlarını e-postaya göre birleştirir;
 * aynı adres birden fazla kaynakta ise kaynak kolonunda kısa gösterim üretir.
 */
export function buildMailRecipientRows(
  panelUsers: PanelUser[],
  shareholderContacts: ShareholderContact[],
  reminderContacts: ReminderContact[]
): MailRecipientRow[] {
  type Agg = {
    normalizedEmail: string;
    mailAdresi: string;
    mailSahibi: string;
    sources: Set<MailSource>;
    canSend: boolean;
  };

  const byNorm = new Map<string, Agg>();
  const noEmailRows: MailRecipientRow[] = [];

  const merge = (normKey: string, emailDisplay: string, name: string, source: MailSource, canSend: boolean) => {
    const existing = byNorm.get(normKey);
    if (!existing) {
      byNorm.set(normKey, {
        normalizedEmail: normKey,
        mailAdresi: emailDisplay,
        mailSahibi: name.trim() || "—",
        sources: new Set([source]),
        canSend,
      });
      return;
    }
    existing.sources.add(source);
    existing.mailSahibi = pickBetterName(existing.mailSahibi, name);
    existing.canSend = existing.canSend || canSend;
  };

  for (const u of panelUsers) {
    const em = u.email?.trim();
    if (!em) continue;
    const norm = normalizeEmail(em);
    merge(norm, em, u.name?.trim() || "—", "panel", true);
  }

  for (const r of shareholderContacts) {
    const em = r.email.trim();
    const norm = normalizeEmail(em);
    merge(norm, em, r.shareholder_name?.trim() || "—", "shareholder", true);
  }

  for (const r of reminderContacts) {
    const rawEmail = r.email?.trim();
    const name = r.name?.trim() || "—";
    if (rawEmail) {
      const norm = normalizeEmail(rawEmail);
      merge(norm, rawEmail, name, "reminder", true);
    } else {
      const { parts, kisa } = formatSourceLabels(new Set<MailSource>(["reminder"]));
      noEmailRows.push({
        rowId: `reminder-${r.id}-no-email`,
        normalizedEmail: "",
        mailAdresi: "—",
        mailSahibi: name,
        sources: ["reminder"],
        kaynakParcalari: parts,
        kaynakKisa: kisa,
        canSend: false,
      });
    }
  }

  const merged: MailRecipientRow[] = [];
  for (const agg of Array.from(byNorm.values())) {
    const { parts, kisa } = formatSourceLabels(agg.sources);
    merged.push({
      rowId: `merged-${agg.normalizedEmail}`,
      normalizedEmail: agg.normalizedEmail,
      mailAdresi: agg.mailAdresi,
      mailSahibi: agg.mailSahibi,
      sources: SOURCE_ORDER.filter((s) => agg.sources.has(s)),
      kaynakParcalari: parts,
      kaynakKisa: kisa,
      canSend: agg.canSend,
    });
  }

  merged.sort((a, b) => a.mailAdresi.localeCompare(b.mailAdresi, "tr"));
  noEmailRows.sort((a, b) => a.mailSahibi.localeCompare(b.mailSahibi, "tr"));

  return [...merged, ...noEmailRows];
}
