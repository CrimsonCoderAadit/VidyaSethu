# MoTA Scholarship & Fellowship Docket

SIH Problem Statement 26239 — a configurable platform for Ministry of Tribal Affairs scholarship and fellowship administration.

## What this prototype proves

Eligibility and selection are separate layers, and they are scheme-specific:

| Scheme | Implementation | Selection model |
| --- | --- | --- |
| Pre-Matric | States/UTs + DBT | `ELIGIBILITY_ONLY` |
| Post-Matric | States/UTs + DBT | `ELIGIBILITY_ONLY` (Top Class institutes excluded) |
| Top Class / National Scholarship | Central + NSP | `ELIGIBILITY_ONLY` on the current 265-institute list |
| NFST | Central fellowship portal | `MERIT_WITH_PREFERENCES` / quota buckets (750) |
| NOS | Central overseas portal | `COMMITTEE_RANKED` + quota buckets (20) |

Rules are versioned (`rule_version`, `effective_from`, `source_document`, `source_page`). Current-vs-old conflicts are stored, not silently merged. Latest dated amendment wins.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Every demo account uses password `demo`.

| Desk | Email |
| --- | --- |
| Applicant | applicant@mota.demo |
| Institution nodal officer | ino@mota.demo |
| State/UT (Jharkhand) | state@mota.demo |
| MoTA officer | officer@mota.demo |
| NOS committee | committee@mota.demo |
| Finance / PFMS boundary | finance@mota.demo |
| Policy admin | admin@mota.demo |
| Auditor | auditor@mota.demo |

## Authority used

- `guidelinesPrematric.pdf`
- `guidelinesPostmatric.pdf`
- `GuidelinesFellowshipandScholarship2022.pdf` (NFST Part A, Top Class Part B)
- `RevisedGuidelinesNOS07102022.pdf`
- Current MoTA / NFST / NOS portal facts from the ground-truth note (265 institutes, NFST ₹37k/₹42k, NOS 2026-27 amendment precedence)

## Built for the field: phones, weak signal, regional languages

| Reality | What the prototype does |
| --- | --- |
| Applicants use low-end phones on 2G/3G | Mobile-first layout: bottom tab bar, 44px+ touch targets, no horizontal scroll. Installable **PWA** with a service worker. Build assets are cached once. Pages are network-first with a 6 s timeout, fall back to the last copy, then to an offline page. **Lite mode** (Data Saver, 2G/3G, phone width) skips the WebGL hero and animations. The three.js chunk is never downloaded on a phone. Content is server-rendered and visible before any JS arrives. |
| Uploads over weak networks | Camera capture compresses photos on the phone (3–6 MB → ~200 KB). An on-device blur/brightness check catches a bad photo before upload. |
| English-only UI | **Hindi and Odia** for the whole applicant journey (language picker in the header and on the login page, `<html lang>` follows). Officer free text is translated through the **Bhashini** ULCA pipeline once `BHASHINI_USER_ID`/`BHASHINI_API_KEY` are set (`src/lib/bhashini.ts`). |
| Crumpled, dark or handwritten documents | Complete OCR failure never reaches MoTA. A DigiLocker-issued certificate goes back to the applicant with a **one-tap DigiLocker fetch**. Any other unreadable photo goes back as an instant **retake request** with specific tips. A handwritten certificate keeps the photo, and the officer gets a **field-level side-by-side check** (L1 instead of L2). The Control Tower shows the counts. |
| Manual upload portal | **DigiLocker** consent + OTP flow on the form. Issuer-signed documents skip OCR entirely and carry trust level A. Simulated with the real Requester API shape (`src/lib/digilocker.ts`). |
| Applicants have to log in to check status | **WhatsApp / SMS bot**: send an application ID, `STATUS`, `DOCS <id>` or `LANG HI`. Every officer action that notifies an applicant is also pushed to their mobile. Webhook `/api/whatsapp` supports the Meta Cloud API (HMAC-verified), Twilio and generic SMS gateways. Status is only disclosed to the registered mobile. A simulator is on the applicant desk. |
| Budget runs dry mid-year | **Predictive fund runway** in the Control Tower: last year's seasonal intake curve, scaled by this year's growth, projects each scheme's exhaustion date and year-end gap, with a recommended action (`src/engine/forecast.ts`). |
| Nodal officers in no-signal areas | **Offline batch verification** (`/ino/offline`): download pending files, verify with no network, auto-sync on reconnect. A file that changed since download comes back as a conflict. It is never silently applied. |

Demo: sign in as the applicant (Meena, Hindi alerts) and open **WhatsApp / SMS**, or file a Pre-Matric form and set a document's *Demo: photo condition* to *Crumpled* or *Handwritten*. Tests: `e2e/field-realities.spec.ts` runs all of the above at Pixel 5 size.

Document intelligence in the prototype is a classified extraction pipeline with confidence and consistency checks, not live PaddleOCR. DigiLocker and WhatsApp run in simulated mode until partner credentials are configured. NSP, PFMS and Missions are integration boundaries.

Seeded data lives in `data/store.json` after first boot. Use **Reset seeded cases** on the home page to restore it.
