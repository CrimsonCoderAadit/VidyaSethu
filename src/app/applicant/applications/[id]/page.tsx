import { EligibilityPanel } from "@/components/EligibilityPanel";
import { Shell, Stamp } from "@/components/Shell";
import { StagePipeline } from "@/components/StagePipeline";
import { computeEntitlement } from "@/engine/eligibility";
import { confirmJoiningAction, raiseAppealAction, recoverDocumentAction, requestRenewalAction, resolveDeficiencyAction } from "@/lib/actions";
import { BHASHINI_ENABLED, translateFreeText } from "@/lib/bhashini";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { getT } from "@/lib/lang";
import { hitlLabel, humanizeEnum } from "@/lib/format";
import { schemeByCode } from "@/schemes/registry";
import { notFound, redirect } from "next/navigation";

const AWARD_STAGES = ["AWARDED", "JOINING_PENDING", "ACTIVE", "RENEWAL_DUE", "RENEWAL_REVIEW", "COMPLETED"];
const AWARD_LABELS: Record<string, string> = {
  AWARDED: "Sanctioned",
  JOINING_PENDING: "Joining pending",
  ACTIVE: "Active award",
  RENEWAL_DUE: "Renewal due",
  RENEWAL_REVIEW: "Renewal under review",
  COMPLETED: "Completed",
};

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  const { id } = await params;
  const db = loadDb();
  const { t, lang } = await getT();
  const app = db.applications.find((a) => a.id === id && a.applicantId === user.id);
  if (!app) notFound();
  const scheme = schemeByCode(app.schemeCode);
  const entitlement = computeEntitlement(scheme, app.facts);
  const award = db.awards.find((a) => a.applicationId === app.id);
  const openDefs = app.deficiencies.filter((d) => d.status === "OPEN");
  const translated = await Promise.all(openDefs.map((d) => translateFreeText(d.reason, lang)));
  const recoveries = app.documents.filter((d) => d.recovery?.status === "OPEN" || (d.recovery && d.recovery.path === "ASSISTED_ENTRY"));
  const needsFix = app.documents.filter((d) => d.recovery?.status === "OPEN" && d.recovery.path !== "ASSISTED_ENTRY");

  return (
    <Shell user={user}>
      <p className="meta">{app.id}</p>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{scheme.shortName}</h1>
        <Stamp>{t(humanizeEnum(app.status))}</Stamp>
        <Stamp tone="rule">{hitlLabel(app.hitlLevel)}</Stamp>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">{t("Application progress")}</h2>
        <StagePipeline stages={scheme.workflow} current={app.status} labels={Object.fromEntries(scheme.workflow.map((s) => [s, t(humanizeEnum(s))]))} />
      </section>

      <div className="mt-6">{app.eligibility ? <EligibilityPanel result={app.eligibility} /> : null}</div>

      {entitlement ? (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">{t("Entitlement preview")}</h2>
          <p className="mt-2 text-sm">{entitlement.label}{entitlement.amount ? ` · ₹${entitlement.amount.toLocaleString("en-IN")}` : ""}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[color:var(--muted)]">
            {entitlement.breakdown.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {recoveries.length ? (
        <section className="card card-accent-warn mt-6 p-5">
          <h2 className="font-semibold">{t("Document recovery")}</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Unreadable photos come straight back to you with a fix. No officer has to chase them.
          </p>
          <ul className="mt-3 space-y-3">
            {recoveries.map((d) => (
              <li key={d.id} className="rounded-md border border-[color:var(--line)] p-3 text-sm">
                <p className="font-semibold">{humanizeEnum(d.documentType)}</p>
                <p className="mt-1">{d.recovery!.reason} {d.recovery!.guidance}</p>
                {d.recovery!.path === "DIGILOCKER" ? (
                  <form action={recoverDocumentAction.bind(null, app.id, d.id, "DIGILOCKER")} className="mt-2">
                    <button className="btn-primary px-4 py-2.5 text-sm font-semibold" style={{ background: "#5a2d82" }}>{t("Fetch from DigiLocker")}</button>
                  </form>
                ) : d.recovery!.path === "RETAKE" ? (
                  <form action={recoverDocumentAction.bind(null, app.id, d.id, "RETAKE")} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="file" name="photo" accept="image/*" capture="environment" className="text-xs" />
                    <button className="btn-primary px-4 py-2.5 text-sm font-semibold">{t("Retake the photo")}</button>
                  </form>
                ) : (
                  <p className="meta mt-2">Nothing to do. An officer compares {d.recovery!.typedFields?.length ?? 0} field(s) side by side.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openDefs.length && needsFix.length === 0 ? (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold text-[color:var(--accent)]">{t("Action required")}</h2>
          {openDefs.map((d, i) => (
            <div key={d.id} className="mt-2 text-sm">
              <p>{translated[i] ?? d.reason}</p>
              {lang !== "en" && translated[i] && translated[i] !== d.reason ? (
                <details className="meta mt-1"><summary>{t("Original text")}</summary>{d.reason}</details>
              ) : lang !== "en" && !BHASHINI_ENABLED ? (
                <p className="meta mt-1">Officer notes are auto-translated through Bhashini once the API key is configured.</p>
              ) : null}
            </div>
          ))}
          <form action={resolveDeficiencyAction.bind(null, app.id)} className="mt-4">
            <button className="btn-primary px-4 py-2 text-sm font-semibold">{t("Resubmit corrections")}</button>
          </form>
        </section>
      ) : null}

      {award ? (
        <section className="card mt-6 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Award & fellowship lifecycle</h2>
            <Stamp tone={award.status === "PAID" ? "ok" : "stamp"}>{humanizeEnum(award.status)}</Stamp>
          </div>
          <StagePipeline stages={AWARD_STAGES} current={award.lifecycle} labels={AWARD_LABELS} />

          <ul className="mt-5 space-y-2 text-sm">
            {award.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <span className={`stamp ${m.status === "DONE" ? "text-spine" : ""}`}>{humanizeEnum(m.status)}</span>
                {m.label}
              </li>
            ))}
          </ul>

          <ul className="mt-4 list-disc pl-5 text-sm text-[color:var(--muted)]">
            {award.components.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          {award.lifecycle === "AWARDED" ? (
            <form action={confirmJoiningAction.bind(null, award.id)} className="mt-4">
              <button className="btn-primary px-4 py-2 text-sm font-semibold">Confirm joining / acceptance</button>
            </form>
          ) : null}

          {award.lifecycle === "ACTIVE" ? (
            <form action={requestRenewalAction.bind(null, award.id)} className="mt-4">
              <button className="btn-outline px-4 py-2 text-sm font-semibold">Request renewal / continuation</button>
            </form>
          ) : null}
        </section>
      ) : null}

      {app.status === "REJECTED" || app.authorisedDecision === "REJECTED" ? (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">Appeal / reconsideration</h2>
          <form
            className="mt-3"
            action={async (fd) => {
              "use server";
              await raiseAppealAction(app.id, String(fd.get("reason") ?? ""));
            }}
          >
            <textarea name="reason" className="field-input" placeholder="What should be reconsidered, and on which evidence?" />
            <button className="btn-primary mt-3 px-4 py-2 text-sm font-semibold">File appeal</button>
          </form>
        </section>
      ) : null}

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">{t("Documents & evidence")}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {app.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 border-t border-[color:var(--border)] pt-2 first:border-0 first:pt-0">
              <span className="min-w-0 break-words">{humanizeEnum(d.documentType)} · {d.fileName}</span>
              <span className="meta shrink-0">
                {d.source === "DIGILOCKER" ? "DigiLocker · issuer-signed · trust A" : `OCR ${Math.round(d.ocrConfidence * 100)}% · trust ${d.trust} · ${humanizeEnum(d.quality)}`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
