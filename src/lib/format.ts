/** Small display-only helpers: turn engine enums, field ids, and raw ISO
 * timestamps into copy a human reads on a dashboard, without touching the
 * underlying data. */

const SMALL_WORDS = new Set(["of", "the", "for", "and", "or", "a", "an", "to", "in", "on"]);
const ACRONYMS = new Set(["st", "pvtg", "qs", "ocr", "nos", "nfst", "ino", "mota", "dbt", "pfms", "nsp", "ai", "digilocker"]);

/** MOTA_SCRUTINY -> "MoTA scrutiny", ELIGIBILITY_ONLY -> "Eligibility only" */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return "Not set";
  const words = value.split(/[_\s]+/).map((w) => w.toLowerCase());
  return words
    .map((w, i) => {
      if (w === "mota") return "MoTA";
      if (w === "ino") return "Institution officer";
      if (w === "hitl") return "review level";
      if (ACRONYMS.has(w)) return w.toUpperCase();
      if (i === 0 || !SMALL_WORDS.has(w)) return w.charAt(0).toUpperCase() + w.slice(1);
      return w;
    })
    .join(" ");
}

/** MERIT_WITH_PREFERENCES -> "Merit, with preferences" (selection-model labels read better with the comma) */
export function humanizeSelectionModel(value: string | null | undefined): string {
  const label = humanizeEnum(value);
  return label.replace(" with ", ", with ").replace(" only", " only");
}

const HITL_COPY: Record<string, string> = {
  L0: "Routine",
  L1: "Needs a quick confirm",
  L2: "Needs review",
  L3: "Escalated",
};

export function hitlLabel(level: string): string {
  return HITL_COPY[level] ?? level;
}

/** 2026-09-12T08:00:00.000Z -> "12 Sep, 8:00 am" in the reader's local time. */
export function friendlyDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const timePart = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  return `${datePart}, ${timePart}`;
}

export function friendlyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** fullName -> "Full name", mastersPercentage -> "Masters percentage", qsWorldRank -> "QS world rank" */
export function humanizeField(camelOrSnake: string): string {
  const spaced = camelOrSnake.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced
    .split(" ")
    .filter(Boolean)
    .map((w, i) => {
      const lw = w.toLowerCase();
      if (ACRONYMS.has(lw)) return lw.toUpperCase();
      if (i === 0) return w.charAt(0).toUpperCase() + w.slice(1);
      return lw;
    })
    .join(" ");
}

/** Looks up the human label a scheme's own form gave an option value, e.g. field
 * "fieldOfStudy" value "STEM" -> "Pure/Applied Science / Engineering / Technology / Mathematics (10 slots)".
 * Falls back to humanizeEnum(value) when the scheme has no matching option (or none is known here). */
export function optionLabel(
  scheme: { applicationSchema: { id: string; options?: { value: string; label: string }[] }[] } | null | undefined,
  fieldId: string,
  value: unknown,
): string {
  if (value == null) return "Not set";
  const raw = String(value);
  const field = scheme?.applicationSchema.find((f) => f.id === fieldId);
  const match = field?.options?.find((o) => o.value === raw);
  return match?.label ?? humanizeEnum(raw);
}
