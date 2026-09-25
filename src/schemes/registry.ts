import type { ApplicationField, Citation, EligibilityRule, RequiredDocument, SchemeConfig } from "@/engine/types";

const gPre: Citation = {
  sourceDocument: "guidelinesPrematric.pdf",
  sourcePage: "3",
  effectiveFrom: "2019-12-20",
};
const gPost: Citation = {
  sourceDocument: "guidelinesPostmatric.pdf",
  sourcePage: "3",
  effectiveFrom: "2022-04-01",
};
const gNfst: Citation = {
  sourceDocument: "GuidelinesFellowshipandScholarship2022.pdf — Part A NFST",
  sourcePage: "5-6",
  effectiveFrom: "2021-04-01",
};
const gTop: Citation = {
  sourceDocument: "GuidelinesFellowshipandScholarship2022.pdf — Part B National Scholarship / Top Class",
  sourcePage: "17-18",
  effectiveFrom: "2021-04-01",
};
const gNos: Citation = {
  sourceDocument: "RevisedGuidelinesNOS07102022.pdf",
  sourcePage: "3-4",
  effectiveFrom: "2021-04-01",
};

const personal: ApplicationField[] = [
  { id: "fullName", label: "Full name", section: "Personal", type: "text", required: true, evidenceDocument: "ST_CERTIFICATE" },
  { id: "dateOfBirth", label: "Date of birth", section: "Personal", type: "date", required: true },
  { id: "gender", label: "Gender", section: "Personal", type: "select", required: true, options: [
    { value: "FEMALE", label: "Female" },
    { value: "MALE", label: "Male" },
    { value: "OTHER", label: "Other" },
  ] },
  { id: "mobile", label: "Mobile (Aadhaar-linked)", section: "Personal", type: "text", required: true },
  { id: "aadhaarNumber", label: "Aadhaar number", section: "Personal", type: "text", required: true, help: "Used only for a one-way duplicate check across schemes and NSP. The number itself is never stored." },
  { id: "stStatus", label: "Scheduled Tribe status (domicile State/UT)", section: "Category", type: "boolean", required: true, evidenceDocument: "ST_CERTIFICATE" },
  { id: "domicileState", label: "Domicile State/UT", section: "Category", type: "select", required: true, options: [
    { value: "JH", label: "Jharkhand" },
    { value: "OD", label: "Odisha" },
    { value: "CG", label: "Chhattisgarh" },
    { value: "MP", label: "Madhya Pradesh" },
    { value: "RJ", label: "Rajasthan" },
    { value: "GJ", label: "Gujarat" },
    { value: "MH", label: "Maharashtra" },
    { value: "TS", label: "Telangana" },
    { value: "AP", label: "Andhra Pradesh" },
    { value: "NL", label: "Nagaland" },
    { value: "MZ", label: "Mizoram" },
    { value: "TR", label: "Tripura" },
    { value: "AS", label: "Assam" },
    { value: "MN", label: "Manipur" },
    { value: "AR", label: "Arunachal Pradesh" },
    { value: "SK", label: "Sikkim" },
    { value: "DL", label: "Delhi" },
  ] },
  { id: "pvtg", label: "PVTG", section: "Category", type: "boolean", required: false, evidenceDocument: "PVTG_CERTIFICATE" },
  { id: "divyangjan", label: "Divyangjan (min. 40% where claimed)", section: "Category", type: "boolean", required: false, evidenceDocument: "DISABILITY_CERTIFICATE" },
  { id: "orphanStatus", label: "Orphan supported by guardian", section: "Family", type: "boolean", required: false, help: "If yes, income ceiling does not apply." },
  { id: "familyIncome", label: "Family income (₹ / year)", section: "Family", type: "currency", required: true, evidenceDocument: "INCOME_CERTIFICATE" },
  { id: "bankAccount", label: "Valid scheduled-bank account", section: "Payment", type: "boolean", required: true, evidenceDocument: "BANK" },
  { id: "aadhaarLinked", label: "Aadhaar and mobile linked to bank", section: "Payment", type: "boolean", required: true },
  { id: "otherScholarship", label: "Receiving another scholarship for the same study", section: "Declarations", type: "boolean", required: true },
];

function docs(ids: Array<[string, string, boolean]>): RequiredDocument[] {
  return ids.map(([id, label, mandatory]) => ({ id, label, mandatory }));
}

