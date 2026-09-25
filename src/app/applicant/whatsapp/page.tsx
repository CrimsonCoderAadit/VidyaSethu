import { ChatComposer } from "@/components/ChatComposer";
import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { BOT_NUMBER } from "@/lib/bot";
import { loadDb } from "@/lib/db";
import { getT } from "@/lib/lang";
import { MessageCircle, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function WhatsAppPage({ searchParams }: { searchParams: Promise<{ ch?: string }> }) {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  const { t } = await getT();
  const channel = (await searchParams).ch === "sms" ? "SMS" : "WHATSAPP";
  const db = (await loadDb());
  const firstApp = db.applications.find((a) => a.applicantId === user.id);
  const thread = db.outbox.filter((m) => m.userId === user.id && m.channel === channel).slice(0, 40).reverse();
  const wa = channel === "WHATSAPP";

  return (
    <Shell user={user}>
      <p className="meta">{t("WhatsApp / SMS")}</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">{t("Get status on WhatsApp or SMS")}</h1>
      <p className="mb-5 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        {t("No need to log in to check. Send your application ID to the Vidya Setu number. Alerts come automatically when an officer flags a document.")}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[1.75rem] border-[6px] border-[#1c1c1c] bg-[#1c1c1c] shadow-xl">
          <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: wa ? "#075e54" : "var(--indigo)" }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">VS</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">Vidya Setu · MoTA</span>
              <span className="block text-xs text-white/70">{BOT_NUMBER} · {wa ? "WhatsApp" : "SMS"}</span>
            </span>
          </div>
          <div role="log" aria-label="Conversation" tabIndex={0} className="flex h-[440px] flex-col gap-2 overflow-y-auto p-3" style={{ background: wa ? "#efeae2" : "#f4f5f7" }}>
            {thread.length === 0 ? (
              <p className="m-auto max-w-[80%] rounded-lg bg-white/80 p-3 text-center text-xs text-[color:var(--muted)]">
                Send HI to start. Alerts from officers will also appear here.
              </p>
            ) : null}
            {thread.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-[14px] leading-snug shadow-sm ${m.direction === "IN" ? "self-end" : "self-start bg-white"}`}
                style={m.direction === "IN" ? { background: wa ? "#d9fdd3" : "#dbe7f5" } : undefined}
              >
                {m.body}
                <span className="mt-1 block text-right text-[10px] text-black/65">
                  {new Date(m.at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  {m.direction === "OUT" && m.body.startsWith("🔔") ? " · alert" : ""}
                </span>
              </div>
            ))}
          </div>
          <ChatComposer channel={channel} suggestions={["HI", "STATUS", ...(firstApp ? [firstApp.id, `DOCS ${firstApp.id}`] : []), "LANG HI", "LANG OR", "LANG EN"]} />
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Link href="/applicant/whatsapp" className={wa ? "btn-primary px-4 py-2 text-sm font-semibold" : "btn-outline px-4 py-2 text-sm font-semibold"}>
              <MessageCircle className="mr-1.5 inline h-4 w-4" /> WhatsApp
            </Link>
            <Link href="/applicant/whatsapp?ch=sms" className={!wa ? "btn-primary px-4 py-2 text-sm font-semibold" : "btn-outline px-4 py-2 text-sm font-semibold"}>
              <MessageSquareText className="mr-1.5 inline h-4 w-4" /> SMS
            </Link>
          </div>
          <section className="card p-5 text-sm">
            <h2 className="font-semibold">How it works</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[color:var(--muted)]">
              <li>The sender&apos;s registered mobile ({user.mobile ?? "not set"}) is the identity. Status is only disclosed to the mobile that owns the application.</li>
              <li>Every alert an officer triggers (deficiency, institution flag, award, payment) is also pushed here, in the applicant&apos;s chosen language.</li>
              <li>SMS fallback for feature phones: one 160-character segment in English, or 2 Unicode segments for Hindi and Odia.</li>
              <li>
                The same code path runs the real webhook at <code className="meta">/api/whatsapp</code>. It supports the Meta WhatsApp Cloud API (signed),
                Twilio WhatsApp/SMS, and generic SMS gateways.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </Shell>
  );
}
