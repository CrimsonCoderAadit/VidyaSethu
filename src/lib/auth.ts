import type { Role } from "@/engine/types";
import { cookies } from "next/headers";
import { loadDb } from "./db";
import type { UserRecord } from "./models";

const COOKIE = "mota_session";

export async function getSession(): Promise<UserRecord | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  return (await loadDb()).users.find((u) => u.id === id) ?? null;
}

export async function requireRole(roles?: Role[]) {
  const user = await getSession();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return user;
}

export { COOKIE };
