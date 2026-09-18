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

export function SidebarNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(`${l.href}/`));
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
