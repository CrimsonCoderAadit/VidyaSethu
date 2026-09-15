# AI-Enabled Scholarship & Fellowship Management System
## SIH Problem Statement 26239 — Ministry of Tribal Affairs

> **Goal:** Build a common, secure, transparent, configurable and intelligent digital platform for end-to-end administration of Ministry of Tribal Affairs (MoTA) scholarship and fellowship schemes for Scheduled Tribe students.

---

# 0. Problem Statement Interpretation

The official problem statement requires a **single digital platform** that supports the complete scholarship/fellowship lifecycle:

```text
Application
    ↓
Document Submission
    ↓
Eligibility Verification
    ↓
Scrutiny
    ↓
Screening / Selection
    ↓
Communication
    ↓
Post-selection / Fellowship Management
```

The system must support **different eligibility criteria, documents and selection processes for individual schemes through a configurable common platform**.

Automation and AI should be used **where appropriate** to:

- reduce repetitive manual verification,
- identify incomplete or deficient applications,
- accelerate processing,
- improve verification accuracy,
- improve transparency,
- support merit-based selection according to approved scheme criteria,
- retain appropriate human oversight.

The platform must provide:

- an applicant-facing experience,
- an administrator/officer-facing experience,
- workflow and deficiency handling,
- dashboards and analytics,
- post-selection/fellowship management.

The architecture must therefore be **scheme-agnostic**.

NFST and NOS are the two schemes explicitly named in the problem statement and should be the primary fully implemented schemes in the SIH prototype.

The platform should be designed so that future MoTA schemes can be added primarily through **versioned configuration**, not by creating a new codebase.

---

# 1. Problem Statement in One Line

MoTA needs a unified, configurable and human-supervised digital platform that converts applications and documents into verified evidence, applies the correct scheme-specific rules and selection process, routes uncertain cases for review, manages deficiencies and selection, and continues through post-selection/fellowship management.

---

# 2. What We Are Building

The project should be positioned as:

> **An AI-Assisted Scholarship Decision Intelligence & Operations Platform for MoTA**

not merely as:

> "a scholarship website"

and not merely as:

> "an OCR system."

A useful simplified view is:

```text
Scholarship Portal
        +
Document Intelligence
        +
Structured Evidence
        +
Configurable Scheme Engine
        +
Eligibility / Decision Engine
        +
Scheme-Specific Selection Engine
        +
Human-in-the-Loop Review
        +
Workflow Engine
        +
Operations Dashboard
```

The portal is the interface.

The core product is the **policy, evidence, decision and workflow orchestration layer** behind it.

---

# 3. Core Design Principle

The system must keep the following concepts separate:

- **Facts** — what the application or evidence says.
- **Evidence** — where each fact came from.
- **Rules** — what the approved scheme version requires.
- **AI signals** — OCR confidence, inconsistencies, document classification, review priority.
- **Eligibility decisions** — whether the application satisfies the scheme rules.
- **Selection / ranking results** — how eligible candidates are selected where a scheme requires ranking.
- **Human decisions** — what an authorised officer/committee officially decides.
- **Workflow state** — where the application currently is.
- **Audit history** — who did what, when and why.
- **Time period** — academic year, financial year and effective policy version.

This separation is more important than adding a large number of AI features.

---

# 3A. Product Positioning & Strategic Wedge

The central question should not be:

> "Can our system read a PDF?"

The stronger question is:

> **"Which applications require human attention, why do they require attention, what evidence supports that finding, which approved scheme rule applies, and what should the authorised official review next?"**

### Core intelligence loop

```text
Application
    |
    v
Application Data + Documents
    |
    v
Document Intelligence
    |
    v
Structured Facts + Evidence
    |
    +--------------------------+
    |                          |
    v                          v
Consistency Checks      Scheme Configuration
    |                          |
    +------------+-------------+
                 |
                 v
        Eligibility / Decision Engine
                 |
                 v
        Scheme Selection Engine
                 |
        +--------+---------+
        |                  |
        v                  v
Routine / Clean       Review Required
        |                  |
        +--------+---------+
                 |
                 v
          Human Officer
                 |
                 v
        Transparent Decision
```

---

# 3B. Default Scheme Scope for SIH

## Primary schemes

The prototype should fully implement:

1. **NFST — National Fellowship for Scheduled Tribe Students**
2. **NOS — National Overseas Scholarship**

These are explicitly named in the official problem statement and are enough to prove that one common platform can execute two materially different scheme configurations.

## Extensibility requirement

The architecture must support future schemes such as:

```text
Scheme Registry
    |
    +-- NFST 2026-27
    |
    +-- NOS 2026-27
    |
    +-- Future Scheme A
    |
    +-- Future Scheme B
```

A new scheme should primarily require configuration of:

- application fields,
- required documents,
- eligibility rules,
- document validation rules,
- institution/state verification stages where applicable,
- deficiency rules,
- selection model,
- ranking/scoring rules where applicable,
- preference/quota rules,
- tie-break rules,
- workflow,
- communication templates,
- award rules,
- renewal/continuation rules.

It should **not** require:

```text
new portal
new database
new eligibility codebase
new workflow engine
new dashboard
```

for every scheme.

---

# 3C. Decision Layer and Ranking Layer Are Different

This is a major architectural principle.

## Decision / eligibility layer

The decision layer asks:

> **Is this application eligible, deficient, ineligible or in need of review?**

Possible outputs:

```text
ELIGIBLE
DEFICIENT
INELIGIBLE
REVIEW_REQUIRED
```

This exists for every scheme.

## Ranking / selection layer

The ranking/selection layer asks:

> **Among eligible candidates, how does this particular scheme select beneficiaries?**

Some schemes may have no ranking at all.

Therefore the platform must never create one universal "candidate score."

Wrong:

```text
ALL SCHOLARSHIPS

1. Candidate A    92.4
2. Candidate B    91.7
3. Candidate C    89.2
```

Correct:

```text
Scheme A
    ↓
Eligibility
    ↓
Scheme A Selection Model

Scheme B
    ↓
Eligibility
    ↓
Scheme B Selection Model
```

The selection model is configuration-driven.

Supported models can include:

```text
ELIGIBILITY_ONLY
MERIT_RANKED
MERIT_WITH_PREFERENCES
MERIT_CUM_MEANS
WEIGHTED_SCORE
COMMITTEE_RANKED
QUOTA_BUCKETED
```

Only activate a model if the approved scheme policy actually requires it.

---

# 3D. Important Distinction: Income Threshold vs Merit-Cum-Means

An income criterion does **not** automatically mean that a scheme is merit-cum-means.

## Means as eligibility

Example:

```text
family_income <= scheme_threshold
```

Income determines whether the applicant enters the eligible pool.

It does not necessarily contribute points to ranking.

## Merit-cum-means

Only if an approved scheme explicitly defines a combined scoring model should the system calculate something like:

```text
Final Score =
    Academic Component
    +
    Economic Need Component
```

Example weights such as 60/40 are illustrative only and must **never** be invented by the AI or hard-coded without policy authority.

The approved scheme configuration is the source of truth.

---

# 4. User Ecosystem & Role-Based Access

The system should not be designed as only "Student vs Admin."

Scholarship administration can involve multiple workflow roles.

## 4.1 Applicant / Student

Capabilities:

- Register/login
- View available schemes
- Complete optional eligibility pre-check
- Fill a scheme-specific dynamic application form
- Upload required documents
- Submit an application
- Track every workflow stage
- View deficiencies and reasons
- Correct/resubmit documents
- Receive notifications
- View selection/award status
- Complete renewal/continuation requirements
- Raise grievances where supported
- Access multilingual/accessibility assistance where available

