import { ReactNode } from "react";
import { Content, Matrix, Perm, Status, STATUS_LABEL, FORMAT_LABEL } from "../lib/db";

export function Topbar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="topbar">
      <span className="title">{title}</span>
      <div className="spacer" />
      {right}
    </div>
  );
}

const MATRIX_LABEL: Record<string, string> = { hero: "Hero", hub: "Hub", help: "Help" };
const PERM_LABEL: Record<string, string> = { aderencia: "Aderência", profundidade: "Profundidade" };

export function MatrixPill({ v }: { v: Matrix }) {
  if (!v) return <span className="pill none">sem matriz</span>;
  const cls = v === "hero" ? "hero" : v === "hub" ? "hub" : "help";
  return <span className={"pill " + cls}>{MATRIX_LABEL[v]}</span>;
}
export function PermPill({ v }: { v: Perm }) {
  if (!v) return <span className="pill none">—</span>;
  return <span className={"pill " + (v === "aderencia" ? "ader" : "prof")}>{PERM_LABEL[v]}</span>;
}
export function StatusBadge({ s }: { s: Status }) {
  return <span className="badge">{STATUS_LABEL[s]}</span>;
}
export function FormatBadge({ v }: { v: string | null }) {
  if (!v) return <span className="badge" style={{ opacity: 0.6 }}>sem formato</span>;
  return <span className="badge" style={{ background: "#efe9f6", color: "#6a4794", borderColor: "#ddd0ee" }}>{FORMAT_LABEL[v] ?? v}</span>;
}

export function dateBR(d: string | null) {
  return d ? d.split("-").reverse().join("/") : "—";
}

export function Empty({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

export const CH_COLOR = "#c9377e"; // Instagram (unico canal automatico nesta fase)
export function cover(c: Content, size = 34) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        background: c.media_path ? "#3b3b41" : CH_COLOR,
      }}
    >
      {c.media_path ? "▣" : "◆"}
    </span>
  );
}
