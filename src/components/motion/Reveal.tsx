"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

/** Fades + lifts children in on mount. Pass `index` to stagger a grid/list of these. */
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
    <motion.div
      className={className}
      custom={index}
      initial="hidden"
      animate="show"
      variants={variants}
    >
      {children}
    </motion.div>
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
    <motion.li
      className={className}
      custom={index}
      initial="hidden"
      animate="show"
      variants={variants}
      style={{ listStyle: "none" }}
    >
      {children}
    </motion.li>
  );
}