function rule(partial: EligibilityRule): EligibilityRule {
  return partial;
}

export const PRE_MATRIC: SchemeConfig = {
  schemeId: "PRE_MATRIC",
  code: "PRE_MATRIC",
  name: "Pre-Matric Scholarship for ST students (Classes IX–X)",
  shortName: "Pre-Matric",
  academicYear: "2026-27",
  version: "2019-v1+amendments",
  status: "PUBLISHED",
  implementation: "States/UTs + DBT",
  selectionCharacter: "Eligibility / entitlement. No national merit rank.",
  applicationSchema: [
    ...personal,
    { id: "classLevel", label: "Class", section: "School", type: "select", required: true, options: [
      { value: "IX", label: "Class IX" },
      { value: "X", label: "Class X" },
    ] },
    { id: "schoolRecognised", label: "Government / recognised school", section: "School", type: "boolean", required: true },
    { id: "hosteller", label: "Hosteller", section: "School", type: "boolean", required: true },
    { id: "repeatClass", label: "Repeating the same class (already funded once)", section: "School", type: "boolean", required: true },
    { id: "incomeCertificateFromClassIx", label: "Using Class IX income certificate for Class X", section: "Family", type: "boolean", required: false },
    { id: "freshOrRenewal", label: "Application type", section: "School", type: "select", required: true, options: [
      { value: "FRESH", label: "Fresh" },
      { value: "RENEWAL", label: "Renewal / promotion" },
    ] },
  ],
  requiredDocuments: docs([
    ["ST_CERTIFICATE", "ST certificate of domicile State/UT", true],
    ["INCOME_CERTIFICATE", "Income certificate (Class IX certificate valid for X)", true],
    ["MARKSHEET", "Previous class marksheet", true],
    ["AADHAAR", "Aadhaar", true],
    ["BANK", "Bank passbook / cancelled cheque", true],
    ["DISABILITY_CERTIFICATE", "Disability certificate if claiming allowance", false],
  ]),
  eligibilityRules: [
    rule({ id: "PRE-R01", description: "Applicant must belong to ST specified for the domicile State/UT", field: "stStatus", operator: "truthy", failOutcome: "INELIGIBLE", citation: { ...gPre, sourcePage: "3" } }),
    rule({ id: "PRE-R02", description: "Must be studying in Class IX or X", field: "classLevel", operator: "in", value: ["IX", "X"], failOutcome: "INELIGIBLE", citation: gPre }),
    rule({ id: "PRE-R03", description: "Government or recognised school", field: "schoolRecognised", operator: "truthy", failOutcome: "INELIGIBLE", citation: gPre }),
    rule({ id: "PRE-R04", description: "Family income ≤ ₹2.5 lakh unless orphan waiver", field: "familyIncome", operator: "orphanIncomeExempt", value: 250000, failOutcome: "INELIGIBLE", citation: { ...gPre, sourcePage: "3-4" } }),
    rule({ id: "PRE-R05", description: "Valid scheduled-bank account linked with Aadhaar and mobile", field: "bankAccount", operator: "truthy", failOutcome: "DEFICIENT", citation: gPre }),
    rule({ id: "PRE-R06", description: "Aadhaar/mobile linkage", field: "aadhaarLinked", operator: "truthy", failOutcome: "DEFICIENT", citation: { ...gPre, sourcePage: "5", sourceDocument: "guidelinesPrematric.pdf + Aadhaar circulars" } }),
    rule({ id: "PRE-R07", description: "Must not receive another scholarship", field: "otherScholarship", operator: "falsy", failOutcome: "INELIGIBLE", citation: gPre }),
    rule({ id: "PRE-R08", description: "Same class is not funded twice", field: "repeatClass", operator: "falsy", failOutcome: "INELIGIBLE", citation: gPre }),
  ],
  workflow: ["DRAFT", "SUBMITTED", "DOCUMENT_INTELLIGENCE", "STATE_VERIFICATION", "ELIGIBILITY", "AUTHORISED_DECISION", "AWARDED"],
  selectionModel: {
    type: "ELIGIBILITY_ONLY",
    humanFinalDecision: true,
    citation: gPre,
    notes: "State/UT verification and DBT entitlement. Do not invent a national rank.",
  },
  awardRules: [
    { id: "PRE-A1", label: "Day scholar ₹225/month × 10 + ₹750 books", formula: "hosteller? 525*10+1000 : 225*10+750", citation: { ...gPre, sourcePage: "4" } },
    { id: "PRE-A2", label: "Disability allowance hosteller ₹800 / day scholar ₹600 per month", formula: "divyangjan extra", citation: { ...gPre, sourcePage: "5" } },
  ],
  renewalRules: ["Income certificate at Class IX is valid for Class X.", "Renewal only on promotion to the next class."],
  integrations: ["State portal / NSP", "DBT Pre/Post dashboard", "PFMS (State)"],
  conflicts: [],
  officialSources: ["MoTA Pre-Matric guidelines", "DBT Tribal reporting dashboard", "20 Dec 2019 amount amendment"],
};

