"use client";

import { LogOut } from "lucide-react";

/** Phones in tribal areas are often shared. Signing out wipes the offline page cache
 * so the next person can't open the previous applicant's pages without a network. */
export function SignOutButton({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <button
      className={className}
      aria-label="Sign out"
      onClick={() => {
        try {
          localStorage.removeItem("vs-ino-batch");
          localStorage.removeItem("vs-ino-queue");
        } catch {
          /* storage unavailable */
        }
        if ("caches" in window) {
          caches.keys().then((keys) => keys.filter((k) => k.endsWith("-pages")).forEach((k) => caches.delete(k)));
        }
      }}
    >
      <LogOut className={iconOnly ? "h-5 w-5" : "h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"} strokeWidth={1.75} />
      {iconOnly ? null : "Sign out"}
    </button>
  );
}
