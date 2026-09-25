import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { revalidatePath } from "next/cache";
import path from "path";
import type { Database } from "./models";
import { seedDatabase } from "./seed";

const dir = process.env.VERCEL ? "/tmp/vidya-setu" : path.join(process.cwd(), "data");
const file = path.join(dir, "store.json");

function withDefaults(db: Database): Database {
  db.renewals ??= [];
  db.aiFeedback ??= [];
  db.policyStatus ??= {};
  for (const award of db.awards) {
    award.lifecycle ??= "AWARDED";
    award.milestones ??= [];
  }
  return db;
}

export function loadDb(): Database {
  if (!existsSync(file)) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const seeded = seedDatabase();
    writeFileSync(file, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  return withDefaults(JSON.parse(readFileSync(file, "utf8")) as Database);
}

export function saveDb(db: Database) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(db, null, 2));
}

export function mutateDb<T>(fn: (db: Database) => T): T {
  const db = loadDb();
  const result = fn(db);
  saveDb(db);
  // Server Actions don't auto-refresh the calling page's data unless a path
  // is explicitly revalidated. Every mutation touches shared state that other
  // desks read, so revalidate the whole app rather than track every route.
  try {
    revalidatePath("/", "layout");
  } catch {
    // no-op outside a request/action context (e.g. scripts)
  }
  return result;
}

export function resetDb() {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(seedDatabase(), null, 2));
}
