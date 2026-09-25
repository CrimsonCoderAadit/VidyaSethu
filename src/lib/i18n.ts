/**
 * Regional-language UI for the applicant journey.
 *
 * Static UI strings come from this reviewed dictionary (English text is the key, so an
 * untranslated string simply falls back to English). Free text written by officers —
 * deficiency reasons, notes — is translated at runtime through Bhashini (see bhashini.ts)
 * when an API key is configured. Both are plain modules usable on server and client.
 */

export const LANGS = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];
export const LANG_COOKIE = "vs_lang";

export function asLang(v: string | undefined | null): Lang {
  return LANGS.some((l) => l.code === v) ? (v as Lang) : "en";
}

type Entry = { hi: string; or: string };

const D: Record<string, Entry> = {
  // Shell + navigation
  "My applications": { hi: "मेरे आवेदन", or: "ମୋର ଆବେଦନ" },
  "Apply for a scheme": { hi: "योजना के लिए आवेदन", or: "ଯୋଜନା ପାଇଁ ଆବେଦନ" },
  "Eligibility pre-check": { hi: "पात्रता जाँच", or: "ଯୋଗ୍ୟତା ଯାଞ୍ଚ" },
  "WhatsApp / SMS": { hi: "व्हाट्सऐप / एसएमएस", or: "ହ୍ୱାଟସଆପ୍ / ଏସଏମଏସ" },
  Home: { hi: "होम", or: "ମୂଳ" },
  Apply: { hi: "आवेदन", or: "ଆବେଦନ" },
  Check: { hi: "जाँच", or: "ଯାଞ୍ଚ" },
  Chat: { hi: "चैट", or: "ଚାଟ୍" },
  "Sign out": { hi: "साइन आउट", or: "ସାଇନ୍ ଆଉଟ୍" },
  "Sign in": { hi: "साइन इन", or: "ସାଇନ୍ ଇନ୍" },
  Notifications: { hi: "सूचनाएँ", or: "ବିଜ୍ଞପ୍ତି" },
  Language: { hi: "भाषा", or: "ଭାଷା" },
  "Track your applications, resolve deficiencies, and file new scheme applications.": {
    hi: "अपने आवेदन देखें, कमियाँ ठीक करें और नई योजना के लिए आवेदन करें।",
    or: "ଆପଣଙ୍କ ଆବେଦନ ଦେଖନ୍ତୁ, ତ୍ରୁଟି ସୁଧାରନ୍ତୁ ଏବଂ ନୂଆ ଯୋଜନା ପାଇଁ ଆବେଦନ କରନ୍ତୁ।",
  },

  // Applicant home
  "Applicant desk": { hi: "आवेदक डेस्क", or: "ଆବେଦନକାରୀ ଡେସ୍କ" },
  "Your files": { hi: "आपके आवेदन", or: "ଆପଣଙ୍କ ଆବେଦନ" },
  "File a new scheme": { hi: "नया आवेदन करें", or: "ନୂଆ ଆବେଦନ କରନ୍ତୁ" },
  "Applications on file": { hi: "कुल आवेदन", or: "ମୋଟ ଆବେଦନ" },
  "Awarded / decided": { hi: "स्वीकृत / निर्णय हुआ", or: "ମଞ୍ଜୁର / ନିଷ୍ପତ୍ତି ହୋଇଛି" },
  "Need your action": { hi: "आपकी कार्रवाई ज़रूरी", or: "ଆପଣଙ୍କ କାର୍ଯ୍ୟ ଆବଶ୍ୟକ" },
  "Where your files stand": { hi: "आपके आवेदन कहाँ हैं", or: "ଆପଣଙ୍କ ଆବେଦନ କେଉଁଠି ଅଛି" },
  Notices: { hi: "सूचनाएँ", or: "ବିଜ୍ଞପ୍ତି" },
  Eligibility: { hi: "पात्रता", or: "ଯୋଗ୍ୟତା" },
  "Get status on WhatsApp or SMS": { hi: "स्थिति व्हाट्सऐप या एसएमएस पर पाएँ", or: "ସ୍ଥିତି ହ୍ୱାଟସଆପ୍ କିମ୍ବା ଏସଏମଏସରେ ପାଆନ୍ତୁ" },
  "No need to log in to check. Send your application ID to the Vidya Setu number. Alerts come automatically when an officer flags a document.": {
    hi: "जाँचने के लिए लॉग इन की ज़रूरत नहीं। अपना आवेदन नंबर विद्या सेतु नंबर पर भेजें। अधिकारी किसी दस्तावेज़ पर आपत्ति करे तो सूचना अपने-आप आएगी।",
    or: "ଯାଞ୍ଚ ପାଇଁ ଲଗ୍ ଇନ୍ ଦରକାର ନାହିଁ। ଆପଣଙ୍କ ଆବେଦନ ନମ୍ବର ବିଦ୍ୟା ସେତୁ ନମ୍ବରକୁ ପଠାନ୍ତୁ। ଅଧିକାରୀ କୌଣସି ଦଲିଲରେ ଆପତ୍ତି କଲେ ସୂଚନା ନିଜେ ଆସିବ।",
  },

  // Workflow stages
  Draft: { hi: "मसौदा", or: "ଡ୍ରାଫ୍ଟ" },
  Submitted: { hi: "जमा किया गया", or: "ଦାଖଲ ହୋଇଛି" },
  "Document intelligence": { hi: "दस्तावेज़ जाँच", or: "ଦଲିଲ ଯାଞ୍ଚ" },
  "Institution verification": { hi: "संस्थान सत्यापन", or: "ଅନୁଷ୍ଠାନ ଯାଞ୍ଚ" },
  "State verification": { hi: "राज्य सत्यापन", or: "ରାଜ୍ୟ ଯାଞ୍ଚ" },
  "MoTA scrutiny": { hi: "मंत्रालय जाँच", or: "ମନ୍ତ୍ରଣାଳୟ ଯାଞ୍ଚ" },
  Deficiency: { hi: "कमी — सुधार ज़रूरी", or: "ତ୍ରୁଟି — ସୁଧାର ଆବଶ୍ୟକ" },
  Selection: { hi: "चयन", or: "ଚୟନ" },
  Committee: { hi: "समिति", or: "କମିଟି" },
  "Authorised decision": { hi: "अधिकृत निर्णय", or: "ଅଧିକୃତ ନିଷ୍ପତ୍ତି" },
  Awarded: { hi: "स्वीकृत", or: "ମଞ୍ଜୁର" },
  Rejected: { hi: "अस्वीकृत", or: "ପ୍ରତ୍ୟାଖ୍ୟାତ" },
  Eligible: { hi: "पात्र", or: "ଯୋଗ୍ୟ" },
  Ineligible: { hi: "अपात्र", or: "ଅଯୋଗ୍ୟ" },
  Deficient: { hi: "अधूरा", or: "ଅସମ୍ପୂର୍ଣ୍ଣ" },
  "Review required": { hi: "समीक्षा ज़रूरी", or: "ସମୀକ୍ଷା ଆବଶ୍ୟକ" },

  // Schemes + apply
  "Scheme registry · published versions only": { hi: "योजना सूची · केवल प्रकाशित संस्करण", or: "ଯୋଜନା ତାଲିକା · କେବଳ ପ୍ରକାଶିତ ସଂସ୍କରଣ" },
  "Choose a scheme, not a score": { hi: "अपनी योजना चुनें", or: "ଆପଣଙ୍କ ଯୋଜନା ବାଛନ୍ତୁ" },
  "Open form": { hi: "फ़ॉर्म खोलें", or: "ଫର୍ମ ଖୋଲନ୍ତୁ" },
  Personal: { hi: "व्यक्तिगत", or: "ବ୍ୟକ୍ତିଗତ" },
  Category: { hi: "श्रेणी", or: "ବର୍ଗ" },
  Family: { hi: "परिवार", or: "ପରିବାର" },
  Payment: { hi: "भुगतान", or: "ଦେୟ" },
  Declarations: { hi: "घोषणाएँ", or: "ଘୋଷଣା" },
  School: { hi: "विद्यालय", or: "ବିଦ୍ୟାଳୟ" },
  Course: { hi: "पाठ्यक्रम", or: "ପାଠ୍ୟକ୍ରମ" },
  Institution: { hi: "संस्थान", or: "ଅନୁଷ୍ଠାନ" },
  Yes: { hi: "हाँ", or: "ହଁ" },
  No: { hi: "नहीं", or: "ନା" },
  Select: { hi: "चुनें", or: "ବାଛନ୍ତୁ" },
  "Full name": { hi: "पूरा नाम", or: "ପୂରା ନାମ" },
  "Date of birth": { hi: "जन्म तिथि", or: "ଜନ୍ମ ତାରିଖ" },
  Gender: { hi: "लिंग", or: "ଲିଙ୍ଗ" },
  Female: { hi: "महिला", or: "ମହିଳା" },
  Male: { hi: "पुरुष", or: "ପୁରୁଷ" },
  Other: { hi: "अन्य", or: "ଅନ୍ୟ" },
  "Mobile (Aadhaar-linked)": { hi: "मोबाइल (आधार से जुड़ा)", or: "ମୋବାଇଲ୍ (ଆଧାର ସହ ଯୋଡ଼ା)" },
  "Scheduled Tribe status (domicile State/UT)": { hi: "अनुसूचित जनजाति (मूल राज्य)", or: "ଅନୁସୂଚିତ ଜନଜାତି (ମୂଳ ରାଜ୍ୟ)" },
  "Domicile State/UT": { hi: "मूल राज्य / केंद्र शासित प्रदेश", or: "ମୂଳ ରାଜ୍ୟ / କେନ୍ଦ୍ରଶାସିତ ଅଞ୍ଚଳ" },
  PVTG: { hi: "विशेष रूप से कमज़ोर जनजातीय समूह (PVTG)", or: "ବିଶେଷ ଦୁର୍ବଳ ଜନଜାତି ଗୋଷ୍ଠୀ (PVTG)" },
  "Divyangjan (min. 40% where claimed)": { hi: "दिव्यांगजन (कम से कम 40%)", or: "ଦିବ୍ୟାଙ୍ଗଜନ (ଅତି କମରେ 40%)" },
  "Orphan supported by guardian": { hi: "अभिभावक द्वारा पालित अनाथ", or: "ଅଭିଭାବକଙ୍କ ଦ୍ୱାରା ପାଳିତ ଅନାଥ" },
  "If yes, income ceiling does not apply.": { hi: "हाँ होने पर आय सीमा लागू नहीं होती।", or: "ହଁ ହେଲେ ଆୟ ସୀମା ଲାଗୁ ହୁଏ ନାହିଁ।" },
  "Family income (₹ / year)": { hi: "पारिवारिक आय (₹ / वर्ष)", or: "ପାରିବାରିକ ଆୟ (₹ / ବର୍ଷ)" },
  "Valid scheduled-bank account": { hi: "मान्य बैंक खाता", or: "ବୈଧ ବ୍ୟାଙ୍କ ଖାତା" },
  "Aadhaar and mobile linked to bank": { hi: "आधार और मोबाइल बैंक से जुड़े हैं", or: "ଆଧାର ଓ ମୋବାଇଲ୍ ବ୍ୟାଙ୍କ ସହ ଯୋଡ଼ା" },
  "Receiving another scholarship for the same study": { hi: "इसी पढ़ाई के लिए दूसरी छात्रवृत्ति मिल रही है", or: "ଏହି ପଢ଼ା ପାଇଁ ଅନ୍ୟ ଛାତ୍ରବୃତ୍ତି ମିଳୁଛି" },
  Class: { hi: "कक्षा", or: "ଶ୍ରେଣୀ" },
  "Government / recognised school": { hi: "सरकारी / मान्यता प्राप्त विद्यालय", or: "ସରକାରୀ / ସ୍ୱୀକୃତ ବିଦ୍ୟାଳୟ" },
  Hosteller: { hi: "छात्रावास में रहते हैं", or: "ଛାତ୍ରାବାସରେ ରୁହନ୍ତି" },
  "Repeating the same class (already funded once)": { hi: "उसी कक्षा को दोहरा रहे हैं", or: "ସେହି ଶ୍ରେଣୀ ପୁଣି ପଢୁଛନ୍ତି" },
  "Application type": { hi: "आवेदन का प्रकार", or: "ଆବେଦନ ପ୍ରକାର" },
  Fresh: { hi: "नया", or: "ନୂଆ" },
  Renewal: { hi: "नवीनीकरण", or: "ନବୀକରଣ" },
  "Previous qualification (Class X or above)": { hi: "पिछली योग्यता (कक्षा 10 या ऊपर)", or: "ପୂର୍ବ ଯୋଗ୍ୟତା (ଦଶମ କିମ୍ବା ଉପର)" },
  "Course group": { hi: "पाठ्यक्रम समूह", or: "ପାଠ୍ୟକ୍ରମ ଗୋଷ୍ଠୀ" },
  "Compulsory non-refundable fees (₹)": { hi: "अनिवार्य शुल्क (₹)", or: "ବାଧ୍ୟତାମୂଳକ ଶୁଳ୍କ (₹)" },
  "Documents required by this scheme version": { hi: "इस योजना के लिए ज़रूरी दस्तावेज़", or: "ଏହି ଯୋଜନା ପାଇଁ ଆବଶ୍ୟକ ଦଲିଲ" },
  mandatory: { hi: "अनिवार्य", or: "ବାଧ୍ୟତାମୂଳକ" },
  optional: { hi: "वैकल्पिक", or: "ଇଚ୍ଛାଧୀନ" },
  "Submit application": { hi: "आवेदन जमा करें", or: "ଆବେଦନ ଦାଖଲ କରନ୍ତୁ" },
  "Submitting…": { hi: "जमा हो रहा है…", or: "ଦାଖଲ ହେଉଛି…" },
  "Fetch from DigiLocker": { hi: "डिजीलॉकर से लाएँ", or: "ଡିଜିଲକରରୁ ଆଣନ୍ତୁ" },
  "Connect DigiLocker": { hi: "डिजीलॉकर जोड़ें", or: "ଡିଜିଲକର ଯୋଡ଼ନ୍ତୁ" },
  "Take photo / upload": { hi: "फ़ोटो लें / अपलोड करें", or: "ଫଟୋ ନିଅନ୍ତୁ / ଅପଲୋଡ୍ କରନ୍ତୁ" },
  "From DigiLocker — issuer-signed, no OCR needed": {
    hi: "डिजीलॉकर से — जारीकर्ता द्वारा हस्ताक्षरित, OCR की ज़रूरत नहीं",
    or: "ଡିଜିଲକରରୁ — ଜାରିକର୍ତ୍ତାଙ୍କ ସ୍ୱାକ୍ଷରିତ, OCR ଦରକାର ନାହିଁ",
  },
  "Photo compressed for slow networks": { hi: "धीमे नेटवर्क के लिए फ़ोटो छोटी की गई", or: "ଧୀର ନେଟୱର୍କ ପାଇଁ ଫଟୋ ଛୋଟ କରାଗଲା" },

  // Application detail
  "Application progress": { hi: "आवेदन की प्रगति", or: "ଆବେଦନର ଅଗ୍ରଗତି" },
  "Entitlement preview": { hi: "मिलने वाली राशि (अनुमान)", or: "ମିଳିବାକୁ ଥିବା ରାଶି (ଆନୁମାନିକ)" },
  "Action required": { hi: "कार्रवाई ज़रूरी", or: "କାର୍ଯ୍ୟ ଆବଶ୍ୟକ" },
  "Resubmit corrections": { hi: "सुधार दोबारा जमा करें", or: "ସୁଧାର ପୁଣି ଦାଖଲ କରନ୍ତୁ" },
  "Documents & evidence": { hi: "दस्तावेज़ और प्रमाण", or: "ଦଲିଲ ଓ ପ୍ରମାଣ" },
  "Document recovery": { hi: "दस्तावेज़ सुधार", or: "ଦଲିଲ ସୁଧାର" },
  "Retake the photo": { hi: "फ़ोटो दोबारा लें", or: "ଫଟୋ ପୁଣି ନିଅନ୍ତୁ" },
  "Type the values from the certificate": { hi: "प्रमाणपत्र से जानकारी टाइप करें", or: "ପ୍ରମାଣପତ୍ରରୁ ତଥ୍ୟ ଟାଇପ୍ କରନ୍ତୁ" },
  "Fetched from DigiLocker instead": { hi: "इसके बजाय डिजीलॉकर से लिया गया", or: "ଏହା ବଦଳରେ ଡିଜିଲକରରୁ ନିଆଗଲା" },
  "Original text": { hi: "मूल पाठ", or: "ମୂଳ ପାଠ" },

  // Login
  "Desk / role": { hi: "डेस्क / भूमिका", or: "ଡେସ୍କ / ଭୂମିକା" },
  Account: { hi: "खाता", or: "ଖାତା" },
  "You are offline": { hi: "आप ऑफ़लाइन हैं", or: "ଆପଣ ଅଫଲାଇନ୍ ଅଛନ୍ତି" },
};

// Case-insensitive fallback so humanized enums ("MoTA Scrutiny") hit sentence-case keys.
const LOWER = new Map(Object.entries(D).map(([k, v]) => [k.toLowerCase(), v]));

export function t(lang: Lang, text: string): string {
  if (lang === "en") return text;
  return (D[text] ?? LOWER.get(text.toLowerCase()))?.[lang] ?? text;
}

/** Whether a dictionary entry exists — used to decide if Bhashini should translate free text. */
export function hasTranslation(text: string): boolean {
  return text in D;
}
