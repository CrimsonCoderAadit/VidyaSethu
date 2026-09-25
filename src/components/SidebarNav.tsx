"use client";

import type { IconName, NavItem } from "@/lib/roles";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  BookOpenCheck,
  Building2,
  ClipboardList,
  FileSearch,
  Gavel,
  LayoutDashboard,
  RefreshCw,
  ScrollText,
  Search,
  Settings2,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  BookOpenCheck,
  Search,
  Building2,
  ClipboardList,
  Users,
  RefreshCw,
  ScrollText,
  Settings2,
  Gavel,
  Banknote,
  UserCog,
  ShieldCheck,
  FileSearch,
};

function isActive(pathname: string | null, href: string) {
  return pathname === href || (href !== "/" && !!pathname?.startsWith(`${href}/`));
}

export function SidebarNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        const Icon = ICONS[l.icon];
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`group relative flex items-center gap-3 rounded-md py-2.5 pl-4 pr-3 text-sm transition-colors duration-150 ${active ? "" : "hover:bg-white/5"}`}
            style={{ color: active ? "#fff" : "rgba(255,255,255,0.72)" }}
          >
            <AnimatePresence>
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-white/10"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
            </AnimatePresence>
            <span
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-all duration-150"
              style={{ background: active ? "var(--marigold)" : "transparent" }}
            />
            <Icon
              className="relative h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
              strokeWidth={1.75}
              style={{ color: active ? "var(--marigold)" : "rgba(255,255,255,0.55)" }}
            />
            <span className="relative transition-colors duration-150 group-hover:text-white">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone layout: a fixed bottom tab bar with thumb-sized (≥48px) targets instead of the sidebar. */
export function BottomNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname();
  if (links.length < 2) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[color:var(--line)] bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links.slice(0, 5).map((l) => {
        const active = isActive(pathname, l.href);
        const Icon = ICONS[l.icon];
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
            style={{ color: active ? "var(--indigo)" : "var(--muted)" }}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} style={active ? { color: "var(--marigold)" } : undefined} />
            {l.short}
          </Link>
        );
      })}
    </nav>
  );
}
