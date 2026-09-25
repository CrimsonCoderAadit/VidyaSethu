"use client";

import type { Lang } from "@/lib/i18n";
import { Mic, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

/** BCP-47 voices for Indian English, Hindi and Odia (Android Chrome ships all three). */
const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", or: "or-IN" };

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  onerror: () => void;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Hooks rendered only after mount so server HTML never shows a button the device can't use. */
function useSupported(check: () => boolean) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(check()), [check]);
  return ok;
}
const canListen = () => recognitionCtor() !== null;
const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Mic button that dictates into the input with the given name. Digits-only for number/phone fields. */
export function VoiceInput({ targetName, lang, digitsOnly = false }: { targetName: string; lang: Lang; digitsOnly?: boolean }) {
  const supported = useSupported(canListen);
  const [listening, setListening] = useState(false);
  if (!supported) return null;
  return (
    <button
      type="button"
      aria-label={listening ? "Listening" : "Speak your answer"}
      title="Speak your answer"
      onClick={(e) => {
        const Ctor = recognitionCtor();
        const input = e.currentTarget.closest("label")?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${targetName}"]`);
        if (!Ctor || !input) return;
        const rec = new Ctor();
        rec.lang = LOCALE[lang];
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (ev) => {
          const text = ev.results[0][0].transcript.trim();
          input.value = digitsOnly ? text.replace(/\D/g, "") : text;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        setListening(true);
        rec.start();
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[color:var(--line)] bg-white"
      style={{ color: listening ? "var(--danger)" : "var(--indigo)" }}
    >
      <Mic className={`h-5 w-5 ${listening ? "animate-pulse" : ""}`} />
    </button>
  );
}

/** Reads text aloud in the chosen language. For applicants who find long text hard to read. */
export function ReadAloud({ text, lang, label = "Listen" }: { text: string; lang: Lang; label?: string }) {
  const supported = useSupported(canSpeak);
  const [speaking, setSpeaking] = useState(false);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const synth = window.speechSynthesis;
        if (speaking) {
          synth.cancel();
          setSpeaking(false);
          return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = LOCALE[lang];
        u.rate = 0.9;
        const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(LOCALE[lang].toLowerCase().slice(0, 2)));
        if (voice) u.voice = voice;
        u.onend = () => setSpeaking(false);
        setSpeaking(true);
        synth.speak(u);
      }}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-medium text-[color:var(--indigo)]"
      aria-pressed={speaking}
    >
      <Volume2 className="h-4 w-4" /> {speaking ? "Stop" : label}
    </button>
  );
}
