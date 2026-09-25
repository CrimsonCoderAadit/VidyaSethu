"use client";

import type { SchemeConfig } from "@/engine/types";
import { submitApplicationAction } from "@/lib/actions";
import type { IssuedDocument } from "@/lib/digilocker";
import { t as translate, type Lang } from "@/lib/i18n";
import { Camera, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Capture = { before: number; after: number; condition: "CLEAR" | "BLURRY" | "DARK" };

/**
 * Downscale a phone photo to ≤1600px JPEG (≈150–300 KB instead of 3–6 MB) so it uploads on
 * 2G/3G, and run a cheap on-device quality check (brightness + Laplacian-variance sharpness)
 * so a blurry or dark photo is caught before upload, not days later by an officer.
 */
async function compressAndCheck(file: File): Promise<{ file: File; info: Capture }> {
  if (!file.type.startsWith("image/")) return { file, info: { before: file.size, after: file.size, condition: "CLEAR" } };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  // Quality check on a 256px grayscale thumbnail.
  const S = 256;
  const tw = Math.min(S, canvas.width);
  const th = Math.max(1, Math.round((canvas.height / canvas.width) * tw));
  const small = document.createElement("canvas");
  small.width = tw;
  small.height = th;
  const sctx = small.getContext("2d")!;
  sctx.drawImage(canvas, 0, 0, tw, th);
  const px = sctx.getImageData(0, 0, tw, th).data;
  const gray = new Float32Array(tw * th);
  let sum = 0;
  for (let i = 0; i < tw * th; i++) {
    gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    sum += gray[i];
  }
  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < th - 1; y++) {
    for (let x = 1; x < tw - 1; x++) {
      const i = y * tw + x;
      const lap = gray[i - 1] + gray[i + 1] + gray[i - tw] + gray[i + tw] - 4 * gray[i];
      lapSum += lap;
      lapSq += lap * lap;
      n++;
    }
  }
  const variance = n ? lapSq / n - (lapSum / n) ** 2 : 0;
  const brightness = sum / (tw * th);
  const condition: Capture["condition"] = brightness < 60 ? "DARK" : variance < 60 ? "BLURRY" : "CLEAR";

  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.72));
  const out = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  return { file: out, info: { before: file.size, after: out.size, condition } };
}

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function DynamicForm({ scheme, lang, issued }: { scheme: SchemeConfig; lang: Lang; issued: IssuedDocument[] }) {
  const t = (s: string) => translate(lang, s);
  const sections = [...new Set(scheme.applicationSchema.map((f) => f.section))];
  const [pending, setPending] = useState(false);
  const [dlStep, setDlStep] = useState<"idle" | "otp" | "linked">("idle");
  const [fromDl, setFromDl] = useState<Record<string, boolean>>({});
  const [captures, setCaptures] = useState<Record<string, Capture>>({});
  const issuedFor = (docId: string) => issued.find((d) => d.mapsTo === docId);

  return (
    <form
      className="space-y-6 md:space-y-8"
      action={async (fd) => {
        setPending(true);
        await submitApplicationAction(scheme.code, fd);
      }}
    >
      {/* DigiLocker first: every document fetched here skips photos and OCR entirely. */}
      <fieldset className="card p-4 md:p-5" style={{ borderLeftColor: "#5a2d82" }}>
        <legend className="font-[family-name:var(--font-display)] px-2 text-xl">DigiLocker</legend>
        {dlStep === "idle" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-[color:var(--muted)]">
              Fetch your certificates straight from the issuing department. No photos, no uploads over a weak network, no
              OCR errors. {issued.length} of {scheme.requiredDocuments.length} documents for this scheme are available.
            </p>
            <button type="button" onClick={() => setDlStep("otp")} className="btn-primary px-4 py-2.5 text-sm font-semibold" style={{ background: "#5a2d82" }}>
              {t("Connect DigiLocker")}
            </button>
          </div>
        ) : dlStep === "otp" ? (
          <div className="space-y-3 text-sm">
            <p>
              Consent: share the documents below with <strong>Ministry of Tribal Affairs, Vidya Setu</strong> for this application only.
              DigiLocker sends an OTP to your Aadhaar-linked mobile.
            </p>
            <div className="flex flex-wrap gap-2">
              <input inputMode="numeric" maxLength={6} placeholder="6-digit OTP (demo: any)" className="field-input max-w-[14rem]" />
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm font-semibold"
                style={{ background: "#5a2d82" }}
                onClick={() => {
                  setDlStep("linked");
                  setFromDl(Object.fromEntries(issued.map((d) => [d.mapsTo, true])));
                }}
              >
                Allow
              </button>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--ok)" }}>
            <ShieldCheck className="h-4 w-4" /> DigiLocker linked. {issued.length} issuer-signed documents attached below.
          </p>
        )}
      </fieldset>

      {sections.map((section) => (
        <fieldset key={section} className="card p-4 md:p-5">
          <legend className="font-[family-name:var(--font-display)] px-2 text-xl">{t(section)}</legend>
          <div className="grid gap-4 md:grid-cols-2">
            {scheme.applicationSchema
              .filter((f) => f.section === section)
              .map((field) => (
                <label key={field.id} className="block text-sm">
                  <span className="mb-1 block font-semibold">
                    {t(field.label)}
                    {field.required ? " *" : ""}
                  </span>
                  {field.help ? <span className="mb-1 block text-xs text-[color:var(--muted)]">{t(field.help)}</span> : null}
                  {field.type === "textarea" ? (
                    <textarea name={field.id} required={field.required} className="field-input" rows={4} />
                  ) : field.type === "boolean" ? (
                    <select name={field.id} required={field.required} className="field-input" defaultValue="false">
                      <option value="false">{t("No")}</option>
                      <option value="true">{t("Yes")}</option>
                    </select>
                  ) : field.type === "select" ? (
                    <select name={field.id} required={field.required} className="field-input" defaultValue="">
                      <option value="" disabled>
                        {t("Select")}
                      </option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {t(o.label)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.id}
                      type={field.type === "number" || field.type === "currency" ? "number" : field.id === "mobile" ? "tel" : field.type}
                      inputMode={field.type === "number" || field.type === "currency" ? "numeric" : field.id === "mobile" ? "tel" : undefined}
                      required={field.required}
                      className="field-input"
                    />
                  )}
                </label>
              ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="card p-4 md:p-5">
        <legend className="font-[family-name:var(--font-display)] px-2 text-xl">{t("Documents required by this scheme version")}</legend>
        <ul className="divide-y divide-[color:var(--border)] text-sm">
          {scheme.requiredDocuments.map((doc) => {
            const dl = issuedFor(doc.id);
            const useDl = !!(dl && fromDl[doc.id]);
            const cap = captures[doc.id];
            return (
              <li key={doc.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {doc.label}{" "}
                    <em className={`not-italic text-xs ${doc.mandatory ? "text-[color:var(--accent)]" : "text-[color:var(--muted)]"}`}>
                      {t(doc.mandatory ? "mandatory" : "optional")}
                    </em>
                  </span>
                  {dl ? (
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={useDl}
                        onChange={(e) => {
                          if (dlStep !== "linked") setDlStep("otp");
                          else setFromDl((m) => ({ ...m, [doc.id]: e.target.checked }));
                        }}
                        className="h-4 w-4"
                      />
                      {t("Fetch from DigiLocker")}
                    </label>
                  ) : null}
                </div>

                {useDl ? (
                  <p className="mt-2 flex items-start gap-2 rounded-md bg-[color:var(--ok-bg)] p-2 text-xs">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ok)]" />
                    <span>
                      {t("From DigiLocker — issuer-signed, no OCR needed")}
                      <span className="meta block">{dl!.issuer} · {dl!.uri}</span>
                    </span>
                    <input type="hidden" name={`dl-${doc.id}`} value="1" />
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <label className="btn-outline inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold">
                      <Camera className="h-4 w-4" />
                      {t("Take photo / upload")}
                      <input
                        type="file"
                        name={`doc-${doc.id}`}
                        accept="image/*,application/pdf"
                        capture="environment"
                        className="sr-only"
                        onChange={async (e) => {
                          const input = e.currentTarget;
                          const f = input.files?.[0];
                          if (!f) return;
                          try {
                            const { file, info } = await compressAndCheck(f);
                            const dt = new DataTransfer();
                            dt.items.add(file);
                            input.files = dt.files;
                            setCaptures((c) => ({ ...c, [doc.id]: info }));
                          } catch {
                            /* keep the original file if the browser can't decode it */
                          }
                        }}
                      />
                    </label>
                    {cap ? (
                      <p className="text-xs">
                        {cap.condition === "CLEAR" ? (
                          <span style={{ color: "var(--ok)" }}>✓ {t("Photo compressed for slow networks")}: {kb(cap.before)} → {kb(cap.after)}</span>
                        ) : (
                          <span style={{ color: "var(--warn)" }}>
                            ⚠ Photo looks {cap.condition === "DARK" ? "too dark" : "blurry"}. Retake it in daylight, holding the phone steady.
                            {dl ? " Or tick DigiLocker above." : ""}
                          </span>
                        )}
                      </p>
                    ) : null}
                    <input type="hidden" name={`qc-${doc.id}`} value={cap?.condition ?? ""} />
                    {/* Demo control: lets evaluators trigger each OCR-failure path without a real bad photo. */}
                    <label className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
                      Demo: photo condition
                      <select name={`q-${doc.id}`} defaultValue="" className="rounded border border-[color:var(--line)] bg-white px-1 py-0.5 text-xs" style={{ minHeight: 0, fontSize: 12 }}>
                        <option value="">As captured</option>
                        <option value="CLEAR">Clear print</option>
                        <option value="CRUMPLED">Crumpled / cut off</option>
                        <option value="BLURRY">Blurry</option>
                        <option value="DARK">Too dark</option>
                        <option value="HANDWRITTEN">Handwritten certificate</option>
                      </select>
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      <button disabled={pending} className="btn-primary w-full px-5 py-3 text-sm font-semibold md:w-auto">
        {pending ? t("Submitting…") : t("Submit application")}
      </button>
    </form>
  );
}
