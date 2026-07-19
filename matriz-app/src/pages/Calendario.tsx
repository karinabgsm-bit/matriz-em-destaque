import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/useContent";
import { createContent, STATUS_LABEL, FORMAT_LABEL } from "../lib/db";
import { Topbar, MatrixPill, StatusBadge, dateBR } from "../ui/common";
import ContentPanel from "../ui/ContentPanel";

const SLOTS = ["10h", "12h", "14h", "18h", "20h", "22h"];
const DOW = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MATRIX_COLOR: Record<string, string> = { hero: "#c6a24a", hub: "#2c5c96", help: "#256b43" };

function evColor(m: string | null) {
  return m ? MATRIX_COLOR[m] ?? "#6b6b66" : "#6b6b66";
}
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // segunda = 0
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function Calendario() {
  const { isEditor } = useAuth();
  const { items, loading, reload } = useContent();
  const [mode, setMode] = useState<"semana" | "mes" | "lista">("semana");
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date()));
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => new Date());
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((c) => c.id === openId) || null;

  const semData = items.filter((c) => !c.scheduled_date);

  async function criar(date: string, time: string) {
    if (!isEditor) return;
    const c = await createContent({ scheduled_date: date, scheduled_time: time });
    await reload();
    setOpenId(c.id);
  }

  function evBox(c: (typeof items)[number]) {
    return (
      <div key={c.id} className="evt" style={{ background: evColor(c.matrix_type) }} onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }}>
        {c.title.slice(0, 24)}{c.title.length > 24 ? "…" : ""}
        <small>{c.format ? FORMAT_LABEL[c.format] : STATUS_LABEL[c.status]}</small>
      </div>
    );
  }

  return (
    <>
      <Topbar
        title="Calendário"
        right={
          <div className="calnav">
            {mode === "semana" && (
              <>
                <button className="btn ghost" onClick={() => setAnchor(addDays(anchor, -7))}>‹</button>
                <span className="muted" style={{ fontSize: 12 }}>{dateBR(iso(anchor))} – {dateBR(iso(addDays(anchor, 6)))}</span>
                <button className="btn ghost" onClick={() => setAnchor(addDays(anchor, 7))}>›</button>
              </>
            )}
            {mode === "mes" && (
              <>
                <button className="btn ghost" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}>‹</button>
                <span className="muted" style={{ fontSize: 12 }}>{MONTHS[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}</span>
                <button className="btn ghost" onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}>›</button>
              </>
            )}
          </div>
        }
      />
      <div className="view">
        <div className="tabs">
          {(["semana", "mes", "lista"] as const).map((m) => (
            <button key={m} className={mode === m ? "active" : ""} onClick={() => setMode(m)}>
              {m === "semana" ? "Semana (grade por horário)" : m === "mes" ? "Mês" : "Lista"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="muted">Carregando…</p>
        ) : mode === "semana" ? (
          <Semana />
        ) : mode === "mes" ? (
          <Mes />
        ) : (
          <Lista />
        )}

        <div className="tray">
          <b>Bandeja · conteúdos sem data</b>{" "}
          {isEditor && <span className="muted">(clique num horário vazio para criar; aqui ficam os sem data)</span>}
          <br />
          {semData.length === 0 ? (
            <span className="muted">Vazio</span>
          ) : (
            semData.map((c) => (
              <span key={c.id} className="chip" onClick={() => setOpenId(c.id)}>
                <MatrixPill v={c.matrix_type} /> {c.title}
              </span>
            ))
          )}
        </div>
      </div>
      {open && <ContentPanel item={open} onClose={() => setOpenId(null)} onReload={reload} />}
    </>
  );

  function Semana() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
    const cells: JSX.Element[] = [];
    cells.push(<div key="corner" className="hcell corner" />);
    days.forEach((d, i) => cells.push(
      <div key={"h" + i} className="hcell">{DOW[i]}<br /><span className="muted">{String(d.getDate()).padStart(2, "0")}/{String(d.getMonth() + 1).padStart(2, "0")}</span></div>
    ));
    SLOTS.forEach((sl) => {
      cells.push(<div key={"t" + sl} className="tcell">{sl}</div>);
      days.forEach((d, i) => {
        const dayIso = iso(d);
        const evs = items.filter((c) => c.scheduled_date === dayIso && c.scheduled_time === sl);
        cells.push(
          <div key={sl + i} className={"slot" + (isEditor ? " k" : "")} onClick={isEditor ? () => criar(dayIso, sl) : undefined}>
            {evs.map(evBox)}
          </div>
        );
      });
    });
    return <div className="calgrid">{cells}</div>;
  }

  function Mes() {
    const y = monthAnchor.getFullYear();
    const m = monthAnchor.getMonth();
    const first = new Date(y, m, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: JSX.Element[] = [];
    DOW.forEach((d) => cells.push(<div key={"h" + d} className="hcell corner">{d}</div>));
    for (let i = 0; i < startDow; i++) cells.push(<div key={"e" + i} className="slot" style={{ background: "#faf9f6" }} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const dayIso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const evs = items.filter((c) => c.scheduled_date === dayIso);
      cells.push(
        <div key={"d" + day} className={"slot" + (isEditor ? " k" : "")} style={{ minHeight: 80 }} onClick={isEditor ? () => criar(dayIso, "10h") : undefined}>
          <div className="muted" style={{ fontSize: 11 }}>{day}</div>
          {evs.map((c) => (
            <div key={c.id} className="evt" style={{ background: evColor(c.matrix_type), fontSize: 9.5 }} onClick={(e) => { e.stopPropagation(); setOpenId(c.id); }}>
              {c.title.slice(0, 16)}…
            </div>
          ))}
        </div>
      );
    }
    return <div className="calgrid" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>{cells}</div>;
  }

  function Lista() {
    const dated = items.filter((c) => c.scheduled_date).sort((a, b) => (a.scheduled_date! + (a.scheduled_time || "")).localeCompare(b.scheduled_date! + (b.scheduled_time || "")));
    if (dated.length === 0) return <div className="panel"><div className="body"><p className="muted">Nenhum conteúdo com data ainda.</p></div></div>;
    return (
      <div className="panel"><div className="body" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Conteúdo</th><th>Data</th><th>Hora</th><th>Matriz</th><th>Status</th></tr></thead>
          <tbody>
            {dated.map((c) => (
              <tr key={c.id} className="rowlink" onClick={() => setOpenId(c.id)}>
                <td><b>{c.title}</b></td><td>{dateBR(c.scheduled_date)}</td><td>{c.scheduled_time || "—"}</td>
                <td><MatrixPill v={c.matrix_type} /></td><td><StatusBadge s={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    );
  }
}
