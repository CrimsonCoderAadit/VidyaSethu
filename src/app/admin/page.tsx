import { BarRows } from "@/components/BarChart";
import { Shell } from "@/components/Shell";
import { createUserAction, deleteUserAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@/engine/types";
import { redirect } from "next/navigation";

const ROLES: Role[] = ["APPLICANT", "INO", "STATE", "MOTA", "COMMITTEE", "FINANCE", "ADMIN", "AUDITOR"];

export default async function AdminPage() {
  const user = await requireRole(["ADMIN"]);
  if (!user) redirect("/");
  const users = loadDb().users;
  const byRole = new Map<string, number>();
  for (const u of users) byRole.set(ROLE_LABEL[u.role], (byRole.get(ROLE_LABEL[u.role]) ?? 0) + 1);

  return (
    <Shell user={user}>
      <p className="meta">System administration</p>
      <h1 className="font-[family-name:var(--font-display)] mb-1 text-3xl">Manage accounts</h1>
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--muted)]">
        This is the only function available to the administrator role. Every account created here signs in with the
        password <span className="meta">demo</span>.
      </p>

      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold">Accounts by desk</h2>
        <BarRows rows={[...byRole.entries()].map(([label, value]) => ({ label, value }))} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">All accounts ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-xs uppercase tracking-wide text-[color:var(--muted)]">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Scope</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[color:var(--border)] last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{u.name}</td>
                    <td className="py-2.5 pr-3 text-[color:var(--muted)]">{u.email}</td>
                    <td className="py-2.5 pr-3">{ROLE_LABEL[u.role]}</td>
                    <td className="py-2.5 pr-3 text-[color:var(--muted)]">{u.institutionId ?? u.stateCode ?? "—"}</td>
                    <td className="py-2.5 text-right">
                      {u.id !== user.id ? (
                        <form action={deleteUserAction.bind(null, u.id)}>
                          <button className="text-xs text-[color:var(--danger)] hover:underline">Remove</button>
                        </form>
                      ) : (
                        <span className="text-xs text-[color:var(--muted)]">you</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card h-fit p-5">
          <h2 className="mb-4 font-semibold">Create account</h2>
          <form action={createUserAction} className="space-y-3">
            <div>
              <label className="field-label" htmlFor="name">Full name</label>
              <input id="name" name="name" required className="field-input" placeholder="e.g. Rekha Toppo" />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="field-input" placeholder="name@mota.demo" />
            </div>
            <div>
              <label className="field-label" htmlFor="role">Role</label>
              <select id="role" name="role" required className="field-input bg-white">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="institutionId">Institution ID (INO only)</label>
              <input id="institutionId" name="institutionId" className="field-input" placeholder="e.g. IITD" />
            </div>
            <div>
              <label className="field-label" htmlFor="stateCode">State code (State desk only)</label>
              <input id="stateCode" name="stateCode" className="field-input" placeholder="e.g. JH" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input value="demo" disabled className="field-input bg-[color:var(--surface-2)] text-[color:var(--muted)]" />
            </div>
            <button className="btn-primary w-full px-4 py-2.5 text-sm font-semibold">Create account</button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
