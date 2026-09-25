"use client";

import { markNotificationsReadAction } from "@/lib/actions";
import type { NotificationRecord } from "@/lib/models";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NotificationBell({ notifications, tone = "light" }: { notifications: NotificationRecord[]; tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={async () => {
          const next = !open;
          setOpen(next);
          if (next && unread > 0) {
            await markNotificationsReadAction();
            router.refresh();
          }
        }}
        className={`relative flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-150 md:h-9 md:w-9 ${tone === "dark" ? "text-white/75" : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]"}`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--danger)] px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="dropdown-pop absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] text-[color:var(--ink)] origin-top-right rounded-lg border border-[color:var(--border)] bg-white p-2 shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-[color:var(--muted)]">No notifications.</p>
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {notifications.slice(0, 20).map((n) => (
                <li key={n.id} className="rounded-md p-2 text-sm transition-colors duration-150 hover:bg-[color:var(--surface-2)]">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-[color:var(--muted)]">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
