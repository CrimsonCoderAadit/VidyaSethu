import { LoginForm } from "@/components/LoginForm";
import { Reveal } from "@/components/motion/Reveal";
import { HeroSceneClient } from "@/components/three/HeroSceneClient";
import { resetDemoAction } from "@/lib/actions";
import { loadDb } from "@/lib/db";
import { APP_NAME, APP_TAGLINE } from "@/lib/roles";
import { GraduationCap } from "lucide-react";

export default async function LoginPage() {
  const users = loadDb().users;

  return (
    <div className="flex min-h-screen">
      <div
        className="relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden px-12 py-14 lg:flex"
        style={{ background: "linear-gradient(160deg, var(--indigo) 0%, var(--indigo-2) 100%)" }}
      >
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />
        <div
          className="aurora-a pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(224,138,30,0.22) 0%, transparent 70%)" }}
        />
        <div
          className="aurora-b pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }}
        />
        <div className="pointer-events-none absolute inset-0">
          <HeroSceneClient />
        </div>

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
            Runs Pre-Matric, Post-Matric, Top Class, NFST and NOS on one system, with every officer decision backed
            by evidence and open to audit.
          </p>
        </div>

        <p className="relative meta" style={{ color: "rgba(255,255,255,0.4)" }}>{APP_TAGLINE}</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[color:var(--paper)] px-4 py-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="content-orb content-orb-a" />
          <div className="content-orb content-orb-b" />
          <div className="content-grid absolute inset-0" />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <GraduationCap className="h-9 w-9 text-[color:var(--indigo)]" strokeWidth={1.5} />
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">{APP_TAGLINE}</p>
          </div>

          <p className="mb-6 hidden text-sm font-semibold text-[color:var(--muted)] lg:block">Sign in to your desk</p>

          <Reveal>
            <div className="card p-6 shadow-sm">
              <LoginForm users={users} />
            </div>
          </Reveal>

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
