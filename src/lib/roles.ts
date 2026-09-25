import type { Role } from "@/engine/types";
import type { Database } from "./models";

// Icon components (from lucide-react) can't cross the Server->Client prop
// boundary — only a serializable name can. SidebarNav (a Client Component)
// keeps the matching name->component lookup.
export type IconName =
  | "LayoutDashboard"
  | "BookOpenCheck"
  | "Search"
  | "Building2"
  | "ClipboardList"
  | "Users"
  | "RefreshCw"
  | "ScrollText"
  | "Settings2"
  | "Gavel"
  | "Banknote"
  | "UserCog"
  | "ShieldCheck"
  | "FileSearch"
  | "MessageCircle"
  | "WifiOff";

export const APP_NAME = "Vidya Setu";
export const APP_TAGLINE = "MoTA Scholarship & Fellowship Portal";

export const ROLE_LABEL: Record<Role, string> = {
  APPLICANT: "Applicant",
  INO: "Institution Nodal Officer",
  STATE: "State / UT Nodal Officer",
  MOTA: "MoTA Verification Officer",
  COMMITTEE: "Selection Committee",
  FINANCE: "Finance Officer",
  ADMIN: "System Administrator",
  AUDITOR: "Auditor",
};

export const ROLE_HOME: Record<Role, string> = {
  APPLICANT: "/applicant",
  INO: "/ino",
  STATE: "/state",
  MOTA: "/officer",
  COMMITTEE: "/committee",
  FINANCE: "/finance",
  ADMIN: "/admin",
  AUDITOR: "/auditor",
};

/** `short` is the label under the icon in the phone bottom tab bar. */
export type NavItem = { href: string; label: string; short: string; icon: IconName };

export const ROLE_NAV: Record<Role, NavItem[]> = {
  APPLICANT: [
    { href: "/applicant", label: "My applications", short: "Home", icon: "LayoutDashboard" },
    { href: "/applicant/schemes", label: "Apply for a scheme", short: "Apply", icon: "BookOpenCheck" },
    { href: "/applicant/precheck", label: "Eligibility pre-check", short: "Check", icon: "Search" },
    { href: "/applicant/whatsapp", label: "WhatsApp / SMS", short: "Chat", icon: "MessageCircle" },
  ],
  INO: [
    { href: "/ino", label: "Institution verification", short: "Verify", icon: "Building2" },
    { href: "/ino/offline", label: "Offline batch", short: "Offline", icon: "WifiOff" },
  ],
  STATE: [{ href: "/state", label: "State / UT queue", short: "Queue", icon: "ClipboardList" }],
  MOTA: [
    { href: "/officer", label: "Review queue", short: "Queue", icon: "LayoutDashboard" },
    { href: "/officer/selection", label: "Selection runs", short: "Selection", icon: "Users" },
    { href: "/officer/renewals", label: "Renewals", short: "Renewals", icon: "RefreshCw" },
    { href: "/policy", label: "Policy studio", short: "Policy", icon: "ScrollText" },
    { href: "/tower", label: "Control tower", short: "Tower", icon: "Settings2" },
  ],
  COMMITTEE: [{ href: "/committee", label: "NOS dossiers", short: "Dossiers", icon: "Gavel" }],
  FINANCE: [{ href: "/finance", label: "Sanctions & payments", short: "Payments", icon: "Banknote" }],
  ADMIN: [{ href: "/admin", label: "Manage accounts", short: "Accounts", icon: "UserCog" }],
  AUDITOR: [
    { href: "/auditor", label: "Audit trail", short: "Audit", icon: "ShieldCheck" },
    { href: "/auditor/evidence", label: "Evidence vault", short: "Evidence", icon: "FileSearch" },
    { href: "/tower", label: "Control tower", short: "Tower", icon: "Settings2" },
  ],
};

export const ROLE_HINT: Record<Role, string> = {
  APPLICANT: "Track your applications, resolve deficiencies, and file new scheme applications.",
  INO: "Confirm admission and institution details for applications routed to your institution.",
  STATE: "Verify and recommend Pre-Matric / Post-Matric applications from your State/UT.",
  MOTA: "Review the queue, confirm eligibility, and record the authorised decision.",
  COMMITTEE: "Score NOS dossiers the engine has already verified as eligible.",
  FINANCE: "Track sanction and payment status for awarded applications.",
  ADMIN: "Create and manage the accounts every other desk signs in with.",
  AUDITOR: "Read-only visibility into every decision, actor, and rule version.",
};

export function roleHome(role: Role) {
  return ROLE_HOME[role] ?? "/";
}

export function roleContact(users: Database["users"], role: Role) {
  return users.find((u) => u.role === role)?.email ?? null;
}
