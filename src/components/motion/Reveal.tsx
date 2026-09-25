import type { ReactNode } from "react";

/** Fades + lifts children in on mount. Pass `index` to stagger a grid/list of these.
 * Pure CSS (see `.reveal` in globals.css) so server-rendered content is visible and
 * animates before any JavaScript arrives — on a 3G phone the JS can take seconds. */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <div className={`reveal ${className ?? ""}`} style={{ animationDelay: `${index * 60}ms` }}>
      {children}
    </div>
  );
}

/** Same effect, but as a wrapping list item — use inside `.map()` over table/list rows. */
export function RevealItem({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <li className={`reveal ${className ?? ""}`} style={{ animationDelay: `${index * 60}ms`, listStyle: "none" }}>
      {children}
    </li>
  );
}