export const POST_MATRIC: SchemeConfig = {
  schemeId: "POST_MATRIC",
  code: "POST_MATRIC",
  name: "Post-Matric Scholarship for ST students",
  shortName: "Post-Matric",
  academicYear: "2026-27",
  version: "2022-v1",
  status: "PUBLISHED",
  implementation: "States/UTs + DBT",
  selectionCharacter: "Eligibility / entitlement. State verification. No national merit rank.",
  applicationSchema: [
    ...personal,
    { id: "previousQualification", label: "Previous qualification (Class X or above)", section: "Course", type: "text", required: true },
    { id: "course", label: "Course", section: "Course", type: "text", required: true },
    { id: "courseGroup", label: "Course group", section: "Course", type: "select", required: true, options: [
      { value: "I", label: "Group I — professional degree / PG / MPhil / PhD" },
      { value: "II", label: "Group II — non-professional graduate/PG" },
      { value: "III", label: "Group III — vocational / ITI / polytechnic" },
      { value: "IV", label: "Group IV — post-matric non-degree (XI–XII etc.)" },
    ] },
    { id: "institutionRecognised", label: "Institution in an approved category", section: "Institution", type: "boolean", required: true },
    { id: "institutionInTopClassList", label: "Institution is on current Top Class identified list", section: "Institution", type: "boolean", required: true, help: "If yes, Post-Matric is barred to avoid duplication with Top Class." },
    { id: "hosteller", label: "Hosteller", section: "Course", type: "boolean", required: true },
    { id: "feeAmount", label: "Compulsory non-refundable fees (₹)", section: "Course", type: "currency", required: true },
    { id: "freshOrRenewal", label: "Application type", section: "Course", type: "select", required: true, options: [
      { value: "FRESH", label: "Fresh" },
      { value: "RENEWAL", label: "Renewal" },
    ] },
  ],
  requiredDocuments: docs([
    ["ST_CERTIFICATE", "ST certificate of domicile State/UT", true],
    ["INCOME_CERTIFICATE", "Income certificate", true],
    ["MARKSHEET", "Previous qualifying marksheet", true],
    ["ADMISSION_LETTER", "Admission / fee structure", true],
    ["BANK", "Bank details", true],
    ["AADHAAR", "Aadhaar", true],
  ]),
  eligibilityRules: [
    rule({ id: "PMS-R01", description: "ST status tied to domicile State/UT", field: "stStatus", operator: "truthy", failOutcome: "INELIGIBLE", citation: gPost }),
    rule({ id: "PMS-R02", description: "Passed matriculation or higher recognised examination", field: "previousQualification", operator: "truthy", failOutcome: "DEFICIENT", citation: gPost }),
    rule({ id: "PMS-R03", description: "Family income ≤ ₹2.5 lakh unless orphan waiver", field: "familyIncome", operator: "orphanIncomeExempt", value: 250000, failOutcome: "INELIGIBLE", citation: { ...gPost, sourcePage: "4-5" } }),
    rule({ id: "PMS-R04", description: "Recognised institution category", field: "institutionRecognised", operator: "truthy", failOutcome: "INELIGIBLE", citation: { ...gPost, sourcePage: "3-4" } }),
    rule({ id: "PMS-R05", description: "Not duplicating Top Class identified institutes", field: "institutionInTopClassList", operator: "topClassExclusion", failOutcome: "INELIGIBLE", citation: { ...gPost, sourcePage: "4", note: "Guideline still cites 252; current Top Class list is 265. Conflict stored, current list wins for exclusion." } }),
    rule({ id: "PMS-R06", description: "Valid bank account", field: "bankAccount", operator: "truthy", failOutcome: "DEFICIENT", citation: gPost }),
    rule({ id: "PMS-R07", description: "No simultaneous other scholarship", field: "otherScholarship", operator: "falsy", failOutcome: "INELIGIBLE", citation: gPost }),
  ],
  workflow: ["DRAFT", "SUBMITTED", "DOCUMENT_INTELLIGENCE", "INSTITUTION_VERIFICATION", "STATE_VERIFICATION", "ELIGIBILITY", "AUTHORISED_DECISION", "AWARDED"],
  selectionModel: {
    type: "ELIGIBILITY_ONLY",
    humanFinalDecision: true,
    citation: gPost,
    notes: "Entitlement = compulsory fees + group-wise maintenance. State/UT awards.",
  },
  awardRules: [
    { id: "PMS-A1", label: "Group stipend hosteller/day scholar per Table 2", formula: "group stipend × 10 + fees", citation: { ...gPost, sourcePage: "7" } },
  ],
  renewalRules: ["Fresh income certificate not required in subsequent years of the same course."],
  integrations: ["State portal / NSP", "DBT Pre/Post dashboard"],
  conflicts: [
    {
      id: "PMS-C1",
      topic: "Top Class institute count used for duplication bar",
      olderMaterial: "Post-Matric guideline Note 1 cites 252 Top Class institutes",
      currentSource: "MoTA current page: 265 identified institutes from 2023-24",
      resolution: "Use the current 265-list for exclusion. Do not silently keep 252.",
      citation: { sourceDocument: "guidelinesPostmatric.pdf vs Top Class 2023-24 institute revision", sourcePage: "4", effectiveFrom: "2023-04-01", supersedes: "252-institute list" },
    },
  ],
  officialSources: ["Guidelines of scheme Post Matric Scholarship", "DBT Tribal dashboard"],
};