---

## 4.2 Institution / University Nodal Officer

Where the active scheme requires institution verification:

- View assigned applications
- Verify admission/institution/programme information
- Review institution-related evidence
- Confirm/correct academic details
- Flag discrepancies
- Request clarification
- Forward/recommend applications
- Monitor institution-level backlog and SLA

---

## 4.3 State / UT Nodal Officer

For schemes that include State/UT workflow stages:

- View applications within authorised jurisdiction
- Verify/recommend applications
- Monitor institution verification
- Handle escalations
- Track state-level backlog and processing time

This role should only appear in workflows that actually require it.

---

## 4.4 MoTA Scheme / Verification Officer

Primary operational user.

Capabilities:

- View verification queue
- Prioritise applications requiring attention
- Inspect evidence-backed AI signals
- Verify eligibility
- Confirm/correct extracted facts
- Request deficiencies/corrections
- Approve/reject/recommend according to authority
- Escalate cases
- View scheme analytics
- Inspect audit history

---

## 4.5 Selection Committee / Expert Reviewer

Where a scheme uses committee-based selection:

- View eligible/shortlisted candidates
- View verified evidence
- View approved merit components
- Record assessment/recommendation
- Access only required information

AI must not make the committee's subjective judgement for it.

---

## 4.6 Finance / Payment Officer

Where relevant:

- View sanctioned beneficiaries
- Track payment/sanction status
- Identify failed/pending transactions
- Reconcile payment information
- Monitor financial status

The prototype should expose an integration boundary rather than attempting to replace government payment infrastructure.

---

## 4.7 System Administrator / Scheme Administrator

- Manage users and roles
- Configure access scopes
- Manage approved scheme configurations
- Configure workflow stages
- Configure selection models
- Manage integrations
- Publish new scheme/rule versions
- Review audit logs
- Manage system settings

---

## 4.8 Auditor / Monitoring Officer

Read-only or tightly controlled access to:

- decisions,
- evidence,
- rule versions,
- officer actions,
- overrides,
- audit history,
- workflow timelines,
- model versions used in automated processing.

---

## RBAC principle

Access should depend on:

```text
Role
+
Jurisdiction / Scope
+
Scheme
+
Assigned Workflow
```

Example:

```text
Applicant
    -> own applications only

Institution Officer
    -> assigned institution
    -> relevant schemes/applications only

MoTA Officer
    -> authorised schemes
    -> authorised stages

Auditor
    -> read-only authorised records
```

Use least privilege throughout.

---

# 5. Module 1 — Applicant Portal

The applicant portal should be dynamic and scheme-driven.

The applicant should be able to:

- select a scheme,
- see a form generated from that scheme's application schema,
- upload exactly the documents required by that scheme version,
- review application completeness,
- submit,
- track status,
- view deficiencies,
- resubmit corrections,
- track selection/post-selection status.

### Example tracker

```text
NFST 2026-27

Application          ✓ Submitted
Documents            ✓ Verified
Eligibility          ✓ Eligible
Institution Check    ⏳ Pending
Scrutiny             ⏳ Pending
Selection            ⏳ Pending
```

---

# 6. Dynamic Scheme Forms

Do not hard-code one form per scholarship.

Each scheme version should include an `application_schema`.

Conceptually:

```text
Scheme Version
    |
    +-- Personal fields
    +-- Academic fields
    +-- Income fields
    +-- Institution fields
    +-- Programme fields
    +-- Research / overseas fields
    +-- Scheme-specific declarations
```

### NFST form could request

```text
Personal Details
ST Details
Academic Qualifications
Master's Details
Research / Programme Details
Institution Details
Scheme-Specific Declarations
Required Documents
```

### NOS form could request

```text
Personal Details
ST / PVTG Details where applicable
Academic Qualifications
Overseas Programme Details
Foreign Institution Details
Study / Research Proposal
Income / Financial Information where required
Scheme-Specific Declarations
Required Documents
```

Exact fields must come from the approved policy/guidelines loaded into the system.

---

# 7. Module 2 — Document Intelligence

Instead of merely storing uploaded PDFs/images, the platform should understand them.

## Pipeline

```text
PDF / Image
    |
    v
Input Quality Checks
    |
    v
Preprocessing
    |
    v
OCR
    |
    v
Document Classification
    |
    v
Field Extraction
    |
    v
Validation
    |
    v
Structured Evidence
```

---

## 7.1 Input quality checks

Before expensive AI processing, check:

- resolution,
- blur,
- rotation,
- cropping,
- glare,
- blank pages,
- corrupt files,
- password-protected PDFs,
- unsupported file types.

Example:

```text
DOCUMENT QUALITY ISSUE

Bottom-right corner appears cropped.

Please upload another image.
```

This prevents avoidable downstream deficiencies.

---

## 7.2 Document classification

Example:

```text
Expected: Income Certificate
Uploaded: Marksheet

=> Document mismatch detected
```

Potential classes depend on scheme configuration.

Examples:

```text
ST_CERTIFICATE
INCOME_CERTIFICATE
MARKSHEET
DEGREE_CERTIFICATE
ADMISSION_LETTER
RESEARCH_PROPOSAL
INSTITUTION_DOCUMENT
IDENTITY_DOCUMENT
OTHER
```

---

## 7.3 OCR

OCR output should preserve:

- extracted text,
- confidence,
- page,
- coordinates/bounding boxes.

Coordinates are important for evidence highlighting.

---

## 7.4 Structured field extraction

Example:

```json
{
  "field": "annual_income",
  "value": 180000,
  "source_document": "income_certificate_v2.pdf",
  "page": 1,
  "source_text": "Annual Family Income: Rs. 1,80,000",
  "bounding_box": [211, 483, 681, 527],
  "confidence": 0.97
}
```

Do not store important AI-extracted facts without provenance.

---

# 8. Structured Evidence & Provenance

A full knowledge graph is not required for the core system.

PostgreSQL can store a structured evidence model.

```text
Application
    |
    +-- Applicant Data
    +-- Documents
    +-- Document Versions
    +-- Extracted Facts
    +-- Evidence Sources
    +-- Verification Checks
    +-- Eligibility Evaluations
    +-- Officer Actions
    +-- Decisions
    +-- Audit Events
```

Every important fact should answer:

> Where did this value come from?

Example:

```text
FACT

Field:
masters_percentage

Value:
91.20%

Source:
masters_marksheet.pdf

Page:
2

Coordinates:
[x1, y1, x2, y2]

Extraction Confidence:
98%

Human Confirmed:
YES
```

The officer should be able to press:

```text
[VIEW EVIDENCE]
```

and see the exact highlighted location in the source document.

---

# 9. Evidence Trust

Do not confuse OCR confidence with trust in the source itself.

Possible trust model:

```text
A — Trusted government digital source / approved API
B — Digitally signed / cryptographically / QR verified evidence
C — Institution-confirmed evidence
D — Uploaded evidence + automated checks
E — Uploaded evidence requiring human confirmation
```

A verification record may expose:

```text
Extraction Confidence     97%
Evidence Trust            D
Cross-document Agreement  HIGH
Policy Applicability      DETERMINISTIC
Human Review              NOT REQUIRED
```

These are separate signals.

---

# 10. Cross-Document Consistency Engine

Compare facts across:

- application form,
- marksheets,
- certificates,
- admission/registration evidence,
- income evidence,
- institution verification,
- previous versions/records where permitted.

Potential checks:

