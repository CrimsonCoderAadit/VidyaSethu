import { OfflineBatch } from "@/components/OfflineBatch";
import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InoOfflinePage() {
  const user = await requireRole(["INO"]);
  if (!user) redirect("/");
  return (
    <Shell user={user}>
      <p className="meta">Institution desk · offline-first</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Offline batch verification</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        For campuses and ashram schools with no reliable signal. Download the pending files while connected, then verify them
        with no network. This page and its data are stored on the device. Decisions sync automatically when the connection
        returns. A decision on a file that changed in the meantime comes back as a conflict. It is never silently applied.
      </p>
      <OfflineBatch />
    </Shell>
  );
}
