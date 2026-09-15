"use client";

import type { SchemeConfig } from "@/engine/types";
import { submitApplicationAction } from "@/lib/actions";
import { useState } from "react";

export function DynamicForm({ scheme }: { scheme: SchemeConfig }) {
  const sections = [...new Set(scheme.applicationSchema.map((f) => f.section))];
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-8"
      action={async (fd) => {
        setPending(true);
        await submitApplicationAction(scheme.code, fd);
      }}
    >
      {sections.map((section) => (
        <fieldset key={section} className="card p-5">
          <legend className="font-[family-name:var(--font-display)] px-2 text-xl">{section}</legend>
          <div className="grid gap-4 md:grid-cols-2">
            {scheme.applicationSchema
              .filter((f) => f.section === section)
              .map((field) => (
                <label key={field.id} className="block text-sm">
                  <span className="mb-1 block font-semibold">
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.help ? <span className="mb-1 block text-xs text-[color:var(--muted)]">{field.help}</span> : null}
                  {field.type === "textarea" ? (
                    <textarea name={field.id} required={field.required} className="field-input" rows={4} />
                  ) : field.type === "boolean" ? (
                    <select name={field.id} required={field.required} className="field-input" defaultValue="false">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : field.type === "select" ? (
                    <select name={field.id} required={field.required} className="field-input" defaultValue="">
                      <option value="" disabled>
                        Select
                      </option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.id}
                      type={field.type === "number" || field.type === "currency" ? "number" : field.type}
                      required={field.required}
                      className="field-input"
                    />
                  )}
                </label>
              ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="card p-5">
        <legend className="font-[family-name:var(--font-display)] px-2 text-xl">Documents required by this scheme version</legend>
        <ul className="space-y-2 text-sm">
          {scheme.requiredDocuments.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] py-2">
              <span>
                {doc.label} {doc.mandatory ? <em className="not-italic text-[color:var(--accent)]">mandatory</em> : "optional"}
              </span>
              <input type="file" name={`doc-${doc.id}`} className="text-xs" />
            </li>
          ))}
        </ul>
        <p className="meta mt-3">Uploads are quality-checked and classified in the prototype. Live DigiLocker remains an integration boundary.</p>
      </fieldset>

      <button disabled={pending} className="btn-primary px-5 py-3 text-sm font-semibold">
        {pending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