- name consistency,
- date of birth,
- ST/category status fields,
- academic marks,
- qualification,
- institution,
- programme/course,
- certificate numbers,
- issue/validity dates,
- financial/academic year,
- income values,
- other scheme-defined fields.

Example:

```text
Application:          Rahul Kumar
Marksheet:            Rahul Kumar
ST Certificate:       Rahul Kumar
Income Certificate:   Rohan Kumar

=> Potential name contradiction
=> Human review required
```

A discrepancy is a **review signal**, not proof of fraud.

---

# 11. Decision Intelligence & Review Prioritisation

This layer answers:

> Which cases require attention and why?

## 11.1 Review-priority queue

Instead of treating every application equally:

```text
Automated Checks
      |
 +----+----+
 |         |
Routine   Review
Cases     Required
 |         |
 v         v
Ready     Officer Queue
```

Example:

```text
APPLICATION #NFST-48291

Review Priority: HIGH

Reasons:
- Academic value conflicts across evidence
- One field has low extraction confidence
- Institution information requires confirmation
- SLA deadline approaching

Suggested action:
Verify academic evidence
```

Do not call this a definitive "fraud score."

It is an explainable **review-priority signal**.

---

## 11.2 Evidence Copilot

The officer may receive a concise evidence-grounded summary:

```text
APPLICATION #NFST-48291

Eligibility
✓ ST requirement
✓ Qualification requirement
⚠ Programme evidence needs confirmation

Documents
✓ 6/7 validated
⚠ One document discrepancy

Why flagged?
Application value: X
Certificate value: Y

Affected rule:
NFST-2026-R14

Suggested next action:
Request clarification or verify source evidence
```

The Evidence Copilot must explain:

- what was found,
- which evidence supports it,
- which rule applies,
- what action is available.

It must **not invent policy**.

---

# 12. Configurable Scheme Engine

This is a core requirement of the PS.

Do not hard-code NFST/NOS logic directly into application code.

Each scheme should be represented as a versioned configuration.

```text
Scheme
 |
 +-- metadata
 +-- application_schema
 +-- required_documents
 +-- eligibility_rules
 +-- validation_rules
 +-- deficiency_rules
 +-- institution_verification_rules
 +-- workflow
 +-- selection_model
 +-- ranking_rules
 +-- preference_rules
 +-- quota_rules
 +-- tie_breakers
 +-- award_rules
 +-- renewal_rules
 +-- communication_templates
```

---

# 13. Eligibility / Decision Engine

The eligibility engine executes deterministic approved rules against verified facts.

Possible outcomes:

```text
ELIGIBLE
DEFICIENT
INELIGIBLE
REVIEW_REQUIRED
```

It should distinguish:

## Ineligible

A required policy condition is not satisfied and the scheme does not define that issue as correctable.

## Deficient

The applicant may still qualify but required information/evidence is missing, unreadable, inconsistent or correctable.

## Review Required

The system cannot safely determine the result because:

- evidence is ambiguous,
- a policy exception exists,
- interpretation is required,
- a high-consequence conflict exists.

## Eligible

Configured eligibility rules pass.

---

# 14. Explainable Eligibility

Never simply display:

> Not eligible.

Show:

```text
ELIGIBILITY RESULT

Status: NOT ELIGIBLE

✓ ST status verified
✓ Required qualification verified
✓ Documents complete

✗ Rule R17 not satisfied

Observed:
[verified fact]

Required:
[approved rule]

Evidence:
[document / source]
```

Every eligibility result should be reproducible from:

```text
Evidence
    ↓
Fact
    ↓
Rule Version
    ↓
Evaluation
```

---

# 15. Selection / Ranking Engine

Eligibility and selection must remain separate.

```text
Application
    ↓
Eligibility
    |
    +---- Ineligible / Deficient
    |
    v
Eligible Pool
    ↓
Scheme Selection Model
```

Supported configurable models:

## 15.1 ELIGIBILITY_ONLY

Every eligible candidate proceeds according to scheme rules.

No artificial ranking.

---

## 15.2 MERIT_RANKED

Eligible candidates are ranked using approved merit fields.

Example:

```text
Primary Merit Field:
approved academic criterion

Tie Breakers:
configured from policy
```

---

## 15.3 MERIT_WITH_PREFERENCES

Base merit is calculated from approved academic criteria, then policy-defined preferences/reservations are applied.

---

## 15.4 MERIT_CUM_MEANS

Use only where the approved scheme explicitly combines merit and economic need.

```text
Final Score =
    configured merit component
    +
    configured means component
```

Weights must come from the policy configuration.

---

## 15.5 WEIGHTED_SCORE

Multiple approved components:

```text
Component A   configured weight
Component B   configured weight
Component C   configured weight
```

The platform must not invent weights.

---

## 15.6 COMMITTEE_RANKED

The system verifies eligibility and prepares an evidence dossier.

A human committee supplies assessment/recommendation.

AI does not fabricate subjective committee scores.

---

## 15.7 QUOTA_BUCKETED

Where policy defines categories/buckets/reserved slots:

```text
Eligible Pool
    ↓
Policy Buckets
    ↓
Bucket-specific selection
```

The scheme configuration must define bucket rules.

---

# 16. No Universal Candidate Ranking

There is **no single overall ranking across MoTA schemes**.

Correct:

```text
NFST
  -> NFST eligibility
  -> NFST selection/ranking logic

NOS
  -> NOS eligibility
  -> NOS selection/ranking logic
```

Wrong:

```text
All Scholarship Candidates
1. Rahul
2. Priya
3. Arun
```

because different schemes may represent completely different eligibility and selection philosophies.

---

# 17. NFST Configuration — Primary Demo Scheme

NFST should be fully implemented as one of the two primary SIH schemes.

The system should configure, from the authoritative NFST policy version:

- application fields,
- required documents,
- academic requirements,
- programme/research requirements,
- institution verification requirements,
- eligibility rules,
- approved merit/selection criteria,
- preferences/quotas if present,
- tie-break rules,
- fellowship/post-selection workflow,
- renewal/continuation rules.

Conceptual example:

```text
NFST 2026-27
 |
 +-- Application Schema
 +-- Document Schema
 +-- Eligibility Rules
 +-- Institution Verification
 +-- Selection Model
 +-- Merit / Preference Rules
 +-- Fellowship Workflow
 +-- Renewal Rules
```

Do not hard-code unofficial thresholds or weights.

All exact criteria must be loaded from the active approved NFST guidelines.

---

# 18. NOS Configuration — Primary Demo Scheme

NOS should be the second fully implemented scheme.

The system should configure, from the authoritative NOS policy version:

- applicant fields,
- overseas programme/institution fields,
- required documents,
- ST/PVTG or other policy-defined category evidence,
- academic requirements,
- financial/income criteria where applicable,
- eligibility checks,
- screening/shortlisting,
- committee/interview workflow where required,
- quota/bucket rules where applicable,
- award/post-selection requirements.

Conceptual flow:

```text
NOS Application
      ↓
Document Verification
      ↓
Eligibility
      ↓
Screening / Shortlisting
      ↓
Committee Stage where applicable
      ↓
Authorised Selection
      ↓
Post-selection / Award Management
```

Again, the active approved NOS policy version is the source of truth.

---

# 19. Example Scheme Configuration

Illustrative only:

```json
{
  "scheme_id": "NFST",
  "version": "2026-v1",
  "application_schema": "nfst_2026_form",
  "required_documents": [
    "configured_from_policy"
  ],
  "eligibility_rules": [
    "configured_from_policy"
  ],
  "selection_model": {
    "type": "MERIT_WITH_PREFERENCES",
    "rules": [
      "configured_from_policy"
    ]
  },
  "human_final_decision": true
}
```

