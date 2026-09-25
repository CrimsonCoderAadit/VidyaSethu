"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type NetworkInformation = {
  saveData?: boolean; effectiveType?: string; addEventListener?: (t: string, cb: () => void) => void;
  removeEventListener?: (t: string, cb: () => void) => void;
};

/** Lite mode = the device or network can't afford the decorative layer: Data Saver on,
 * a 2G/3G effective connection, a phone-width screen, or reduced-motion preference.
 * In lite mode we skip the WebGL hero, ambient orbs and framer-motion animations. */
function detectLite(): boolean {
  if (typeof window === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && ["slow-2g", "2g", "3g"].includes(conn.effectiveType)) return true;
  if (window.matchMedia("(max-width: 767px)").matches) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** null until detected on the client, so nothing heavy starts loading before we know. */
const LiteContext = createContext<boolean | null>(null);
export const useLiteMode = () => useContext(LiteContext);

export function LiteModeProvider({ children }: { children: ReactNode }) {
  const [lite, setLite] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => {
      const next = detectLite();
      setLite(next);
      document.documentElement.toggleAttribute("data-lite", next);
    };
    update();
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    conn?.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    return () => {
      conn?.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    // Dev (turbopack HMR) and a caching service worker don't mix; register only in production builds.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <LiteContext.Provider value={lite}>
      <MotionConfig reducedMotion={lite === false ? "user" : "always"}>{children}</MotionConfig>
    </LiteContext.Provider>
  );
}
