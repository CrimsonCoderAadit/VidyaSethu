"use client";

import { loginAction } from "@/lib/actions";
import type { UserRecord } from "@/lib/models";
import { ROLE_LABEL } from "@/lib/roles";
import { useMemo, useState } from "react";

export function LoginForm({ users }: { users: UserRecord[] }) {
  const roles = useMemo(() => {
    const seen = new Set<UserRecord["role"]>();
    return users.map((u) => u.role).filter((r) => (seen.has(r) ? false : seen.add(r)));
  }, [users]);

  const [role, setRole] = useState(roles[0]);
  const accounts = users.filter((u) => u.role === role);
  const [email, setEmail] = useState(accounts[0]?.email ?? "");

  function onRoleChange(next: UserRecord["role"]) {
    setRole(next);
    const first = users.find((u) => u.role === next);
    setEmail(first?.email ?? "");
  }

  return (
    <form action={loginAction} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="role">Desk / role</label>
        <select
          id="role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value as UserRecord["role"])}
          className="field-input bg-white"
        >
          {roles.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="email">Account</label>
        <select
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input bg-white"
        >
          {accounts.map((u) => (
            <option key={u.id} value={u.email}>{u.name} · {u.email}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" defaultValue="demo" className="field-input" />
        <p className="mt-1 text-xs text-[color:var(--muted)]">Every demo account uses the password <span className="meta">demo</span>.</p>
      </div>
      <button className="btn-primary w-full px-4 py-2.5 text-sm font-semibold">Sign in</button>
    </form>
  );
}
