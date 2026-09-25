/**
 * Vidya Setu WhatsApp / SMS assistant.
 *
 * Applicants don't need to log in to a portal to know where their file is:
 *  - Inbound: send an application ID (or STATUS / DOCS / LANG) to the Vidya Setu number.
 *  - Outbound: every applicant notification (deficiency raised, institution flag, award,
 *    payment) is also pushed to their registered mobile as a WhatsApp message, with SMS as
 *    the fallback for feature phones.
 * Identity = the registered mobile. Status for an application is only disclosed to the
 * mobile that owns it.
 */
import { humanizeEnum } from "./format";
import { asLang, t, type Lang } from "./i18n";
import type { ApplicationRecord, Database, OutboxMessage, UserRecord } from "./models";

export const BOT_NUMBER = "+91 1800-11-2026";

export function normalizeMobile(raw: string): string {
  return raw.replace(/\D/g, "").slice(-10);
}

const APP_ID = /(?:^|\s)([A-Z_]{3,11}-\d{4}-\d{4}|[A-Z_]{3,5}-\d{6})(?=\s|$)/i;

type Copy = Record<Lang, string>;
const C = {
  menu: {
    en: "Namaste! Vidya Setu scholarship help.\nReply with:\n• STATUS — all your applications\n• <application ID> — one application\n• DOCS <ID> — what you need to fix\n• LANG HI / LANG OR / LANG EN — language",
    hi: "नमस्ते! विद्या सेतु छात्रवृत्ति सहायता।\nजवाब में भेजें:\n• STATUS — आपके सभी आवेदन\n• <आवेदन नंबर> — एक आवेदन\n• DOCS <नंबर> — क्या सुधारना है\n• LANG HI / LANG OR / LANG EN — भाषा",
    or: "ନମସ୍କାର! ବିଦ୍ୟା ସେତୁ ଛାତ୍ରବୃତ୍ତି ସହାୟତା।\nଉତ୍ତରରେ ପଠାନ୍ତୁ:\n• STATUS — ଆପଣଙ୍କ ସମସ୍ତ ଆବେଦନ\n• <ଆବେଦନ ନମ୍ବର> — ଗୋଟିଏ ଆବେଦନ\n• DOCS <ନମ୍ବର> — କ'ଣ ସୁଧାରିବାକୁ ହେବ\n• LANG HI / LANG OR / LANG EN — ଭାଷା",
  },
  unknownNumber: {
    en: "This mobile is not registered with Vidya Setu. Send the message from the mobile you gave in your application, or visit your nearest CSC.",
    hi: "यह मोबाइल विद्या सेतु में पंजीकृत नहीं है। आवेदन में दिए मोबाइल से संदेश भेजें, या नज़दीकी CSC केंद्र जाएँ।",
    or: "ଏହି ମୋବାଇଲ୍ ବିଦ୍ୟା ସେତୁରେ ପଞ୍ଜୀକୃତ ନୁହେଁ। ଆବେଦନରେ ଦେଇଥିବା ମୋବାଇଲରୁ ପଠାନ୍ତୁ, କିମ୍ବା ନିକଟସ୍ଥ CSC ଯାଆନ୍ତୁ।",
  },
  notYours: {
    en: "For your privacy, the status of an application is only sent to its registered mobile.",
    hi: "आपकी गोपनीयता के लिए, आवेदन की स्थिति केवल पंजीकृत मोबाइल पर भेजी जाती है।",
    or: "ଆପଣଙ୍କ ଗୋପନୀୟତା ପାଇଁ, ଆବେଦନ ସ୍ଥିତି କେବଳ ପଞ୍ଜୀକୃତ ମୋବାଇଲକୁ ପଠାଯାଏ।",
  },
  none: { en: "No applications found for this mobile.", hi: "इस मोबाइल पर कोई आवेदन नहीं मिला।", or: "ଏହି ମୋବାଇଲରେ କୌଣସି ଆବେଦନ ମିଳିଲା ନାହିଁ।" },
  stage: { en: "Stage", hi: "चरण", or: "ପର୍ଯ୍ୟାୟ" },
  fix: { en: "Action needed", hi: "आपको करना है", or: "ଆପଣଙ୍କୁ କରିବାକୁ ହେବ" },
  allClear: { en: "Nothing pending from you. We will message you when the stage changes.", hi: "आपकी ओर से कुछ बाकी नहीं। चरण बदलने पर हम संदेश भेजेंगे।", or: "ଆପଣଙ୍କ ପାଖରୁ କିଛି ବାକି ନାହିଁ। ପର୍ଯ୍ୟାୟ ବଦଳିଲେ ଆମେ ମେସେଜ୍ ପଠାଇବୁ।" },
  replyDocs: { en: "Reply DOCS {id} for details.", hi: "विवरण के लिए DOCS {id} भेजें।", or: "ବିବରଣୀ ପାଇଁ DOCS {id} ପଠାନ୍ତୁ।" },
  langSet: { en: "Language set to English.", hi: "भाषा हिन्दी कर दी गई है।", or: "ଭାଷା ଓଡ଼ିଆ କରାଗଲା।" },
  alertPrefix: { en: "Vidya Setu alert", hi: "विद्या सेतु सूचना", or: "ବିଦ୍ୟା ସେତୁ ସୂଚନା" },
  openLink: { en: "Fix it on your phone:", hi: "फ़ोन पर ठीक करें:", or: "ଫୋନରେ ସୁଧାରନ୍ତୁ:" },
} satisfies Record<string, Copy>;

