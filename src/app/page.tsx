import { LoginForm } from "@/components/LoginForm";
import { resetDemoAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { APP_NAME, APP_TAGLINE, roleHome } from "@/lib/roles";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default async function LoginPage() {
  const session = await getSession();
  const users = loadDb().users;

  return (
    <div className="flex min-h-screen">
      <div
        className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden px-12 py-14 lg:flex"
        style={{ background: "linear-gradient(160deg, var(--indigo) 0%, var(--indigo-2) 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(224,138,30,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative flex items-center gap-2.5">
          <GraduationCap className="h-7 w-7 text-[color:var(--marigold)]" strokeWidth={1.75} />
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">{APP_NAME}</span>
        </div>
        <div className="relative">
          <p className="meta mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Ministry of Tribal Affairs</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-white">
            One platform. Five schemes.
            <br />
            Every decision on record.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            Evidence becomes a fact, a fact meets a published rule, and a named officer makes the call — every step
            traceable, for Pre-Matric through National Overseas Scholarship.
          </p>
        </div>
        <p className="relative meta" style={{ color: "rgba(255,255,255,0.4)" }}>{APP_TAGLINE}</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[color:var(--paper)] px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <GraduationCap className="h-9 w-9 text-[color:var(--indigo)]" strokeWidth={1.5} />
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{APP_TAGLINE}</p>
          </div>

          <p className="mb-6 hidden text-sm font-semibold text-[color:var(--muted)] lg:block">Sign in to your desk</p>

          <div className="card p-6 shadow-sm">
            {session ? (
              <div className="text-center">
                <p className="text-sm">Signed in as <span className="font-semibold">{session.name}</span>.</p>
                <Link href={roleHome(session.role)} className="btn-primary mt-4 inline-block px-4 py-2.5 text-sm font-semibold">
                  Go to dashboard
                </Link>
              </div>
            ) : (
              <LoginForm users={users} />
            )}
          </div>

          <form action={resetDemoAction} className="mt-4 text-center">
            <button className="text-xs text-[color:var(--muted)] underline-offset-2 hover:text-[color:var(--indigo)] hover:underline">
              Reset demo data
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
