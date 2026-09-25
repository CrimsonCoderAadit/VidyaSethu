import { Shell, Stamp } from "@/components/Shell";
import { inoVerifyAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { roleContact } from "@/lib/roles";
import { humanizeEnum } from "@/lib/format";
import { WifiOff } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InoPage() {
  const user = await requireRole(["INO"]);
  if (!user) redirect("/");
  const db = (await loadDb());
  const apps = db.applications.filter((a) => a.status === "INSTITUTION_VERIFICATION");
  const motaEmail = roleContact(db.users, "MOTA");

  return (
    <Shell user={user}>
      <p className="meta">Institution desk</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Institution verification</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        {apps.length} application{apps.length === 1 ? "" : "s"} waiting on your confirmation of admission, programme
        and registration details. You confirm or flag it; the authorised decision stays with MoTA.
      </p>
      <Link href="/ino/offline" className="card card-hover mb-6 flex items-center gap-3 p-4 text-sm">
        <WifiOff className="h-5 w-5 shrink-0 text-[color:var(--accent)]" />
        <span>
          <span className="block font-semibold">Weak signal on campus? Use offline batch verification</span>
          <span className="text-[color:var(--muted)]">Download the pending files, verify them with no network, and sync later.</span>
        </span>
      </Link>
      {apps.length === 0 ? (
        <p className="card p-5 text-sm text-[color:var(--muted)]">Nothing pending. New files appear here as soon as a scheme routes them to institution verification.</p>
      ) : null}
      <div className="space-y-4">
        {apps.map((app) => (
          <article key={app.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{app.applicantName}</h2>
                <p className="meta">{app.id}</p>
              </div>
              <Stamp>{humanizeEnum(app.schemeCode)}</Stamp>
            </div>
            <p className="mt-2 text-sm">{app.institutionName}</p>

            <form
              className="mt-4 flex flex-wrap gap-2"
              action={async (fd) => {
                "use server";
                await inoVerifyAction(app.id, true, String(fd.get("note") ?? "Admission confirmed"));
              }}
            >
              <input name="note" defaultValue="Admission, programme and registration confirmed." className="field-input flex-1" />
              <button className="btn-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]">Verify and forward</button>
            </form>
            {motaEmail ? (
              <p className="mt-2 text-xs text-[color:var(--muted)]">Forwards to the MoTA Verification Officer ({motaEmail}) for scrutiny.</p>
            ) : null}

            <form
              className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--border)] pt-3"
              action={async (fd) => {
                "use server";
                await inoVerifyAction(app.id, false, String(fd.get("reason") ?? "Admission/programme details could not be confirmed."));
              }}
            >
              <input name="reason" placeholder="What can't be confirmed, and what should the applicant fix?" className="field-input flex-1" required />
              <button className="btn-outline px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--accent)]">Flag discrepancy</button>
            </form>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Sends a correction request straight back to the applicant. It does not reject the application. Only
              MoTA can record a final decision.
            </p>
          </article>
        ))}
      </div>
    </Shell>
  );
}
