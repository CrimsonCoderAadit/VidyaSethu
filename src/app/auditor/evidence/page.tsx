import { Shell, Stamp } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import Link from "next/link";
import { humanizeEnum } from "@/lib/format";
import { redirect } from "next/navigation";

export default async function EvidenceVaultPage() {
  const user = await requireRole(["AUDITOR"]);
  if (!user) redirect("/");
  const db = (await loadDb());
  const rows = db.applications
    .flatMap((app) => app.documents.map((doc) => ({ app, doc })))
    .sort((a, b) => a.doc.trust.localeCompare(b.doc.trust));

  const lowTrust = rows.filter((r) => r.doc.trust === "D" || r.doc.trust === "E").length;

  return (
    <Shell user={user}>
      <p className="meta">Read-only</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Evidence vault</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        Every document ingested across every application, with its evidence-trust level (A to E) and OCR confidence.
        These are separate signals, per the source-document trust model. {lowTrust} document{lowTrust === 1 ? "" : "s"} sit
        at trust D/E and rely on a human confirmation rather than a trusted source.
      </p>
      <div className="card overflow-x-auto p-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-xs uppercase tracking-wide text-[color:var(--muted)]">
              <th className="p-3">Application</th>
              <th>Applicant</th>
              <th>Document</th>
              <th>OCR confidence</th>
              <th>Trust</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ app, doc }) => (
              <tr key={doc.id} className="border-t border-[color:var(--border)]">
                <td className="p-3">
                  <Link href={`/officer/${app.id}`} className="text-[color:var(--primary)] hover:underline">{app.id}</Link>
                </td>
                <td>{app.applicantName}</td>
                <td>{humanizeEnum(doc.documentType)}</td>
                <td>{Math.round(doc.ocrConfidence * 100)}%</td>
                <td>
                  <Stamp tone={doc.trust <= "C" ? "ok" : doc.trust === "D" ? "rule" : "danger"}>{doc.trust}</Stamp>
                </td>
                <td className="meta">{humanizeEnum(doc.quality)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
