import { useState } from "react";
import { useContent } from "../lib/useContent";
import { Topbar, Empty, StatusBadge } from "../ui/common";
import { ContentWithMetric } from "../lib/db";
import ContentPanel from "../ui/ContentPanel";

// Metas sugeridas (editaveis no futuro em Configuracoes / balance_targets).
const TARGETS = { hero: 2, hub: 5, help: 6, aderencia: 8, profundidade: 5 };

type Tab = "hhh" | "ap" | "eq";

export default function Matriz() {
  const { items, loading, reload } = useContent();
  const [tab, setTab] = useState<Tab>("hhh");
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((c) => c.id === openId) || null;

  const d = { hero: 0, hub: 0, help: 0 };
  const p = { aderencia: 0, profundidade: 0 };
  items.forEach((c) => {
    if (c.matrix_type) (d as any)[c.matrix_type]++;
    if (c.permeability) (p as any)[c.permeability]++;
  });

  return (
    <>
      <Topbar title="Matriz estratégica" />
      <div className="view">
        <div className="tabs">
          {([["hhh", "Hero · Hub · Help"], ["ap", "Aderência · Profundidade"], ["eq", "Equilíbrio"]] as [Tab, string][]).map(([k, l]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {loading ? (
          <p className="muted">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="panel"><div className="body"><Empty icon="◪" title="Sem conteúdos para classificar" hint="Crie conteúdos e defina Hero/Hub/Help e Aderência/Profundidade — eles aparecem aqui automaticamente." /></div></div>
        ) : tab === "hhh" ? (
          <Cols
            cats={[["hero", "Hero", "Atrai novas pessoas"], ["hub", "Hub", "Cria hábito e relação"], ["help", "Help", "Útil, salvável e pesquisável"]]}
            field="matrix_type"
          />
        ) : tab === "ap" ? (
          <Cols
            cats={[["aderencia", "Aderência", "Fácil de consumir, gera hábito"], ["profundidade", "Profundidade", "Conteúdo completo e perene"]]}
            field="permeability"
          />
        ) : (
          <Equilibrio />
        )}
      </div>
      {open && <ContentPanel item={open} onClose={() => setOpenId(null)} onReload={reload} />}
    </>
  );

  function Cols({ cats, field }: { cats: [string, string, string][]; field: "matrix_type" | "permeability" }) {
    return (
      <>
        <div className="mcols" style={{ gridTemplateColumns: `repeat(${cats.length},1fr)` }}>
          {cats.map(([key, label, cap]) => {
            const list = items.filter((c) => (c as any)[field] === key);
            return (
              <div key={key} className="mcol">
                <h4>{label}<span>{list.length}</span></h4>
                <div className="cap">{cap}</div>
                {list.map((c: ContentWithMetric) => (
                  <div key={c.id} className="kcard" onClick={() => setOpenId(c.id)}>
                    <div className="kt">{c.title}</div>
                    <div className="foot"><span className="muted">{c.origin}</span><StatusBadge s={c.status} /></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>Não classificados não aparecem aqui até você definir a categoria no cartão.</p>
      </>
    );
  }

  function Equilibrio() {
    const cmp = (v: number, t: number) =>
      v >= t ? <span style={{ color: "var(--verde)" }}>✓ meta {t}</span> : <span style={{ color: "var(--vermelho)" }}>▼ meta {t}</span>;
    const diasComPost = new Set(items.filter((c) => c.scheduled_date).map((c) => c.scheduled_date)).size;
    const bar = (v: number, max: number, color: string) => (
      <div className="bar"><i style={{ width: `${Math.min(100, (v / Math.max(max, 1)) * 100)}%`, background: color }} /></div>
    );
    return (
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel"><h3>Modelagem</h3><div className="body">
          <div style={{ marginBottom: 8 }}>Hero <b>{d.hero}</b> {cmp(d.hero, TARGETS.hero)}{bar(d.hero, d.help, "#c6a24a")}</div>
          <div style={{ marginBottom: 8 }}>Hub <b>{d.hub}</b> {cmp(d.hub, TARGETS.hub)}{bar(d.hub, d.help, "#2c5c96")}</div>
          <div style={{ marginBottom: 8 }}>Help <b>{d.help}</b> {cmp(d.help, TARGETS.help)}{bar(d.help, d.help, "#256b43")}</div>
          <div className="note">Regra sugerida: mais <b>Help</b> que <b>Hero</b>. {d.help > d.hero ? "✓ ok" : "⚠ ajustar"} — o sistema alerta, não bloqueia.</div>
        </div></div>
        <div className="panel"><h3>Permeabilidade</h3><div className="body">
          <div style={{ marginBottom: 8 }}>Aderência <b>{p.aderencia}</b> {cmp(p.aderencia, TARGETS.aderencia)}{bar(p.aderencia, Math.max(p.aderencia, p.profundidade), "#6a4794")}</div>
          <div style={{ marginBottom: 8 }}>Profundidade <b>{p.profundidade}</b> {cmp(p.profundidade, TARGETS.profundidade)}{bar(p.profundidade, Math.max(p.aderencia, p.profundidade), "#95562c")}</div>
          <div className="note">Regra sugerida: mais <b>Aderência</b> que <b>Profundidade</b>. {p.aderencia > p.profundidade ? "✓ ok" : "⚠ ajustar"}.</div>
        </div></div>
        <div className="panel"><h3>Ritmo</h3><div className="body">
          <div className="metricbox">
            <div className="m"><div className="n">{diasComPost}</div><div className="l">Dias com publicação (agendada)</div></div>
            <div className="m"><div className="n">{items.length}</div><div className="l">Total de conteúdos</div></div>
          </div>
        </div></div>
        <div className="panel"><h3>Distribuição</h3><div className="body">
          <div style={{ marginBottom: 8 }}>Hero/Hub/Help</div>
          {bar(d.hero, d.hero + d.hub + d.help, "#c6a24a")}
          {bar(d.hub, d.hero + d.hub + d.help, "#2c5c96")}
          {bar(d.help, d.hero + d.hub + d.help, "#256b43")}
        </div></div>
      </div>
    );
  }
}
