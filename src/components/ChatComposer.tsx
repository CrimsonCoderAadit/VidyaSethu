"use client";

import { botSendAction } from "@/lib/actions";
import { SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";

export function ChatComposer({ channel, suggestions }: { channel: "WHATSAPP" | "SMS"; suggestions: string[] }) {
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const send = async (fd: FormData) => {
    setPending(true);
    await botSendAction(channel, fd);
    form.current?.reset();
    setPending(false);
  };
  return (
    <div className="border-t border-black/10 bg-[#f0f2f5] p-2">
      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="shrink-0 rounded-full border border-[#25d366]/40 bg-white px-3 py-1 text-xs text-[#075e54]"
            style={{ minHeight: 32 }}
            onClick={() => {
              if (input.current) input.current.value = s;
              form.current?.requestSubmit();
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <form ref={form} action={send} className="flex items-center gap-2">
        <input
          ref={input}
          name="text"
          autoComplete="off"
          placeholder={channel === "SMS" ? "Text message" : "Message"}
          className="min-w-0 flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-[15px] outline-none"
        />
        <button
          disabled={pending}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-60"
          style={{ background: channel === "SMS" ? "var(--indigo)" : "#00a884" }}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
