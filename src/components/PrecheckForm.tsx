"use client";

import { EligibilityPanel } from "@/components/EligibilityPanel";
import { evaluateEligibility } from "@/engine/eligibility";
import type { Fact } from "@/engine/types";
import { humanizeSelectionModel } from "@/lib/format";
import type { SchemeConfig } from "@/engine/types";
import { useMemo, useState } from "react";

export function PrecheckForm({ schemes }: { schemes: SchemeConfig[] }) {
  const [code, setCode] = useState(schemes[0]?.code ?? "NFST");
  const scheme = schemes.find((s) => s.code === code) ?? schemes[0];
  const [values, setValues] = useState<Record<string, string>>({});

  const result = useMemo(() => {
    if (!scheme) return null;
    const facts: Fact[] = scheme.applicationSchema.map((field) => {
      const raw = values[field.id];
      let value: Fact["value"] = raw ?? null;
      if (field.type === "boolean") value = raw === "true";
      if ((field.type === "number" || field.type === "currency") && raw) value = Number(raw);
      return { field: field.id, value, source: "APPLICANT", confidence: 1, verified: false };
    });
    return evaluateEligibility(scheme, facts);
  }, [scheme, values]);

  if (!scheme) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="card space-y-3 p-5" onSubmit={(e) => e.preventDefault()}>
        <label className="block text-sm font-semibold">
          Scheme version
          <select
            className="field-input mt-1"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setValues({});
            }}
          >
            {schemes.map((s) => (
              <option key={s.code} value={s.code}>
                {s.shortName} · {humanizeSelectionModel(s.selectionModel.type)}
              </option>
            ))}
          </select>
        </label>
        <p className="meta">{scheme.selectionCharacter}</p>
        {scheme.applicationSchema.slice(0, 12).map((field) => (
          <label key={field.id} className="block text-sm">
            {field.label}
            {field.type === "boolean" || field.type === "select" ? (
              <select
                className="field-input mt-1"
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
              >
                <option value="">—</option>
                {field.type === "boolean" ? (
                  <>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </>
                ) : (
                  field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <input
                className="field-input mt-1"
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
              />
            )}
          </label>
        ))}
        <p className="text-xs text-[color:var(--muted)]">
          This is a preview against the published rule version. It is not an award and does not create an application.
        </p>
      </form>
      {result ? <EligibilityPanel result={result} /> : null}
    </div>
  );
}
