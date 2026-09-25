"use client";

import { setLanguageAction } from "@/lib/actions";
import { LANGS, type Lang } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { useRef } from "react";

/** Native-script language picker; submits on change so it works as a plain form too. */
export function LanguageSwitcher({ lang, tone = "light" }: { lang: Lang; tone?: "light" | "dark" }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setLanguageAction} className="flex items-center gap-1">
      <Languages className={`h-4 w-4 ${tone === "dark" ? "text-white/75" : "text-[color:var(--muted)]"}`} strokeWidth={1.75} aria-hidden />
      <select
        name="lang"
        aria-label="Language"
        defaultValue={lang}
        onChange={() => form.current?.requestSubmit()}
        className={`rounded-md border-0 bg-transparent py-1 pr-1 text-sm font-medium ${tone === "dark" ? "text-white [&>option]:text-[color:var(--ink)]" : "text-[color:var(--ink)]"}`}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
      <noscript>
        <button className="text-xs underline">OK</button>
      </noscript>
    </form>
  );
}
