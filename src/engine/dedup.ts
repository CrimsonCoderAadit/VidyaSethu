/**
 * Cross-scheme / cross-ministry deduplication without storing Aadhaar.
 *
 * The Aadhaar number never touches storage. It is keyed-hashed (HMAC-SHA256 with
 * DEDUP_SECRET) the moment it arrives; only the hash and the last 4 digits are kept. The same
 * hash is what an NSP / DBT Tribal lookup would be keyed on, so duplicates are found across
 * MoTA schemes, across years, and against other ministries' beneficiary lists.
 *
 * Rules (from the guidelines):
 *  - Same scheme, same academic year, still active → DUPLICATE: blocked, applicant sent to the existing file.
 *  - Another MoTA scholarship in the same academic year (e.g. Post-Matric + Top Class, which the
 *    guidelines bar) → DOUBLE_BENEFIT: allowed to file, routed to L2 with the conflicting file named.
 *  - Found in the NSP beneficiary index for another ministry this year → NSP_MATCH: L2.
 * NFST/NOS fellowships can overlap in time with nothing; the check is the same.
 */
import { createHmac } from "crypto";

export type DedupFinding = {
  kind: "DUPLICATE" | "DOUBLE_BENEFIT" | "NSP_MATCH";
  message: string;
  conflictingId?: string;
};

const SECRET = process.env.DEDUP_SECRET ?? "vidya-setu-demo-dedup-key";

export function normalizeAadhaar(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 ? digits : null;
}

export function identityHash(aadhaar12: string): string {
  return createHmac("sha256", SECRET).update(`aadhaar:${aadhaar12}`).digest("hex");
}

/** Simulated NSP beneficiary index (hashes only), 2026-27: other ministries' scholarships. */
const NSP_INDEX: Record<string, { scheme: string; ministry: string }> = {
  [identityHash("999988887777")]: { scheme: "Post-Matric Scholarship for SC Students", ministry: "Ministry of Social Justice & Empowerment" },
  [identityHash("555566667777")]: { scheme: "Central Sector Scheme of Scholarships", ministry: "Department of Higher Education" },
};

type AppLike = { id: string; schemeCode: string; academicYear: string; identityHash?: string; status: string; authorisedDecision?: string };

const INACTIVE = new Set(["REJECTED", "WITHDRAWN"]);

export function checkDuplicates(args: { hash: string; schemeCode: string; academicYear: string; apps: AppLike[]; schemeName: (code: string) => string }): DedupFinding[] {
  const out: DedupFinding[] = [];
  const active = args.apps.filter((a) => a.identityHash === args.hash && !INACTIVE.has(a.status) && a.authorisedDecision !== "REJECTED");
  const same = active.find((a) => a.schemeCode === args.schemeCode && a.academicYear === args.academicYear);
  if (same) {
    out.push({ kind: "DUPLICATE", conflictingId: same.id, message: `This Aadhaar already has an active ${args.schemeName(args.schemeCode)} application for ${args.academicYear} (${same.id}).` });
  }
  for (const other of active.filter((a) => a.schemeCode !== args.schemeCode && a.academicYear.slice(0, 4) === args.academicYear.slice(0, 4))) {
    out.push({
      kind: "DOUBLE_BENEFIT",
      conflictingId: other.id,
      message: `Same Aadhaar also holds ${args.schemeName(other.schemeCode)} (${other.id}) this year. Only one MoTA scholarship is allowed at a time; confirm before sanction.`,
    });
  }
  const nsp = NSP_INDEX[args.hash];
  if (nsp) out.push({ kind: "NSP_MATCH", message: `NSP shows an active ${nsp.scheme} (${nsp.ministry}) for this Aadhaar in 2026-27. Possible double benefit across ministries.` });
  return out;
}