Another scheme:

```json
{
  "scheme_id": "FUTURE_SCHEME",
  "version": "2028-v1",
  "selection_model": {
    "type": "MERIT_CUM_MEANS",
    "components": [
      {
        "field": "academic_component",
        "weight": "configured_from_policy"
      },
      {
        "field": "economic_component",
        "weight": "configured_from_policy"
      }
    ]
  }
}
```

This proves extensibility without inventing actual future policy.

---

# 20. Policy Studio

A scheme administrator should be able to manage approved scheme configurations without editing source code.

```text
SCHEME: NFST
VERSION: DRAFT 2026-v2

[Application Fields]
[Required Documents]
[Eligibility Rules]
[Deficiency Rules]
[Verification Stages]
[Selection Model]
[Ranking Rules]
[Preference / Quota Rules]
[Tie Breakers]
[Workflow]
[Award Rules]
[Renewal Rules]
```

Lifecycle:

```text
DRAFT
  ↓
VALIDATE
  ↓
TEST
  ↓
APPROVE
  ↓
PUBLISH
```

No silent editing of active production policy.

---

# 21. Policy QA

Before publishing a scheme version, run validation.

Detect:

- duplicate rule IDs,
- missing referenced fields,
- missing evidence sources,
- contradictory mandatory rules,
- impossible conditions,
- invalid dates,
- circular dependencies,
- invalid selection configuration,
- invalid quotas/buckets,
- missing tie-break rules where required,
- fields referenced by ranking but not captured/verified.

Example:

```text
POLICY ERROR

Rule NFST-R17 requires:
masters_percentage

But no active application field or
evidence source can establish:
masters_percentage
```

Policy QA is a strong P1 innovation because it improves configurability **safely**.

---

# 22. Human-in-the-Loop AI

AI should assist officials, not become the final authority for consequential scholarship decisions.

Internally use four review levels.

## L0 — Routine

- evidence verified,
- deterministic rules pass,
- no unresolved conflict.

Action:

```text
Prepared for authorised officer decision
```

not automatic final approval unless the approved workflow explicitly permits it.

---

## L1 — Assisted Review

Minor uncertainty.

Example:

```text
Academic percentage extracted: 81.4%
OCR confidence: 76%

[VIEW EVIDENCE]
[CONFIRM]
[CORRECT]
```

---

## L2 — Mandatory Human Review

Examples:

- conflicting documents,
- missing trusted evidence,
- ambiguous identity match,
- unclear programme/institution status,
- serious data contradiction.

---

## L3 — Escalated / Senior Review

Examples:

- adverse/rejection decision,
- serious integrity signal,
- override,
- appeal,
- policy exception,
- termination/suspension of an existing award.

---

## HITL routing factors

Do not route based only on confidence.

Consider:

```text
AI uncertainty
+
decision consequence
+
policy sensitivity
+
evidence contradiction
+
integrity signal
+
SLA urgency
```

A 99% confident anomaly can still require human review if the consequence is high.

---

# 23. Human Corrections & Model Feedback

When an officer corrects:

- OCR output,
- document classification,
- extracted field,
- name matching,
- anomaly interpretation,

store:

```text
model_version
prediction
corrected_value
officer_id
reason
source_document
timestamp
```

Human feedback becomes a curated evaluation/improvement dataset.

Do **not** immediately retrain production models from live corrections.

Use:

```text
Human Feedback
    ↓
Curated Dataset
    ↓
Offline Evaluation
    ↓
Model Approval
    ↓
New Model Version
```

---

# 24. AI Model Versioning

Record the automated components used for important processing.

Example:

```text
OCR Engine              v1.4
Document Classifier     v1.2
Field Extractor         v1.8
Name Matcher            v2.1
Rule Set                NFST-2026-v3
```

Historical decisions should remain reproducible.

---

# 25. Module 4 — Deficiency Management

When an application has a correctable problem, create a structured deficiency.

Example:

```text
APPLICATION #NFST-10234

3 issues found

1. Required document is unreadable
2. Research/programme evidence missing
3. Name mismatch in marksheet
```

Applicant view:

```text
ACTION REQUIRED

Document:
[document]

Reason:
[clear explanation]

Resolution:
[upload / correct / clarify]

Deadline:
[if applicable]

[RESOLVE]
```

Do not rely on unstructured email chains.

---

# 26. Selective Re-Verification

This is a major P1 differentiator.

When one document changes, do not automatically reprocess the whole application.

Example dependency chain:

```text
Income Certificate
      ↓
annual_income
      ↓
income validity
      ↓
income consistency
      ↓
scheme income rule
```

If the applicant replaces only the income certificate:

```text
SELECTIVE RE-VERIFICATION

Changed:
Income Certificate

Reprocessed:
✓ affected extracted facts
✓ affected consistency checks
✓ affected eligibility rules

Preserved:
✓ ST verification
✓ academic verification
✓ institution verification
✓ unrelated scheme rules
```

This directly reduces repetitive administrative work.

---

# 27. Dependency Model

Selective re-verification requires explicit dependencies.

Conceptually:

```text
Document
  ↓
Fact
  ↓
Verification Check
  ↓
Eligibility Rule
  ↓
Selection Component
  ↓
Decision
```

A dependency table in PostgreSQL is enough for the MVP.

A graph database is not required.

---

# 28. Workflow Engine

The workflow should be configurable per scheme.

Generic state model:

```text
DRAFT
  |
  v
SUBMITTED
  |
  v
DOCUMENT_VERIFICATION
  |
  v
ELIGIBILITY_CHECK
  |
  +---- DEFICIENCY
  |        |
  |        v
  |   RESUBMITTED
  |        |
  |        v
  +-- SELECTIVE_RECHECK
  |
  v
SCRUTINY
  |
  v
SCREENING
  |
  v
SELECTION
  |
  +---- SELECTED
  |
  +---- NOT_SELECTED / REJECTED
  |
  v
POST_SELECTION
```

Different schemes may add/remove stages.

The workflow must support re-entry when corrected/new evidence affects earlier stages.

---

# 29. Merit / Selection Support

After eligibility is established, the platform may assist with selection according to the active scheme configuration.

Do not assume every scheme uses a weighted score.

Possible outputs:

```text
Rank
Selected
Waitlisted
Shortlisted
Committee Recommended
Not Selected
```

Every result should expose the approved selection basis.

Example:

```text
SELECTION RESULT

Scheme:
NFST

Selection Model:
MERIT_RANKED

Primary Criterion:
[configured criterion]

Preference Rule:
[configured if applicable]

Tie Break:
[configured rule]

Policy Version:
NFST-2026-v3
```

Final selection remains under authorised human control.

---

# 30. Post-Selection / Fellowship Management

The official PS explicitly includes post-selection/fellowship management.

Do not end the system at "Selected."

Support a basic award lifecycle:

```text
SELECTED
    ↓
AWARD CREATED
    ↓
JOINING / ACCEPTANCE
    ↓
ACTIVE AWARD
    ↓
MILESTONES / PERIODIC VERIFICATION
    ↓
RENEWAL / CONTINUATION
    ↓
COMPLETION / CLOSURE
```

Possible records:

- sanction/award details,
- joining confirmation,
- institution confirmation,
- payment status via integration boundary,
- continuation certificate,
- updated documents,
- renewal review,
- completion/termination status.

