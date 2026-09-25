/**
 * Runtime translation of free text (officer deficiency notes, remarks) via Bhashini — the
 * Government of India's language platform (ULCA pipeline API).
 *
 *   1. POST https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline
 *      headers: userID, ulcaApiKey → returns the inference endpoint, its API key, and serviceId
 *   2. POST <callbackUrl> with the inference key → pipelineResponse[0].output[0].target
 *
 * Configure BHASHINI_USER_ID + BHASHINI_API_KEY. Without them this returns null and the UI shows
 * the original English with a note. Results are memoised per process.
 */
import type { Lang } from "./i18n";

const PIPELINE_ID = "64392f96daac500b55c543cd"; // MeitY translation pipeline
const cache = new Map<string, string>();
let endpoint: { url: string; header: string; key: string; serviceIds: Map<string, string> } | null = null;

export const BHASHINI_ENABLED = !!(process.env.BHASHINI_USER_ID && process.env.BHASHINI_API_KEY);

async function withTimeout<T>(p: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

async function resolveEndpoint(target: Lang) {
  if (endpoint?.serviceIds.has(target)) return endpoint;
  const res = await withTimeout(
    fetch("https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json", userID: process.env.BHASHINI_USER_ID!, ulcaApiKey: process.env.BHASHINI_API_KEY! },
      body: JSON.stringify({
        pipelineTasks: [{ taskType: "translation", config: { language: { sourceLanguage: "en", targetLanguage: target } } }],
        pipelineRequestConfig: { pipelineId: PIPELINE_ID },
      }),
    }),
  );
  const json = await res.json();
  const inf = json.pipelineInferenceAPIEndPoint;
  const serviceId = json.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
  endpoint ??= { url: inf.callbackUrl, header: inf.inferenceApiKey.name, key: inf.inferenceApiKey.value, serviceIds: new Map() };
  endpoint.serviceIds.set(target, serviceId);
  return endpoint;
}

export async function translateFreeText(text: string, target: Lang): Promise<string | null> {
  if (target === "en" || !text.trim()) return text;
  if (!BHASHINI_ENABLED) return null;
  const key = `${target}:${text}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const ep = await resolveEndpoint(target);
    const res = await withTimeout(
      fetch(ep.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", [ep.header]: ep.key },
        body: JSON.stringify({
          pipelineTasks: [{ taskType: "translation", config: { language: { sourceLanguage: "en", targetLanguage: target }, serviceId: ep.serviceIds.get(target) } }],
          inputData: { input: [{ source: text }] },
        }),
      }),
    );
    const out: string | undefined = (await res.json()).pipelineResponse?.[0]?.output?.[0]?.target;
    if (out) cache.set(key, out);
    return out ?? null;
  } catch {
    return null;
  }
}
