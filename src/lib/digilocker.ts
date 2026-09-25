/**
 * DigiLocker "Requester" integration, simulated.
 *
 * Live flow (DigiLocker Authorized Partner API, OAuth 2.0 + PKCE):
 *   1. GET  https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?response_type=code&client_id=…&redirect_uri=…&state=…&code_challenge=…
 *      (the applicant signs in with Aadhaar OTP / DigiLocker PIN and consents to share)
 *   2. POST /public/oauth2/1/token                     → access_token
 *   3. GET  /public/oauth2/2/files/issued              → issued documents (uri, doctype, issuer)
 *   4. GET  /public/oauth2/1/xml/{uri}                 → issuer-signed e-document XML (structured fields)
 * Structured XML means no OCR at all: the fields come straight from the issuing department.
 *
 * The prototype returns the same shape from a fixed issuer catalogue so the demo runs without
 * partner credentials. With DIGILOCKER_CLIENT_ID set, swap `fetchIssued` for the live calls above.
 */

export type IssuedDocument = {
  uri: string;
  doctype: string;
  name: string;
  issuer: string;
  issuedOn: string;
  /** Our scheme document id this satisfies. */
  mapsTo: string;
  /** Structured fields from the issuer's signed XML. */
  fields: Record<string, string | number | boolean>;
};

export const DIGILOCKER_MODE = process.env.DIGILOCKER_CLIENT_ID ? "live-configured" : "simulated";

/** Documents that DigiLocker issuers publish for this doc type; BANK / proposals are not DigiLocker-issued. */
export const DIGILOCKER_ISSUABLE = new Set(["ST_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "AADHAAR", "DISABILITY_CERTIFICATE", "PVTG_CERTIFICATE"]);

const ISSUERS: Record<string, { doctype: string; name: string; issuer: string; fields: (n: string, st: string) => IssuedDocument["fields"] }> = {
  ST_CERTIFICATE: { doctype: "CASTE", name: "Scheduled Tribe Certificate", issuer: "Revenue & Land Reforms Dept.", fields: (n, st) => ({ fullName: n, stStatus: true, domicileState: st }) },
  INCOME_CERTIFICATE: { doctype: "INCER", name: "Income Certificate", issuer: "Revenue & Land Reforms Dept.", fields: (n) => ({ fullName: n, familyIncome: 180000 }) },
  MARKSHEET: { doctype: "SSCER", name: "Class X Marksheet", issuer: "State Board of Secondary Education", fields: (n) => ({ fullName: n, mastersPercentage: 82.4 }) },
  AADHAAR: { doctype: "ADHAR", name: "Aadhaar Card", issuer: "UIDAI", fields: (n) => ({ fullName: n, aadhaarLinked: true }) },
  DISABILITY_CERTIFICATE: { doctype: "DSCER", name: "UDID Disability Certificate", issuer: "Dept. of Empowerment of PwD", fields: () => ({ divyangjan: true }) },
  PVTG_CERTIFICATE: { doctype: "CASTE", name: "PVTG Certificate", issuer: "Revenue & Land Reforms Dept.", fields: () => ({ pvtg: true }) },
};

const STATE_ISSUER_PREFIX: Record<string, string> = { JH: "in.gov.jharkhand", OD: "in.gov.odisha", CG: "in.gov.cgstate", MP: "in.gov.mp" };

export function fetchIssued(docIds: string[], applicant: { name: string; stateCode?: string }): IssuedDocument[] {
  const prefix = STATE_ISSUER_PREFIX[applicant.stateCode ?? "JH"] ?? "in.gov.state";
  return docIds
    .filter((id) => ISSUERS[id])
    .map((id, i) => {
      const def = ISSUERS[id];
      const org = id === "AADHAAR" ? "in.gov.uidai" : prefix;
      return {
        uri: `${org}-${def.doctype}-${(4200117 + i * 7919).toString(36).toUpperCase()}`,
        doctype: def.doctype,
        name: def.name,
        issuer: id === "AADHAAR" ? "UIDAI" : def.issuer,
        issuedOn: "2025-06-1" + (i % 9),
        mapsTo: id,
        fields: def.fields(applicant.name, applicant.stateCode ?? "JH"),
      };
    });
}
