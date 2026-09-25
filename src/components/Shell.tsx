import { logoutAction } from "@/lib/actions";
import { loadDb } from "@/lib/db";
import type { UserRecord } from "@/lib/models";
import { APP_NAME, ROLE_HINT, ROLE_LABEL, ROLE_NAV } from "@/lib/roles";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "./motion/PageTransition";
import { NotificationBell } from "./NotificationBell";
import { BottomNav, SidebarNav } from "./SidebarNav";
import { SignOutButton } from "./SignOutButton";

export function Shell({ user, children }: { user: UserRecord; children: React.ReactNode }) {
  const links = ROLE_NAV[user.role] ?? [];
  const notifications = loadDb().notifications.filter((n) => n.userId === user.id);
  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden w-64 shrink-0 flex-col md:flex"
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
            <SignOutButton className="group flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-white/55 transition-colors hover:text-[color:var(--marigold)]" />
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {/* Phone header: brand + bell + sign-out; the sidebar is replaced by BottomNav. */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-2.5 md:hidden"
          style={{ background: "var(--indigo)", paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
        >
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <GraduationCap className="h-5 w-5 shrink-0 text-[color:var(--marigold)]" strokeWidth={1.75} />
            <span className="truncate font-[family-name:var(--font-display)] text-base font-semibold text-white">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-1 text-white">
            <NotificationBell notifications={notifications} tone="dark" />
            <form action={logoutAction}>
              <SignOutButton iconOnly className="flex h-11 w-11 items-center justify-center rounded-md text-white/75" />
            </form>
          </div>
        </header>
        <header className="relative z-10 hidden items-center justify-between border-b border-[color:var(--line)] bg-white px-8 py-4 md:flex">
          <p className="text-sm text-[color:var(--muted)]">{ROLE_HINT[user.role]}</p>
          <NotificationBell notifications={notifications} />
        </header>
        <div className="relative overflow-hidden">
          <div className="ambient pointer-events-none absolute inset-0 overflow-hidden">
            <div className="content-orb content-orb-a" />
            <div className="content-orb content-orb-b" />
            <div className="content-grid absolute inset-0" />
          </div>
          <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-5 md:px-8 md:py-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
      <BottomNav links={links} />
    </div>
  );
}

// Re-exported so existing `import { Shell, Stamp } from "@/components/Shell"` call
// sites keep working. Stamp itself lives in its own module (no server imports)
// so client components can import it without pulling in Shell's loadDb() usage.
export { Stamp } from "./Stamp";
