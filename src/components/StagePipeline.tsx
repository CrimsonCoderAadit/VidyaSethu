import { Check } from "lucide-react";

export function StagePipeline({
  stages,
  current,
  labels,
}: {
  stages: string[];
  current: string;
  labels?: Record<string, string>;
}) {
  const currentIndex = stages.indexOf(current);
  return (
    <ol className="flex flex-wrap items-stretch gap-0 overflow-x-auto">
      {stages.map((stage, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const active = i === currentIndex;
        const label = labels?.[stage] ?? stage.replaceAll("_", " ");
        return (
          <li key={stage} className="flex min-w-[9rem] flex-1 items-center">
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done ? "bg-[color:var(--ok)] text-white" : active ? "bg-[color:var(--primary)] text-white" : "border border-[color:var(--border)] text-[color:var(--muted)]",
                  ].join(" ")}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                {i < stages.length - 1 ? (
                  <span className={`h-px flex-1 ${done ? "bg-[color:var(--ok)]" : "bg-[color:var(--border)]"}`} />
                ) : null}
              </div>
              <p
                className={[
                  "pr-2 text-xs leading-tight capitalize",
                  active ? "font-semibold text-[color:var(--ink)]" : done ? "text-[color:var(--ink)]" : "text-[color:var(--muted)]",
                ].join(" ")}
              >
                {label.toLowerCase()}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
