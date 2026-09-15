export function BarRows({ rows, tone = "primary" }: { rows: { label: string; value: number }[]; tone?: "primary" | "danger" | "accent" }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const color = tone === "danger" ? "var(--danger)" : tone === "accent" ? "var(--accent)" : "var(--primary)";
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-[color:var(--muted)]">{r.label}</span>
          <div className="h-3 flex-1 rounded-full bg-[color:var(--surface-2)]">
            <div
              className="h-3 rounded-full"
              style={{ width: `${Math.max(3, (r.value / max) * 100)}%`, background: color }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-semibold">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
