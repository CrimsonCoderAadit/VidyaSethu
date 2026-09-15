import { logoutAction } from "@/lib/actions";
import { loadDb } from "@/lib/db";
import type { UserRecord } from "@/lib/models";
import { APP_NAME, ROLE_HINT, ROLE_LABEL, ROLE_NAV } from "@/lib/roles";
import { GraduationCap, LogOut } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { SidebarNav } from "./SidebarNav";

export function Shell({ user, children }: { user: UserRecord; children: React.ReactNode }) {
  const links = ROLE_NAV[user.role] ?? [];
  const notifications = loadDb().notifications.filter((n) => n.userId === user.id);
  return (
    <div className="flex min-h-screen">
      <aside
        className="flex w-64 shrink-0 flex-col"
        style={{ background: "linear-gradient(180deg, var(--indigo) 0%, var(--indigo-2) 100%)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5 transition-opacity hover:opacity-85">
          <GraduationCap className="h-6 w-6 text-[color:var(--marigold)]" strokeWidth={1.75} />
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white">{APP_NAME}</span>
        </Link>
        <SidebarNav links={links} />
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          <p className="meta" style={{ color: "rgba(255,255,255,0.55)" }}>{ROLE_LABEL[user.role]}</p>
          <form action={logoutAction} className="mt-3">
            <button className="group flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-white/55 transition-colors hover:text-[color:var(--marigold)]">
              <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[color:var(--line)] bg-white px-8 py-4">
          <p className="text-sm text-[color:var(--muted)]">{ROLE_HINT[user.role]}</p>
          <NotificationBell notifications={notifications} />
        </header>
        <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

// Re-exported so existing `import { Shell, Stamp } from "@/components/Shell"` call
// sites keep working. Stamp itself lives in its own module (no server imports)
// so client components can import it without pulling in Shell's loadDb() usage.
export { Stamp } from "./Stamp";
