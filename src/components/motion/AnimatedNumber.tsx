"use client";

import { useEffect, useRef, useState } from "react";
import { useLiteMode } from "../LiteMode";

/** Counts up from 0 to `value` once, on mount. Purely cosmetic — never the source of truth.
 * Server HTML carries the real value, and lite mode (phones / slow networks) never animates. */
export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | null>(null);

  const lite = useLiteMode();

  useEffect(() => {
    if (lite !== false) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 700 + Math.min(value, 200) * 2;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, lite]);

  return (
    <span>
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
