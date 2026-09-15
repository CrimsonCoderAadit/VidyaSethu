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
  | "FileSearch";

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

export type NavItem = { href: string; label: string; icon: IconName };

export const ROLE_NAV: Record<Role, NavItem[]> = {
  APPLICANT: [
    { href: "/applicant", label: "My applications", icon: "LayoutDashboard" },
    { href: "/applicant/schemes", label: "Apply for a scheme", icon: "BookOpenCheck" },
    { href: "/applicant/precheck", label: "Eligibility pre-check", icon: "Search" },
  ],
  INO: [{ href: "/ino", label: "Institution verification", icon: "Building2" }],
  STATE: [{ href: "/state", label: "State / UT queue", icon: "ClipboardList" }],
  MOTA: [
    { href: "/officer", label: "Review queue", icon: "LayoutDashboard" },
    { href: "/officer/selection", label: "Selection runs", icon: "Users" },
    { href: "/officer/renewals", label: "Renewals", icon: "RefreshCw" },
    { href: "/policy", label: "Policy studio", icon: "ScrollText" },
    { href: "/tower", label: "Control tower", icon: "Settings2" },
  ],
  COMMITTEE: [{ href: "/committee", label: "NOS dossiers", icon: "Gavel" }],
  FINANCE: [{ href: "/finance", label: "Sanctions & payments", icon: "Banknote" }],
  ADMIN: [{ href: "/admin", label: "Manage accounts", icon: "UserCog" }],
  AUDITOR: [
    { href: "/auditor", label: "Audit trail", icon: "ShieldCheck" },
    { href: "/auditor/evidence", label: "Evidence vault", icon: "FileSearch" },
    { href: "/tower", label: "Control tower", icon: "Settings2" },
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
