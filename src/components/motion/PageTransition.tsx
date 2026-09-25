"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Every navigation mounts a fresh page tree in the app router, so keying on
 * the path is enough to replay this CSS fade-and-lift on every route change.
 * CSS rather than framer-motion so the first paint never waits on hydration. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