const L = (key: keyof typeof C, lang: Lang, vars: Record<string, string> = {}) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), C[key][lang]);

function openItems(app: ApplicationRecord): string[] {
  const items = app.deficiencies.filter((d) => d.status === "OPEN").map((d) => d.reason);
  for (const doc of app.documents) {
    if (doc.recovery?.status === "OPEN" && doc.recovery.path !== "ASSISTED_ENTRY") {
      items.push(`${humanizeEnum(doc.documentType)}: ${doc.recovery.guidance}`);
    }
  }
  return [...new Set(items)];
}

export function statusText(app: ApplicationRecord, lang: Lang): string {
  const items = openItems(app);
  const lines = [`📄 ${app.id}`, `${L("stage", lang)}: ${t(lang, humanizeEnum(app.status))}`];
  if (items.length) {
    lines.push(`⚠️ ${L("fix", lang)}: ${items[0]}`);
    lines.push(L("replyDocs", lang, { id: app.id }));
  } else {
    lines.push(`✅ ${L("allClear", lang)}`);
  }
  return lines.join("\n");
}

/** SMS fallback: one 160-char GSM segment in English, or 70-char UCS-2 segments for Indic scripts. */
export function toSms(text: string): string {
  const flat = text.replace(/[📄⚠️✅🔔]/gu, "").replace(/\s*\n\s*/g, " · ").trim();
  const limit = /^[\x00-\x7F₹]*$/.test(flat) ? 160 : 140; // 2 Unicode segments
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

function log(db: Database, user: UserRecord | undefined, to: string, body: string, direction: OutboxMessage["direction"], channel: OutboxMessage["channel"]) {
  db.outbox.unshift({
    id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: user?.id ?? "",
    to,
    channel,
    body: channel === "SMS" && direction === "OUT" ? toSms(body) : body,
    at: new Date().toISOString(),
    status: direction === "OUT" ? "SENT" : "DELIVERED",
    direction,
  });
}

/** Proactive alert: called for every applicant notification. */
export function queueApplicantAlert(db: Database, user: UserRecord, title: string, body: string) {
  if (user.role !== "APPLICANT" || !user.mobile) return;
  const lang = asLang(user.lang);
  const text = `🔔 ${L("alertPrefix", lang)}\n${title}\n${body}\n${L("openLink", lang)} vidyasetu.gov.in/a`;
  log(db, user, user.mobile, text, "OUT", "WHATSAPP");
}

/** Handle one inbound message. Mutates `db` (logs both directions) and returns the reply text. */
export function handleInbound(db: Database, fromRaw: string, textRaw: string, channel: OutboxMessage["channel"] = "WHATSAPP"): string {
  const from = normalizeMobile(fromRaw);
  const text = textRaw.trim();
  const user = db.users.find((u) => u.mobile && normalizeMobile(u.mobile) === from);
  log(db, user, from, text, "IN", channel);

  const reply = (() => {
    if (!user) return L("unknownNumber", "en") + "\n\n" + L("unknownNumber", "hi");
    let lang = asLang(user.lang);
    const upper = text.toUpperCase();

    const langCmd = upper.match(/^LANG\s+(EN|HI|OR)\b/);
    if (langCmd) {
      lang = langCmd[1].toLowerCase() as Lang;
      user.lang = lang;
      return L("langSet", lang);
    }

    const mine = db.applications.filter((a) => a.applicantId === user.id);
    const idMatch = text.match(APP_ID);
    if (idMatch) {
      const app = db.applications.find((a) => a.id.toUpperCase() === idMatch[1].toUpperCase());
      if (!app || app.applicantId !== user.id) return L("notYours", lang);
      if (upper.startsWith("DOCS")) {
        const items = openItems(app);
        return items.length ? `📄 ${app.id}\n${items.map((i, n) => `${n + 1}. ${i}`).join("\n")}` : `✅ ${L("allClear", lang)}`;
      }
      return statusText(app, lang);
    }

    if (/^(STATUS|STATE|स्थिति|ସ୍ଥିତି)\b/i.test(text) || upper === "DOCS") {
      if (!mine.length) return L("none", lang);
      return mine.map((a) => statusText(a, lang)).join("\n\n");
    }
    return L("menu", lang);
  })();

  log(db, user, from, reply, "OUT", channel);
  return reply;
}
