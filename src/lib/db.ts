import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { revalidatePath } from "next/cache";
import path from "path";
import postgres from "postgres";
import type { Database } from "./models";
import { seedDatabase } from "./seed";

/**
 * Persistence with two interchangeable backends:
 *  - DATABASE_URL set → Postgres (Neon / Supabase / Vercel Postgres). The whole store is one
 *    JSONB document; every mutation runs in a transaction with SELECT … FOR UPDATE, so two
 *    desks acting at once can't overwrite each other, and data survives serverless cold starts.
 *  - otherwise → a local JSON file (dev, or a single long-running server).
 */

const DATABASE_URL = process.env.DATABASE_URL;
export const STORAGE = DATABASE_URL ? "postgres" : "file";

function withDefaults(db: Database): Database {
  db.renewals ??= [];
  db.aiFeedback ??= [];
  db.policyStatus ??= {};
  db.outbox ??= [];
  for (const award of db.awards) {
    award.lifecycle ??= "AWARDED";
    award.milestones ??= [];
  }
  return db;
}

function revalidate() {
  // Server Actions don't auto-refresh the calling page's data unless a path
  // is explicitly revalidated. Every mutation touches shared state that other
  // desks read, so revalidate the whole app rather than track every route.
  try {
    revalidatePath("/", "layout");
  } catch {
    // no-op outside a request/action context (e.g. scripts)
  }
}

// ---------- Postgres backend ----------

const globalForSql = globalThis as unknown as { vsSql?: postgres.Sql; vsReady?: Promise<void> };

function sql(): postgres.Sql {
  // prepare:false keeps it compatible with transaction-mode poolers (Supabase, Neon pooler).
  globalForSql.vsSql ??= postgres(DATABASE_URL!, { max: 3, prepare: false, idle_timeout: 20, onnotice: () => {} });
  return globalForSql.vsSql;
}

function ready(): Promise<void> {
  globalForSql.vsReady ??= (async () => {
    const q = sql();
    await q`create table if not exists vs_store (id int primary key, doc jsonb not null, updated_at timestamptz not null default now())`;
    await q`insert into vs_store (id, doc) values (1, ${q.json(JSON.parse(JSON.stringify(seedDatabase())))}) on conflict (id) do nothing`;
  })().catch((e) => {
    globalForSql.vsReady = undefined;
    throw e;
  });
  return globalForSql.vsReady;
}

// ---------- File backend ----------

const dir = process.env.VERCEL ? "/tmp/vidya-setu" : path.join(process.cwd(), "data");
const file = path.join(dir, "store.json");

function loadFile(): Database {
  if (!existsSync(file)) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const seeded = seedDatabase();
    writeFileSync(file, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  return withDefaults(JSON.parse(readFileSync(file, "utf8")) as Database);
}

function saveFile(db: Database) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(db, null, 2));
}

// ---------- Public API ----------

export async function loadDb(): Promise<Database> {
  if (!DATABASE_URL) return loadFile();
  await ready();
  const [row] = await sql()`select doc from vs_store where id = 1`;
  return withDefaults(row.doc as Database);
}

export async function mutateDb<T>(fn: (db: Database) => T): Promise<T> {
  let result: T;
  if (!DATABASE_URL) {
    const db = loadFile();
    result = fn(db);
    saveFile(db);
  } else {
    await ready();
    result = (await sql().begin(async (tx) => {
      const [row] = await tx`select doc from vs_store where id = 1 for update`;
      const db = withDefaults(row.doc as Database);
      const out = fn(db);
      await tx`update vs_store set doc = ${tx.json(JSON.parse(JSON.stringify(db)))}, updated_at = now() where id = 1`;
      return [out];
    }))[0] as T;
  }
  revalidate();
  return result;
}

export async function resetDb() {
  const seeded = seedDatabase();
  if (!DATABASE_URL) {
    saveFile(seeded);
  } else {
    await ready();
    await sql()`update vs_store set doc = ${sql().json(JSON.parse(JSON.stringify(seeded)))}, updated_at = now() where id = 1`;
  }
  revalidate();
}