export const TOP_CLASS: SchemeConfig = {
  schemeId: "TOP_CLASS",
  code: "TOP_CLASS",
  name: "National Scholarship / Top Class Education for ST students",
  shortName: "Top Class",
  academicYear: "2026-27",
  version: "2023-24-v1",
  status: "PUBLISHED",
  implementation: "Central + NSP",
  selectionCharacter: "Currently eligibility-based within 265 identified institutions. All eligible fresh students.",
  applicationSchema: [
    ...personal.filter((f) => f.id !== "familyIncome").concat([
      { id: "familyIncome", label: "Family income (₹ / year)", section: "Family", type: "currency", required: true, help: "Ceiling ₹6 lakh. Spouse income added if married." },
    ]),
    { id: "institutionInTopClassList", label: "Admitted to an institute on the current 265-list", section: "Institution", type: "boolean", required: true },
    { id: "course", label: "Notified course at that institute", section: "Institution", type: "text", required: true },
    { id: "admittedOnMerit", label: "Admitted on merit (not management quota in a private institute)", section: "Institution", type: "boolean", required: true },
    { id: "freshOrRenewal", label: "Fresh or renewal", section: "Institution", type: "select", required: true, options: [
      { value: "FRESH", label: "Fresh" },
      { value: "RENEWAL", label: "Renewal" },
    ] },
    { id: "married", label: "Married (spouse income to be added)", section: "Family", type: "boolean", required: false },
  ],
  requiredDocuments: docs([
    ["ST_CERTIFICATE", "ST certificate", true],
    ["INCOME_CERTIFICATE", "Income certificate / Form-16", true],
    ["ADMISSION_LETTER", "Institute admission proof", true],
    ["BANK", "Student bank details", true],
    ["AADHAAR", "Aadhaar", true],
  ]),
  eligibilityRules: [
    rule({ id: "TC-R01", description: "ST student", field: "stStatus", operator: "truthy", failOutcome: "INELIGIBLE", citation: gTop }),
    rule({ id: "TC-R02", description: "Family income ≤ ₹6 lakh unless orphan waiver", field: "familyIncome", operator: "orphanIncomeExempt", value: 600000, failOutcome: "INELIGIBLE", citation: { ...gTop, sourcePage: "17-18" } }),
    rule({ id: "TC-R03", description: "Institution must be on current 265 identified list", field: "institutionInTopClassList", operator: "truthy", failOutcome: "INELIGIBLE", citation: { sourceDocument: "Updated list of identified 265 Top Class Institutes", sourcePage: "list", effectiveFrom: "2023-04-01", supersedes: "246/252 historical lists" } }),
    rule({ id: "TC-R04", description: "Admission on merit; management quota in private institute not entitled", field: "admittedOnMerit", operator: "truthy", failOutcome: "INELIGIBLE", citation: { ...gTop, sourcePage: "18" } }),
    rule({ id: "TC-R05", description: "Cannot claim another scholarship for the same study", field: "otherScholarship", operator: "falsy", failOutcome: "INELIGIBLE", citation: gTop }),
    rule({ id: "TC-R06", description: "Student bank details", field: "bankAccount", operator: "truthy", failOutcome: "DEFICIENT", citation: { sourceDocument: "Amendment to Para 4.1 effective 2023-24", sourcePage: "4.1", effectiveFrom: "2023-04-01" } }),
  ],
  workflow: ["DRAFT", "SUBMITTED", "DOCUMENT_INTELLIGENCE", "INSTITUTION_VERIFICATION", "ELIGIBILITY", "MOTA_SCRUTINY", "AUTHORISED_DECISION", "AWARDED"],
  selectionModel: {
    type: "ELIGIBILITY_ONLY",
    humanFinalDecision: true,
    citation: { sourceDocument: "MoTA Top Class current About page + Part B 2.4", sourcePage: "current", effectiveFrom: "2023-04-01", supersedes: "Older 1000-slot Class XII merit model" },
    notes: "Scholarship is provided to all eligible fresh students. Do not revive the older 1000-slot Class XII rank.",
  },
  awardRules: [
    { id: "TC-A1", label: "Tuition/admission/non-refundable fees to institution via PFMS", formula: "institution_payment", citation: { sourceDocument: "Amendment to Para 4.1, effective 2023-24", sourcePage: "4.1", effectiveFrom: "2023-04-01" } },
    { id: "TC-A2", label: "Stipend / books / computer to student", formula: "student_payment", citation: gTop },
  ],
  renewalRules: ["Continues for course duration subject to satisfactory institute performance."],
  integrations: ["NSP", "PFMS", "Institute INO"],
  conflicts: [
    {
      id: "TC-C1",
      topic: "Selection model",
      olderMaterial: "Older/translated pages: 246 institutes / 1000 slots / Class XII merit",
      currentSource: "Current MoTA page: 265 institutes, all eligible fresh students",
      resolution: "Versioned selection_model = ELIGIBILITY_ONLY for 2023-24 onward.",
      citation: { sourceDocument: "MoTA Top Class About + 2023-24 institute revision", sourcePage: "current", effectiveFrom: "2023-04-01" },
    },
  ],
  officialSources: ["NFS Part B", "265 institute list 2023-24", "Para 4.1 payment amendment"],
};