For SIH, payment can be mocked through an adapter rather than implemented as real fund transfer.

---

# 31. Renewal / Continuation Engine

Multi-year benefits should not be treated as completely new applications every year.

```text
Previous Award
    ↓
Renewal Due
    ↓
Request Updated Evidence
    ↓
Verification
    ↓
Apply Renewal Rules
    |
    +-- Eligible   -> Continue
    |
    +-- Deficient  -> Request Correction
    |
    +-- Review     -> Human Review
```

Renewal rules are scheme-version specific.

---

# 32. Time-Bound Decisions

Eligibility should be treated as a time-bound historical decision.

Every important decision should record:

```text
Decision
- scheme
- scheme version
- applicant
- academic year
- financial year(s)
- rule version
- document versions
- extracted/calculated values
- AI model versions where relevant
- result
- human authority
- timestamp
```

If policy changes later, historical decisions must not silently change.

---

# 33. Example: Income Changes Later

Do not assume that new income automatically rewrites an earlier award decision.

Store:

```text
Income Record

Amount:
₹X

Financial Year:
YYYY-YY

Source:
income_certificate.pdf

Verified:
Yes/No

Verified On:
timestamp
```

Then:

```text
2026-27
Application Eligibility:
ELIGIBLE
Rule Version:
SCHEME-2026-v2

2027-28
Renewal Review:
PENDING
New Income:
₹Y
Applicable Rule:
SCHEME-2027-v1
```

The system applies the rule relevant to the correct period.

---

# 34. Important Rule — AI Does Not Decide Policy

AI may answer:

> "The certificate appears to show ₹X for FY YYYY-YY."

The rule engine answers:

> "Does ₹X satisfy rule R17 of scheme version V?"

The authorised human answers:

> "What is the official action where human judgement is required?"

```text
AI
 ↓
Extract / classify / compare

Rule Engine
 ↓
Apply approved policy

Human
 ↓
Review / decide where required
```

This avoids hallucinated scholarship policy.

---

# 35. Operations Control Tower

The Ministry dashboard should evolve beyond simple reporting.

It should answer:

1. **What is happening?**
2. **Where is it happening?**
3. **Why is it happening?**
4. **What requires action?**

Example:

```text
SCHOLARSHIP OPERATIONS CONTROL TOWER

Applications             1,42,821
Verified                    98,421
In Progress                 27,421
Require Action              16,979

REVIEW QUEUE
High Priority                1,284
Evidence Discrepancies       5,421
Routine / Ready             91,200

TOP BOTTLENECK
Institution Verification

SLA Breaches                    183
Average Delay                  8.2 days

[Open Review Queue]
[View Bottlenecks]
```

---

# 36. Process Intelligence & Workflow Bottleneck Detection

Analyse the workflow itself.

```text
Submitted
   -> Document Verification
   -> Eligibility
   -> Institution Verification
   -> Scrutiny
   -> Screening
   -> Selection
   -> Post-selection
```

Useful metrics:

- average processing time by stage,
- queue size,
- SLA violations,
- rework/resubmission rate,
- deficiency rate,
- institution backlog,
- state backlog where applicable,
- officer workload,
- transition time between stages.

Example:

```text
PROCESS BOTTLENECK

Institution Verification   ████████████████ 42%
Document Deficiencies      █████████        24%
MoTA Scrutiny              ████             11%
```

The system should surface likely operational bottlenecks.

---

# 37. Notifications

Central notification service:

```text
Application Submitted
        |
        +--> Email
        +--> SMS
        +--> In-app

Deficiency Created
        |
        +--> Email
        +--> SMS
        +--> In-app

Selection Result
        |
        +--> Email
        +--> SMS
        +--> In-app

Renewal Due
        |
        +--> Email
        +--> SMS
        +--> In-app
```

All communications should be auditable.

---

# 38. Optional P2 — Graph Intelligence

Graph Intelligence is optional and should only be introduced when the team implements genuine cross-application network anomaly use cases.

The core system remains PostgreSQL-based structured evidence.

Graph Intelligence answers:

> What relationships become visible only when many applications are analysed together?

Possible entities:

```text
Applicant
Application
Institution
Certificate
Document
Bank Account
Issuer
```

Possible relationships:

```text
APPLIED_WITH
HAS_CERTIFICATE
USES_ACCOUNT
UPLOADED
ATTENDS
ISSUED_BY
```

---

## 38.1 Certificate reuse

```text
Applicant A ───┐
               │
Applicant B ───┼── Certificate #ST12345
               │
Applicant C ───┘
```

Output:

```text
NETWORK REVIEW SIGNAL

Certificate identifier:
ST12345

Linked applicants:
3

Action:
Authorised human verification required.

No automatic rejection.
```

---

## 38.2 Repeated document identity

Use:

- cryptographic file hash,
- optionally perceptual similarity for image-like evidence.

Example:

```text
Document A
   ↕
97% visual similarity
   ↕
Document B
```

This may generate a review signal where justified.

---

## 38.3 Shared bank account

```text
Applicant A ───┐
Applicant B ───┼── Bank Account X
Applicant C ───┘
```

This must not automatically imply fraud.

The signal should depend on whether the active scheme/payment policy expects uniqueness.

```text
Policy expects uniqueness?
        |
   +----+----+
   |         |
  Yes        No
   |         |
Review    Informational
```

---

## 38.4 Graph technology choice

Do not introduce Neo4j simply to claim "Knowledge Graph."

For SIH:

```text
PostgreSQL
+
relationship table
+
Python / NetworkX
```

is sufficient for small synthetic/demo datasets.

A dedicated graph database can become a future optimisation only if:

- graph traversal becomes central,
- data scale justifies it,
- real network-analysis use cases require it.

Architecture should remain problem-first.

---

# 39. Optional P2 — Policy / Workflow Simulation

A 3D/physical digital twin is not required.

A useful optional feature is a **Policy / Workflow Simulation Engine**.

Examples:

> What if the deadline is extended?

> What if another verification stage is introduced?

> What if institution verification capacity increases?

> What if an approved rule changes for the next year?

Example:

```text
SCENARIO

Change:
Institution verification capacity +30%

Estimated Effect:
- backlog decreases
- SLA breaches decrease
- average processing time changes
```

Outputs must be labelled **scenario estimates**, not guaranteed predictions.

Policy execution/versioning is core.

Simulation is optional P2.

---

# 40. Optional P2 — Intelligent Grievance Analytics

If time permits:

```text
Grievances
    ↓
Classification / Clustering
    ↓
Recurring Issue Categories
```

Example categories:

- institution verification delay,
- document deficiency,
- payment issue,
- eligibility clarification,
- other.

This may help identify systemic issues, but it should not displace core PS functionality.

---

# 41. Multilingual / Accessible Assistance

Where feasible:

- multilingual UI,
- simple-language explanations,
- translated deficiency reasons,
- accessible application guidance,
- optional voice/text assistance.

Government language infrastructure may be integrated rather than recreated from scratch.

This is a deployment/accessibility feature, not the central novelty.

---

# 42. Updated Architecture

For SIH, use a modular architecture rather than many microservices.

