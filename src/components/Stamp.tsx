export function Stamp({ children, tone = "stamp" }: { children: React.ReactNode; tone?: "stamp" | "ok" | "danger" | "rule" }) {
  const color = tone === "ok" ? "text-spine" : tone === "danger" ? "text-danger" : tone === "rule" ? "text-rule" : "";
  return <span className={`stamp ${color}`}>{children}</span>;
}
