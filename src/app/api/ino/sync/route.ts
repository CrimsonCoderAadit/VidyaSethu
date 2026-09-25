/**
 * Offline batch sync. Each decision carries the `version` (updatedAt) the officer saw when the
 * batch was downloaded. If the file moved on in the meantime (another officer acted, applicant
 * changed it) the decision is NOT applied; it comes back as a conflict to re-check online.
 */
import { requireRole } from "@/lib/auth";
import { mutateDb } from "@/lib/db";
import { applyInoDecision } from "@/lib/ino";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  batchId: z.string().max(40),
  decisions: z
    .array(
      z.object({
        id: z.string().max(40),
        version: z.string().max(40),
        admit: z.boolean(),
        note: z.string().min(1).max(1000),
        decidedAt: z.string().max(40),
      }),
    )
    .max(500),
});

export async function POST(req: Request) {
  const user = await requireRole(["INO"]);
  if (!user) return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid body" }, { status: 400 });
  const { batchId, decisions } = parsed.data;

  const results = await mutateDb((db) =>
    decisions.map((d) => {
      const app = db.applications.find((a) => a.id === d.id);
      if (!app) return { id: d.id, status: "conflict" as const, reason: "Application no longer exists." };
      if (app.status !== "INSTITUTION_VERIFICATION")
        return { id: d.id, status: "conflict" as const, reason: `Already moved to ${app.status.replaceAll("_", " ").toLowerCase()}.` };
      if (app.updatedAt !== d.version)
        return { id: d.id, status: "conflict" as const, reason: "File changed after your download. Re-check it online." };
      const actor = db.users.find((u) => u.id === user.id) ?? user;
      applyInoDecision(db, actor, app, d.admit, d.note, `verified offline ${d.decidedAt.slice(0, 16).replace("T", " ")}, synced in batch ${batchId}`);
      return { id: d.id, status: "applied" as const };
    }),
  );
  return Response.json({ results });
}