```text
                             USERS
                               |
          +--------------------+--------------------+
          |                    |                    |
      Applicant           Institutions            MoTA
          |                    |                    |
          +--------------------+--------------------+
                               |
                               v
                    Web / Responsive Frontend
                               |
                               v
                           API Layer
                               |
         +---------------------+----------------------+
         |                     |                      |
         v                     v                      v
 Application Module      Workflow Module      Administration Module
         |                     |                      |
         +---------------------+----------------------+
                               |
      +------------------------+-------------------------+
      |                        |                         |
      v                        v                         v
 PostgreSQL              Object Storage           Audit/Event Log
      |                        |                         |
      +------------------------+-------------------------+
                               |
                               v
                       Intelligence Layer
                               |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
 Document AI            Scheme / Rule Engine    Decision Intelligence
       |                       |                       |
       |                       |              +--------+---------+
       |                       |              |        |         |
       |                       |              v        v         v
       |                       |         Consistency Priority Evidence
       |                       |                     Queue    Copilot
       +-----------------------+------------+----------+---------+
                                           |
                                           v
                                      HITL Router
                                           |
                                           v
                                Human Review / Decision
                                           |
                +--------------------------+-----------------------+
                |                          |                       |
                v                          v                       v
          Notifications             Control Tower          Post-selection
                                       / Process              / Renewal
                                       Intelligence

External integration boundary:
DigiLocker / NSP / PFMS / approved government APIs / language services
```

Optional:

```text
Graph Intelligence
Policy / Workflow Simulation
Grievance Intelligence
```

sit outside the core transaction path.

---

# 43. Important Integration Boundary

The prototype should not attempt to replace established government infrastructure unnecessarily.

Where external systems already perform:

- identity,
- document retrieval,
- digital verification,
- payments,
- language services,

the prototype should demonstrate an adapter/integration boundary.

If live credentials are unavailable:

```text
Integration Interface
        ↓
Mock Adapter
```

The architecture remains production-ready without blocking the hackathon.

---

# 44. Suggested Technology Direction

One reasonable stack:

## Frontend

- React / Next.js
- TypeScript
- Responsive UI
- Dynamic form rendering from scheme schema
- Separate views for applicant/officer/admin

## Backend

- FastAPI / Python
- REST APIs
- Modular monolith
- Role-based access control

## Database

- PostgreSQL

## Object storage

- S3-compatible storage / MinIO for prototype

## AI / Document processing

- Python
- OpenCV
- PaddleOCR or Tesseract
- document classification
- structured extraction
- RapidFuzz or equivalent for controlled fuzzy matching
- suitable LLM/VLM only where useful and evidence-grounded

## Queue

- Redis + Celery/RQ
- or another familiar worker queue

## Analytics

- SQL + backend aggregation
- frontend charts such as Recharts

## Optional graph

- PostgreSQL relationship table
- NetworkX
- dedicated graph database only if later justified

## Deployment

- Docker / Docker Compose for prototype
- normal cloud hosting as appropriate

Avoid unnecessary microservices for SIH.

---

# 45. Core Data Model

Suggested core entities:

```text
users
roles
permissions

schemes
scheme_versions
application_schemas

rules
rule_dependencies
rule_test_cases

applications
application_versions

documents
document_versions

facts
evidence_sources
fact_evidence_links

verification_checks
institution_verifications

eligibility_evaluations

selection_runs
selection_components
candidate_rankings
committee_assessments

human_reviews
overrides

deficiencies
deficiency_resolutions

workflow_instances
workflow_events

decisions

awards
award_milestones
renewals

appeals

ai_model_versions
ai_feedback

notifications
audit_events
```

Optional P2:

```text
entity_edges
network_signals
```

---

# 46. Security Requirements

Scholarship applications contain sensitive personal, educational and financial data.

Include:

- RBAC,
- least privilege,
- encryption in transit,
- encryption at rest where possible,
- private object storage,
- signed/temporary document URLs,
- input validation,
- file type/size validation,
- malware scanning for uploads,
- access logging,
- audit events,
- PII masking where appropriate,
- retention/deletion policies,
- session security,
- rate limiting,
- separation of applicant/officer/admin privileges.

Never expose uploaded documents through public URLs.

---

# 47. Audit Trail

Every significant action should generate an event.

Examples:

```text
APPLICATION_SUBMITTED
DOCUMENT_UPLOADED
DOCUMENT_PROCESSED
FACT_EXTRACTED
FACT_CORRECTED
INSTITUTION_VERIFIED
RULE_EVALUATED
HUMAN_REVIEWED
AI_OVERRIDDEN
DEFICIENCY_CREATED
DOCUMENT_REPLACED
SELECTIVE_RECHECK_COMPLETED
SELECTION_RUN
DECISION_CREATED
POLICY_PUBLISHED
AWARD_CREATED
RENEWAL_STARTED
APPEAL_SUBMITTED
```

Store:

```text
actor
role
action
timestamp
before
after
reason
relevant evidence
policy version
model version where relevant
```

---

# 48. Appeals / Reconsideration

Where policy supports appeal/reconsideration:

```text
Appeal
 |
 +-- original decision ID
 +-- scheme version
 +-- rule version
 +-- evidence considered
 +-- failed/passed rules
 +-- applicant reason
 +-- new evidence if permitted
```

Reviewers should see the exact historical decision snapshot.

---

# 49. Synthetic Dataset for SIH

Do not build/demo using real student PII.

Create synthetic applications with controlled edge cases.

Recommended scenarios:

- clean application,
- wrong document,
- blurry document,
- cropped certificate,
- name spelling variation,
- serious name mismatch,
- expired evidence,
- wrong financial/academic year,
- missing document,
- institution confirmation pending,
- duplicate certificate number,
- duplicate document,
- late application,
- policy exception,
- older scheme version,
- new scheme version,
- appeal,
- repeated resubmission,
- low OCR confidence,
- conflicting academic value,
- changed document requiring selective recheck.

Use 50–100 synthetic applications for demos/evaluation.

---

# 50. AI Evaluation

Do not claim invented accuracy.

Measure on the synthetic/labelled evaluation set.

Possible metrics:

```text
Document Classification
- Accuracy
- Macro F1

Field Extraction
- Exact Match
- Field-level Precision/Recall

Consistency Checks
- Precision
- Recall

Deficiency Detection
- Precision
- Recall

Name / Entity Matching
- Precision
- Recall

Rule Engine
- Policy tests passed / total

Human Review
- % routine
- % assisted
- % mandatory
- % escalated
```

A strong governance metric:

```text
AI-only adverse final decisions = 0
```

unless official policy explicitly permits a fully automated stage.

---

# 51. Operational Metrics

Measure actual workflow value:

- documents requiring manual opening,
- manual fields reviewed per application,
- applications requiring escalation,
- average verification time,
- deficiencies detected before/after submission,
- selective rechecks vs full rechecks,
- institution backlog,
- SLA breaches,
- average case age,
- time spent per workflow stage.

The goal is not merely "AI accuracy."

The goal is:

> **reduce unnecessary human work while preserving human control over consequential decisions.**

---

# 52. Feature Prioritisation for SIH

## P0 — Essential / Direct PS Requirements

- Applicant portal
- NFST configuration
- NOS configuration
- Dynamic scheme forms
- Application workflow
- Document upload
- Document intelligence
- Structured evidence
- Configurable scheme engine
- Eligibility / decision engine
- Scheme-specific selection engine
- Verification workflow
- Deficiency + resubmission
- Application tracking
- RBAC
- Officer dashboard
- Human final decision
- Notifications
- Audit trail
- Basic post-selection/fellowship management
- Basic renewal/continuation
- Dashboards/analytics

---

## P1 — Core Differentiation

- Evidence provenance with document highlighting
- Cross-document consistency engine
- Evidence trust levels
- Explainable eligibility
- Review-priority queue
- Evidence Copilot
- Four-level HITL routing
- Selective re-verification
- Rule dependencies
- Policy Studio
- Policy versioning
- Policy QA
- Time-bound decisions
- Process intelligence / bottleneck monitoring
- AI model versioning
- Human correction feedback

