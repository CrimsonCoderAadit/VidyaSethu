"use client";

import { CloudDownload, CloudUpload, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type BatchApp = {
  id: string;
  version: string;
  scheme: string;
  applicantName: string;
  institutionName: string;
  facts: { label: string; value: string }[];
  documents: string[];
};
type Batch = { batchId: string; downloadedAt: string; officer: string; apps: BatchApp[] };
type Decision = { id: string; version: string; admit: boolean; note: string; decidedAt: string };
type SyncResult = { id: string; status: "applied" | "conflict"; reason?: string };

const BATCH_KEY = "vs-ino-batch";
const QUEUE_KEY = "vs-ino-queue";

// Storage can be unavailable (private mode, blocked site data): the page still works in memory.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* in-memory only */
  }
}

export function OfflineBatch() {
  const [online, setOnline] = useState(true);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [queue, setQueue] = useState<Decision[]>([]);
  const [busy, setBusy] = useState<"download" | "sync" | null>(null);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBatch(read<Batch | null>(BATCH_KEY, null));
    setQueue(read<Decision[]>(QUEUE_KEY, []));
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const download = async () => {
    setBusy("download");
    setError(null);
    try {
      const res = await fetch("/api/ino/batch", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const next: Batch = await res.json();
      setBatch(next);
      write(BATCH_KEY, next);
      setResults(null);
    } catch {
      setError("Could not download. Check the connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const sync = useCallback(async () => {
    if (!batch || queue.length === 0) return;
    setBusy("sync");
    setError(null);
    try {
      const res = await fetch("/api/ino/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batch.batchId, decisions: queue }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { results: r }: { results: SyncResult[] } = await res.json();
      setResults(r);
      setQueue([]);
      write(QUEUE_KEY, []);
      const done = new Set(r.map((x) => x.id));
      const remaining = { ...batch, apps: batch.apps.filter((a) => !done.has(a.id)) };
      setBatch(remaining.apps.length ? remaining : null);
      write(BATCH_KEY, remaining.apps.length ? remaining : null);
    } catch {
      setError("Sync failed. Your decisions are still saved on this device.");
    } finally {
      setBusy(null);
    }
  }, [batch, queue]);

  // Auto-sync as soon as the connection comes back.
  useEffect(() => {
    if (online && queue.length && !busy) void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const decide = (app: BatchApp, admit: boolean, note: string) => {
    const next = [...queue.filter((d) => d.id !== app.id), { id: app.id, version: app.version, admit, note, decidedAt: new Date().toISOString() }];
    setQueue(next);
    write(QUEUE_KEY, next);
  };
  const undo = (id: string) => {
    const next = queue.filter((d) => d.id !== id);
    setQueue(next);
    write(QUEUE_KEY, next);
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: online ? "var(--ok)" : "var(--warn)" }}>
          {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          {online ? "Online" : "Offline: decisions are saved on this device"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={download} disabled={!online || busy !== null} className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold disabled:opacity-50">
            <CloudDownload className="h-4 w-4" /> {busy === "download" ? "Downloading…" : batch ? "Refresh batch" : "Download batch"}
          </button>
          <button onClick={sync} disabled={!online || queue.length === 0 || busy !== null} className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold disabled:opacity-50">
            <CloudUpload className="h-4 w-4" /> {busy === "sync" ? "Syncing…" : `Sync ${queue.length} decision${queue.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      {error ? <p className="card card-accent-warn p-3 text-sm">{error}</p> : null}

      {results ? (
        <section className="card p-4 text-sm">
          <h2 className="font-semibold">Last sync</h2>
          <ul className="mt-2 space-y-1">
            {results.map((r) => (
              <li key={r.id}>
                <span className="meta">{r.id}</span> ·{" "}
                {r.status === "applied" ? (
                  <span style={{ color: "var(--ok)" }}>applied</span>
                ) : (
                  <span style={{ color: "var(--danger)" }}>conflict: {r.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {batch ? (
        <p className="meta">
          Batch {batch.batchId} · downloaded {new Date(batch.downloadedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
          {batch.apps.length} file{batch.apps.length === 1 ? "" : "s"}
        </p>
      ) : (
        <p className="card p-5 text-sm text-[color:var(--muted)]">
          No batch on this device. Download one while you have signal. You can then verify every file with no network and sync
          when you are back in coverage.
        </p>
      )}

      {batch?.apps.map((app) => {
        const decided = queue.find((d) => d.id === app.id);
        return (
          <article key={app.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{app.applicantName}</h2>
                <p className="meta">{app.id} · {app.scheme}</p>
              </div>
              {decided ? (
                <span className="stamp" style={{ color: decided.admit ? "var(--ok)" : "var(--warn)" }}>
                  {decided.admit ? "Verified · pending sync" : "Flagged · pending sync"}
                </span>
              ) : null}
            </div>
            {app.institutionName ? <p className="mt-1 text-sm">{app.institutionName}</p> : null}
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {app.facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-2 border-b border-[color:var(--line)] py-1">
                  <dt className="text-[color:var(--muted)]">{f.label}</dt>
                  <dd className="text-right font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="meta mt-2">Documents: {app.documents.join(" · ") || "none"}</p>
            {decided ? (
              <button onClick={() => undo(app.id)} className="btn-outline mt-3 px-3 py-2 text-xs font-semibold">
                Undo
              </button>
            ) : (
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const admit = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "admit";
                  const note = String(fd.get("note") || "").trim();
                  decide(app, admit, note || (admit ? "Admission, programme and registration confirmed." : "Details could not be confirmed."));
                }}
              >
                <input name="note" placeholder="Note (optional for verify, needed to flag)" className="field-input flex-1" />
                <div className="flex gap-2">
                  <button name="action" value="admit" className="btn-primary flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]">
                    Verify
                  </button>
                  <button name="action" value="flag" className="btn-outline flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--accent)]">
                    Flag
                  </button>
                </div>
              </form>
            )}
          </article>
        );
      })}
    </div>
  );
}
