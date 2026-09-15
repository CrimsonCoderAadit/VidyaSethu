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

Document intelligence in the prototype is a classified extraction pipeline with confidence and consistency checks, not live PaddleOCR. DigiLocker, NSP, PFMS and Missions are integration boundaries.

Seeded data lives in `data/store.json` after first boot. Use **Reset seeded cases** on the home page to restore it.