---

## P2 — Optional Innovation

Choose only if P0/P1 are solid:

- Graph Intelligence / cross-application network anomaly detection
- Policy/workflow simulation
- Intelligent grievance analytics
- Multilingual/voice assistance
- predictive workload estimation
- advanced process mining

---

## Explicitly Deprioritised

- 3D digital twin
- blockchain without a real requirement
- generic chatbot with no evidence/policy grounding
- AI-only final selection
- mandatory Neo4j/knowledge graph
- complex microservice/Kubernetes architecture for the hackathon
- custom foundation-model training
- real fund transfer implementation
- implementing every MoTA scheme shallowly

The objective is:

> **problem relevance + configurable architecture + demonstrable impact**

not feature count.

---

# 53. MVP for the SIH Demo

Build a polished vertical slice around **NFST + NOS**.

## Applicant

```text
Register
  ↓
View NFST / NOS
  ↓
Select Scheme
  ↓
Dynamic Form Loads
  ↓
Upload 4–7 Documents
  ↓
Submit
```

## AI

```text
Documents
  ↓
Quality Check
  ↓
OCR
  ↓
Classification
  ↓
Field Extraction
  ↓
Evidence Provenance
  ↓
Cross-document Verification
```

## Rules

```text
Verified Facts
  ↓
Active Scheme Version
  ↓
Eligibility Rules
  ↓
ELIGIBLE / DEFICIENT / REVIEW / INELIGIBLE
```

## Selection

```text
Eligible Candidates
  ↓
Scheme-Specific Selection Model
  ↓
Ranking / Shortlisting / Committee Flow
  ↓
Human Decision
```

## Post-selection

```text
Selected
  ↓
Award Record
  ↓
Basic Fellowship/Award Tracking
  ↓
Renewal / Continuation
```

---

# 54. Suggested SIH Demo Story

A strong demo should prove **configurability + intelligence + HITL + workflow**.

## Demo Part 1 — Scheme configurability

Applicant sees:

```text
AVAILABLE SCHEMES

NFST
NOS
```

Select NFST.

The NFST-specific form/document list appears.

Switch to NOS.

A different form, evidence requirement and workflow appears.

Explain:

> Same platform. Different configuration.

This directly proves the problem statement requirement.

---

## Demo Part 2 — Clean NFST case

```text
Student uploads documents
        ↓
AI classifies documents
        ↓
OCR extracts facts
        ↓
Evidence linked to source
        ↓
Consistency checks pass
        ↓
NFST eligibility passes
        ↓
Case prepared for selection/review
```

Officer opens one fact and sees the highlighted source evidence.

---

## Demo Part 3 — Problematic case + HITL

One document contains a mismatch or low-confidence extraction.

```text
Mismatch detected
        ↓
Review Priority = HIGH
        ↓
Officer sees why
        ↓
Deficiency created
```

Applicant receives a clear correction request.

---

## Demo Part 4 — Selective Re-Verification

Applicant uploads the corrected document.

Show:

```text
Changed:
1 document

Reprocessed:
4 facts
3 checks
1 rule

Preserved:
all unrelated verified evidence
```

This demonstrates reduced repetitive work.

---

## Demo Part 5 — Scheme-specific selection

Show that:

```text
NFST
    -> NFST configured selection logic

NOS
    -> NOS configured selection logic
```

There is no universal score.

Open the selection configuration to prove the difference.

---

## Demo Part 6 — Policy Studio

Open:

```text
Scheme: NFST
Version: 2026-v1
```

Show:

- application fields,
- documents,
- eligibility rules,
- selection model,
- workflow.

Create/edit a draft rule.

Run Policy QA.

Do not necessarily publish a live policy during the demo unless safe.

---

## Demo Part 7 — Operations Control Tower

Show:

```text
Which cases need attention?
Where is the workflow delayed?
How many deficiencies exist?
Which scheme/stage has the backlog?
```

Close with operational impact.

---

# 55. Suggested Team Work Split

For a 4-person team:

## Person 1 — Frontend

- applicant portal
- dynamic forms
- application tracker
- officer/admin UI
- evidence viewer
- control tower

## Person 2 — Backend / Workflow

- APIs
- authentication
- RBAC
- applications
- workflow
- deficiencies
- notifications
- audit

## Person 3 — AI / Document Intelligence

- quality checks
- OCR
- classification
- extraction
- evidence grounding
- cross-document consistency
- evaluation

## Person 4 — Scheme / Rules / Selection / Data

- scheme configuration
- eligibility engine
- selection engine
- Policy Studio
- Policy QA
- synthetic dataset
- selective dependency model
- database design

If 5–6 members are available, split:

- frontend applicant vs officer/admin,
- AI vs rule/selection engine,
- testing/security/integration/deployment.

---

# 56. Development Order

Do not build everything simultaneously.

## Phase 1 — Freeze the PS interpretation

- Use NFST + NOS as primary schemes
- Study authoritative scheme guidelines
- Identify application fields
- Identify required documents
- Identify eligibility
- Identify selection method
- Identify workflow
- Identify post-selection rules
- Build structured rule tables

Deliverable:

```text
NFST configuration draft
NOS configuration draft
```

---

## Phase 2 — Build scheme registry + dynamic forms

- scheme registry
- scheme versions
- application schema
- dynamic frontend fields
- required document schema

Prove:

```text
NFST form != NOS form
```

without creating two separate portals.

---

## Phase 3 — Basic workflow

- auth
- application CRUD
- document upload
- object storage
- status tracking
- audit events

Prove:

```text
Applicant -> Submit -> Officer Queue
```

---

## Phase 4 — Rule / Decision Engine

Before AI, manually seed verified facts.

Make:

```text
Facts
  ↓
Scheme Rules
  ↓
Explainable Eligibility
```

fully reliable.

---

## Phase 5 — Selection Engine

Implement generic selection abstractions:

```text
ELIGIBILITY_ONLY
MERIT_RANKED
MERIT_WITH_PREFERENCES
MERIT_CUM_MEANS
WEIGHTED_SCORE
COMMITTEE_RANKED
QUOTA_BUCKETED
```

Only use the models relevant to NFST/NOS in the actual demo.

---

## Phase 6 — Document AI

Implement:

- quality checks,
- OCR,
- classification,
- extraction,
- provenance,
- confidence.

---

## Phase 7 — Cross-document verification

- normalized matching,
- contradictions,
- low-confidence routing,
- institution evidence checks.

---

## Phase 8 — HITL

Implement:

```text
L0
L1
L2
L3
```

and officer review screens.

---

## Phase 9 — Deficiency loop

- structured deficiencies
- notifications
- applicant correction
- document versioning

---

## Phase 10 — Selective re-verification

- dependency table
- affected-fact calculation
- affected-rule calculation
- re-run only affected components

---

## Phase 11 — Policy Studio + QA

- edit draft scheme
- validate references
- rule tests
- versioning
- publish workflow

---

## Phase 12 — Control Tower / Process Intelligence

- queue metrics
- SLA
- stage latency
- backlog
- review priority
- scheme performance

---

## Phase 13 — Post-selection

- award record
- milestones
- renewal/continuation
- mock payment integration boundary

---

## Phase 14 — Optional P2

Only after the full vertical slice works:

- graph intelligence,
- simulation,
- grievance analytics,
- multilingual features.

---

## Phase 15 — Polish

- error handling
- security
- audit
- seeded demo data
- model evaluation
- browser testing
- responsive UI
- scripted end-to-end demo