export const NFST: SchemeConfig = {
  schemeId: "NFST",
  code: "NFST",
  name: "National Fellowship for ST Students",
  shortName: "NFST",
  academicYear: "2025-26",
  version: "2025-26-v1",
  status: "PUBLISHED",
  implementation: "Central Fellowship Portal",
  selectionCharacter: "Merit on Master's marks + preference/slot buckets. Human/MoTA authorisation.",
  applicationSchema: [
    ...personal.filter((f) => f.id !== "familyIncome"),
    { id: "ageOn1July", label: "Age (years) on 1 July of award year", section: "Personal", type: "number", required: true, help: "Maximum 36 years on 1 July of the relevant year (base guideline)." },
    { id: "mastersPercentage", label: "Master's final marks / converted CGPA %", section: "Academics", type: "number", required: true, evidenceDocument: "MARKSHEET" },
    { id: "phdProgramme", label: "Registered for regular full-time PhD (or permitted M.Phil streams)", section: "Research", type: "boolean", required: true },
    { id: "institutionEligible", label: "Institution in 2(f)/12(B), Sec. 3 deemed, funded, or INI category", section: "Institution", type: "boolean", required: true },
    { id: "institutionVerified", label: "University/INO has verified the application", section: "Institution", type: "boolean", required: true },
    { id: "premierOfferIitIimIiserAiims", label: "Offer from IIT / IIM / IISER / AIIMS", section: "Institution", type: "boolean", required: false },
    { id: "researchDiscipline", label: "Research discipline", section: "Research", type: "text", required: true },
    { id: "freshOrRenewal", label: "Fresh or continuation", section: "Research", type: "select", required: true, options: [
      { value: "FRESH", label: "Fresh fellowship" },
      { value: "RENEWAL", label: "Continuation" },
    ] },
  ],
  requiredDocuments: docs([
    ["ST_CERTIFICATE", "ST / PVTG certificate", true],
    ["MARKSHEET", "Master's marksheet + CGPA conversion if needed", true],
    ["ADMISSION_LETTER", "PhD admission/registration", true],
    ["DISABILITY_CERTIFICATE", "Disability certificate if Divyangjan slot claimed", false],
    ["PVTG_CERTIFICATE", "PVTG certificate if claimed", false],
    ["BANK", "Bank details", true],
    ["AADHAAR", "Aadhaar / DigiLocker", true],
  ]),
  eligibilityRules: [
    rule({ id: "NFST-R01", description: "Scheduled Tribe applicant", field: "stStatus", operator: "truthy", failOutcome: "INELIGIBLE", citation: gNfst }),
    rule({ id: "NFST-R02", description: "Master's marks ≥ 55%", field: "mastersPercentage", operator: "gte", value: 55, failOutcome: "INELIGIBLE", citation: { ...gNfst, sourcePage: "5" } }),
    rule({ id: "NFST-R03", description: "Age ≤ 36 years on 1 July of award year", field: "ageOn1July", operator: "lte", value: 36, failOutcome: "INELIGIBLE", citation: { ...gNfst, sourcePage: "5" } }),
    rule({ id: "NFST-R04", description: "Regular full-time PhD / permitted programme", field: "phdProgramme", operator: "truthy", failOutcome: "INELIGIBLE", citation: { sourceDocument: "NFST 2025-26 invitation: current competition is for PhD programmes", sourcePage: "portal", effectiveFrom: "2025-04-01" } }),
    rule({ id: "NFST-R05", description: "Eligible university/institution category", field: "institutionEligible", operator: "truthy", failOutcome: "INELIGIBLE", citation: { ...gNfst, sourcePage: "5" } }),
    rule({ id: "NFST-R06", description: "Institution verification is mandatory", field: "institutionVerified", operator: "truthy", failOutcome: "DEFICIENT", citation: { sourceDocument: "NFST portal institution-verification notices 2025", sourcePage: "portal", effectiveFrom: "2025-01-01" } }),
    rule({ id: "NFST-R07", description: "Bank account for fellowship payment", field: "bankAccount", operator: "truthy", failOutcome: "DEFICIENT", citation: gNfst }),
  ],
  workflow: ["DRAFT", "SUBMITTED", "DOCUMENT_INTELLIGENCE", "INSTITUTION_VERIFICATION", "ELIGIBILITY", "MOTA_SCRUTINY", "SELECTION", "AUTHORISED_DECISION", "AWARDED", "RENEWAL"],
  selectionModel: {
    type: "MERIT_WITH_PREFERENCES",
    combinedWith: ["QUOTA_BUCKETED"],
    meritField: "mastersPercentage",
    slots: 750,
    humanFinalDecision: true,
    tieBreakers: ["mastersPercentage", "applicantName"],
    buckets: [
      { id: "DIVYANGJAN", label: "Divyangjan 5%", slots: 38, predicate: { divyangjan: true }, overflowTo: "PVTG" },
      { id: "PVTG", label: "PVTG", slots: 25, predicate: { pvtg: true }, overflowTo: "FEMALE" },
      { id: "FEMALE", label: "Female 30% (includes Divyangjan and PVTG women)", slots: 225, predicate: { gender: "FEMALE" }, overflowTo: "ST_OTHERS" },
      { id: "ST_OTHERS", label: "ST Others (premier IIT/IIM/IISER/AIIMS offers take priority here)", slots: 462, predicate: {} },
    ],
    citation: { ...gNfst, sourcePage: "6", note: "Exact 2025-26 circular should be attached as a new version if it amends this formula. Until then this is the last fully extracted slot rule." },
    notes: "No income criterion for NFST eligibility. Do not invent a universal score.",
  },
  awardRules: [
    { id: "NFST-A1", label: "Current portal: ₹37,000 / ₹42,000 PhD rates + contingency/HRA", formula: "37000 then 42000", citation: { sourceDocument: "Revised rate of fellowship w.e.f. 1 Jan 2023 / NFST portal", sourcePage: "portal", effectiveFrom: "2023-01-01", supersedes: "₹25,000 / ₹28,000 in 2021-25 PDF" } },
  ],
  renewalRules: ["Continuation subject to satisfactory research progress certified by the institution."],
  integrations: ["NFST portal", "DigiLocker", "UMANG", "University verification module", "PFMS"],
  conflicts: [
    {
      id: "NFST-C1",
      topic: "Programme coverage and rates",
      olderMaterial: "Ministry summary still shows MPhil/PhD and ₹25,000/₹28,000",
      currentSource: "NFST portal: PhD emphasis, ₹37,000/₹42,000, 750 fresh slots",
      resolution: "Current portal + 1 Jan 2023 rate circular override the older summary.",
      citation: { sourceDocument: "NFST portal + revised rate circular", sourcePage: "portal", effectiveFrom: "2023-01-01" },
    },
  ],
  officialSources: ["NFS Part A", "NFST portal 2025-26", "Selection criteria circular (attach when extracted line-by-line)"],
};