---

# 57. Key Edge Cases to Design For

Before coding, define explicit behaviour for:

- income changes between periods,
- certificate expiry,
- scheme threshold changes,
- rule version changes,
- scheme selection model changes,
- student changes institution,
- student changes course/programme,
- wrong document uploaded,
- unreadable document,
- low OCR confidence,
- spelling/transliteration differences,
- multiple certificates,
- duplicate application,
- application to multiple schemes,
- submission after deadline,
- withdrawal,
- officer override,
- AI/officer disagreement,
- repeated resubmission,
- selected application later receives changed evidence,
- tie in merit ranking,
- quota/bucket filled,
- committee score missing,
- policy references a missing field,
- new scheme added mid-year,
- historical decision opened under a newer policy version,
- document replaced after eligibility but before selection,
- renewal uses different policy from original award.

Each should have an explicit workflow rather than an ad-hoc code path.

---

# 58. What Makes the Product Innovative

Present the product as five core layers.

```text
1. CONFIGURABLE
   One platform -> many scheme definitions

2. EVIDENCE-DRIVEN
   Documents -> facts -> exact provenance

3. SCHEME-AWARE
   Eligibility and selection vary per scheme

4. HUMAN-SUPERVISED
   AI handles repetitive work; humans retain authority

5. OPERATIONALLY AWARE
   MoTA sees queues, delays, deficiencies and bottlenecks
```

The strongest differentiators are:

## 58.1 Configurable Scheme + Selection Architecture

A future scholarship can define a new:

- form,
- document set,
- eligibility model,
- selection model,
- workflow,

without creating a new platform.

## 58.2 Evidence Provenance

Every important result:

```text
Decision
   ↓
Rule
   ↓
Fact
   ↓
Exact Evidence
```

## 58.3 HITL Decision Intelligence

The system identifies:

- what needs attention,
- why,
- what evidence caused the issue,
- what rule is affected.

## 58.4 Selective Re-Verification

Changed evidence only recomputes dependent facts/rules.

## 58.5 Process Intelligence

The Ministry sees where the workflow itself is getting stuck.

---

# 59. What We Should Claim

- Reduced repetitive manual scrutiny
- Faster identification of deficient applications
- Better document and cross-document verification
- Configurable scheme-specific processing
- Extensible architecture for future schemes
- Separate per-scheme decision and selection models
- Explainable eligibility and selection support
- Evidence-backed human review
- Reduced rework through selective re-verification
- Better applicant visibility
- Better MoTA operational visibility
- Auditable policy and decision history
- Human-supervised AI assistance
- Basic end-to-end post-selection/fellowship lifecycle

---

# 60. What We Should NOT Claim

- AI independently decides final eligibility or selection
- An AI confidence number proves truth
- A discrepancy proves fraud
- Every income-based scholarship is merit-cum-means
- Every scheme requires ranking
- One universal candidate score works across all schemes
- OCR alone proves authenticity
- Graph Intelligence is mandatory
- Neo4j is required
- Simulation results are guaranteed predictions
- A 3D digital twin is necessary
- Mock integrations are real government integrations

---

# 61. Final Architecture Philosophy

```text
                     COMMON PLATFORM
                            |
                        WORKFLOW
                            |
          +-----------------+-----------------+
          |                                   |
      DOCUMENTS                         SCHEME POLICY
          |                                   |
          v                                   v
      EVIDENCE                          ELIGIBILITY RULES
          |                                   |
          +-----------------+-----------------+
                            |
                            v
                     DECISION ENGINE
                            |
                  +---------+---------+
                  |                   |
                  v                   v
              ELIGIBLE           REVIEW / ISSUE
                  |                   |
                  v                   v
          SELECTION ENGINE          HITL
                  |                   |
                  +---------+---------+
                            |
                            v
                     HUMAN DECISION
                            |
                            v
                  AUDIT + WORKFLOW
                            |
                            v
             POST-SELECTION / RENEWAL
                            |
                            v
                OPERATIONS CONTROL TOWER
```

Optional P2:

```text
Graph Intelligence
Policy / Workflow Simulation
Grievance Intelligence
```

---

# 62. Final Product Vision

The strongest version of this project is not an online form.

It is a **scheme-configurable, evidence-driven scholarship processing platform** where:

```text
Documents
   ↓
Structured Evidence
   ↓
Verification
   ↓
Scheme-Specific Eligibility
   ↓
Scheme-Specific Selection
   ↓
Human Review / Decision
   ↓
Workflow
   ↓
Award / Fellowship Lifecycle
```

Every important decision is:

- explainable,
- auditable,
- tied to the correct scheme,
- tied to the correct academic/financial period,
- based on a versioned rule set,
- linked to the evidence that supported it,
- correctable where policy permits,
- protected by appropriate access controls.

---

# 63. Final Strategic Recommendation

Recommended identity:

> **MoTA Scholarship Decision Intelligence & Operations Platform**

Recommended tagline:

> **Evidence → Policy → Human Decision → Operations**

The central principle should be:

> **We do not automate government judgement. We automate, structure and prioritise the evidence work required for authorised officials to make faster, explainable and auditable scholarship decisions.**

And the architecture should demonstrate:

> **NFST and NOS are two scheme configurations running on one common engine; future scholarship/fellowship schemes can be introduced primarily through versioned configuration rather than by rebuilding the platform.**

---

# 64. SIH Demo Priority Summary

```text
P0
Common Platform
NFST
NOS
Dynamic Forms
Document Intelligence
Eligibility Engine
Scheme-Specific Selection
Deficiency / Resubmission
Workflow
Human Decision
Post-selection
Dashboard

        ↓

P1
Evidence Provenance
Cross-document Consistency
HITL
Selective Re-verification
Policy Studio
Policy QA
Review Priority
Process Intelligence
Model Versioning

        ↓

P2
Graph Intelligence
Policy / Workflow Simulation
Grievance Analytics
Advanced Multilingual / Voice
Predictive Workload
```

Do not move to P2 until P0 and the most important P1 features are working end to end.

---

# 65. Official Problem Statement References

The SIH problem statement supplied for this project is:

> **Problem Statement ID 26239 — AI-Enabled Scholarship and Fellowship Management System for Scheduled Tribes**

Ministry / Department:

> **Ministry of Tribal Affairs**

Category:

> **Software**

Theme:

> **Smart Education**

The problem statement's supplied data links are:

- https://tribal.nic.in/ScholarshiP.aspx
- https://dbttribal.gov.in/AllScheme.aspx

These official scheme sources should be used during implementation to convert each active scheme's actual guidelines into versioned configuration.

---

# 66. Bottom Line

The project should be frozen around this hierarchy:

```text
COMMON EXTENSIBLE PLATFORM
        |
        +-- NFST (fully implemented)
        |
        +-- NOS (fully implemented)
        |
        +-- Future schemes through configuration
```

For every scheme:

```text
Scheme
  |
  +-- Dynamic Input Fields
  +-- Required Documents
  +-- Eligibility / Decision Rules
  +-- Deficiency Rules
  +-- Verification Workflow
  +-- Selection Model
  +-- Ranking / Preference / Quota Rules
  +-- Tie Breakers
  +-- Award Rules
  +-- Renewal Rules
```

And, critically:

> **The decision layer varies per scheme. The selection/ranking layer also varies per scheme, and some schemes may not require ranking at all.**

That is the architecture that most directly satisfies PS 26239 while remaining technically novel, implementable in SIH, and extensible for future MoTA scholarship and fellowship schemes.