export const NOS: SchemeConfig = {
  schemeId: "NOS",
  code: "NOS",
  name: "National Overseas Scholarship for ST students",
  shortName: "NOS",
  academicYear: "2026-27",
  version: "2026-27-v1",
  status: "PUBLISHED",
  implementation: "Central Overseas Portal + Indian Missions / MEA",
  selectionCharacter: "Eligibility, then committee/interview merit, with ST/PVTG and field-of-study slot buckets.",
  applicationSchema: [
    ...personal,
    { id: "programmeLevel", label: "Programme level", section: "Overseas", type: "select", required: true, options: [
      { value: "MASTERS", label: "Master's" },
      { value: "PHD", label: "PhD" },
      { value: "POSTDOC", label: "Post-Doctoral" },
    ] },
    { id: "ageOn1July", label: "Age on 1 July of selection year", section: "Personal", type: "number", required: true },
    { id: "qualifyingMarks", label: "Qualifying degree marks %", section: "Academics", type: "number", required: true, help: "55% unless already admitted to a QS top-1000 institute." },
    { id: "qsWorldRank", label: "QS world rank of foreign institute (if known)", section: "Overseas", type: "number", required: false },
    { id: "fieldOfStudy", label: "Field of study bucket", section: "Overseas", type: "select", required: true, options: [
      { value: "STEM", label: "Pure/Applied Science / Engineering / Technology / Mathematics (10 slots)" },
      { value: "MEFL", label: "Management, Economics, Finance, Law (4 slots)" },
      { value: "AGMED", label: "Agriculture / Medicine (4 slots)" },
      { value: "HUM", label: "Humanities / Social Science / Fine Arts (2 slots)" },
    ] },
    { id: "foreignInstitution", label: "Foreign institution", section: "Overseas", type: "text", required: true },
    { id: "admissionStatus", label: "Admission status", section: "Overseas", type: "select", required: true, options: [
      { value: "JOINED", label: "Already joined abroad" },
      { value: "OFFER", label: "Offer from QS top 1000, yet to join" },
      { value: "SEEKING", label: "Seeking admission (up to 2 years after selection)" },
    ] },
    { id: "oneChildDeclaration", label: "Only one child of the same parents claiming NOS", section: "Declarations", type: "boolean", required: true },
    { id: "previousNos", label: "Previously received NOS", section: "Declarations", type: "boolean", required: true },
    { id: "proposal", label: "Study / research proposal", section: "Overseas", type: "textarea", required: true },
  ],
  requiredDocuments: docs([
    ["ST_CERTIFICATE", "ST certificate", true],
    ["PVTG_CERTIFICATE", "PVTG certificate if claiming PVTG slot", false],
    ["INCOME_CERTIFICATE", "Income certificate", true],
    ["MARKSHEET", "Qualifying degree marksheet + conversion", true],
    ["ADMISSION_LETTER", "Offer / admission if available", false],
    ["RESEARCH_PROPOSAL", "Study or research proposal", true],
    ["AADHAAR", "Aadhaar / DigiLocker", true],
  ]),
  eligibilityRules: [
    rule({ id: "NOS-R01", description: "ST applicant", field: "stStatus", operator: "truthy", failOutcome: "INELIGIBLE", citation: gNos }),
    rule({ id: "NOS-R02", description: "Family income ≤ ₹6 lakh unless orphan waiver", field: "familyIncome", operator: "orphanIncomeExempt", value: 600000, failOutcome: "INELIGIBLE", citation: { ...gNos, sourcePage: "4" } }),
    rule({ id: "NOS-R03", description: "Only Master's / PhD / Post-doc; bachelor courses not covered", field: "programmeLevel", operator: "in", value: ["MASTERS", "PHD", "POSTDOC"], failOutcome: "INELIGIBLE", citation: gNos }),
    rule({ id: "NOS-R04", description: "55% in qualifying degree, waived if QS top 1000 admission already obtained", field: "qualifyingMarks", operator: "qsRankingExemptMarks", value: 55, failOutcome: "INELIGIBLE", citation: { ...gNos, sourcePage: "3-4" } }),
    rule({ id: "NOS-R05", description: "One child in a family / one-time assistance", field: "oneChildDeclaration", operator: "truthy", failOutcome: "INELIGIBLE", citation: { ...gNos, sourcePage: "4" } }),
    rule({ id: "NOS-R06", description: "Not a previous NOS awardee", field: "previousNos", operator: "falsy", failOutcome: "INELIGIBLE", citation: { ...gNos, sourcePage: "4" } }),
    rule({ id: "NOS-R07", description: "Age cap by programme (Master's 32 / PhD 35 / Post-doc 38) — review if boundary", field: "ageOn1July", operator: "lte", value: 38, failOutcome: "REVIEW_REQUIRED", citation: { ...gNos, sourcePage: "3" } }),
  ],
  workflow: ["DRAFT", "SUBMITTED", "DOCUMENT_INTELLIGENCE", "ELIGIBILITY", "MOTA_SCRUTINY", "COMMITTEE", "AUTHORISED_DECISION", "AWARDED"],
  selectionModel: {
    type: "COMMITTEE_RANKED",
    combinedWith: ["QUOTA_BUCKETED"],
    slots: 20,
    committeeRequired: true,
    humanFinalDecision: true,
    buckets: [
      { id: "ST", label: "ST candidates", slots: 17, predicate: { pvtg: false } },
      { id: "PVTG", label: "PVTG", slots: 3, predicate: { pvtg: true }, overflowTo: "ST" },
    ],
    citation: { sourceDocument: "Revised NOS Guidelines + MoTA About (interview-based Expert Committee merit list)", sourcePage: "8-9", effectiveFrom: "2021-04-01", note: "2026-27 eligibility/course amendment overrides base where dated later." },
    notes: "System prepares the dossier. Committee supplies subjective assessment. 30% female earmark. Field-of-study slots: 10/4/4/2.",
  },
  awardRules: [
    { id: "NOS-A1", label: "Tuition, maintenance, contingency, visa, insurance, travel via Mission/MEA", formula: "mission_disbursement", citation: { sourceDocument: "NOS portal About", sourcePage: "current", effectiveFrom: "2026-04-01" } },
  ],
  renewalRules: ["Selected students have up to 2 years to secure foreign admission. Unfilled seats carry over."],
  integrations: ["NOS portal", "DigiLocker", "Indian Missions / MEA", "PFMS (boundary)"],
  conflicts: [
    {
      id: "NOS-C1",
      topic: "2026-27 eligibility and courses",
      olderMaterial: "2021-25 / 7 Oct 2022 base guideline",
      currentSource: "Amendment in eligibility criteria and courses covered from 2026-27",
      resolution: "Amendment overrides base. Attach the 2026-27 PDF as a new scheme version when line-level extraction is complete. Do not merge silently.",
      citation: { sourceDocument: "NOS 2026-27 eligibility/course amendment", sourcePage: "amendment", effectiveFrom: "2026-04-01", supersedes: "RevisedGuidelinesNOS07102022.pdf where they conflict" },
    },
  ],
  officialSources: ["Revised NOS Guidelines 07 Oct 2022", "NOS portal updated 14 Sep 2026", "NOS Advertisement 2026-27"],
};

export const SCHEMES: SchemeConfig[] = [PRE_MATRIC, POST_MATRIC, TOP_CLASS, NFST, NOS];

export function schemeByCode(code: string) {
  const scheme = SCHEMES.find((s) => s.code === code);
  if (!scheme) throw new Error(`Unknown scheme ${code}`);
  return scheme;
}
