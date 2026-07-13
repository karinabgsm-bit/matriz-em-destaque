import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/useContent";
import { Topbar, Empty, StatusBadge, MatrixPill, cover, dateBR } from "../ui/common";
import { generalEngagement, fmtPct, fmtInt, sumOrNull } from "../lib/metrics";
import ContentPanel from "../ui/ContentPanel";

export default function Inicio() {
  const { isEditor, profile } = useAuth();
  const { items, loading, reload } = useContent();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((c) => c.id === openId) || null;

  const published = items.filter((c) => c.status === "publicado" && c.metric);
  const snaps = published.map((c) => c.metric!);
  const waiting = items.filter((c) => c.status === "aguardando_aprovacao");

  return (
    <>
      <Topbar title="Início" />
      <div className="view">
        {loading ? (
          <p className="muted">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="panel"><div className="body">
            <Empty icon="◈" title="Tudo pronto para começar" hint={isEditor ? "O painel está vazio porque ainda não há conteúdos. Crie o primeiro em “Conteúdos” ou conecte o Instagram em “Integrações”." : "Ainda não há conteúdos para aprovar."} />
          </div></div>
        ) : isEditor ? (
          <>
            <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
              <Kpi l="Aguardando aprovação" n={String(waiting.length)} sub="com o César" />
              <Kpi l="Publicados" n={String(published.length)} sub="no total" />
              <Kpi l="Alcance acumulado" n={fmtInt(sumOrNull(snaps.map((s) => s.reach)))} sub="soma das publicações" />
              <Kpi l="Taxa geral engaj." n={fmtPct(generalEngagement(snaps), 1)} sub="agregada" />
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginTop: 16 }}>
              <div className="panel"><h3>Aguardando aprovação</h3><div className="body">
                {waiting.length === 0 ? <p className="muted">Nada aguardando.</p> : waiting.map((c) => (
                  <div key={c.id} className="rowlink" style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--linha)", cursor: "pointer" }} onClick={() => setOpenId(c.id)}>
                    {cover(c)}<div style={{ flex: 1 }}><b>{c.title}</b><div className="muted" style={{ fontSize: 11.5 }}>{dateBR(c.scheduled_date)} · {c.scheduled_time || "—"}</div></div><MatrixPill v={c.matrix_type} />
                  </div>
                ))}
              </div></div>
              <div className="panel"><h3>Resumo</h3><div className="body">
                <div className="alert info">Total de conteúdos: <b>{items.length}</b></div>
                <div className="alert ok">Publicados: <b>{published.length}</b></div>
                <div className="alert warn">Aguardando aprovação: <b>{waiting.length}</b></div>
              </div></div>
            </div>
          </>
        ) : (
          <div className="panel"><h3>Fila de aprovação <span className="muted" style={{ fontSize: 11 }}>{waiting.length} aguardando você</span></h3><div className="body">
            {waiting.length === 0 ? <Empty icon="✓" title="Nada aguardando aprovação" /> : waiting.map((c) => (
              <div key={c.id} className="rowlink" style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--linha)", cursor: "pointer" }} onClick={() => setOpenId(c.id)}>
                {cover(c, 46)}
                <div style={{ flex: 1 }}><b>{c.title}</b><div className="muted" style={{ fontSize: 12 }}>{dateBR(c.scheduled_date)} · {c.scheduled_time || "—"}</div></div>
                <StatusBadge s={c.status} />
              </div>
            ))}
          </div></div>
        )}
      </div>
      {open && <ContentPanel item={open} onClose={() => setOpenId(null)} onReload={reload} />}
    </>
  );
}

function Kpi({ l, n, sub }: { l: string; n: string; sub: string }) {
  return <div className="panel"><div className="body kpi"><span className="l">{l}</span><span className="n">{n}</span><span className="muted" style={{ fontSize: 11 }}>{sub}</span></div></div>;
}
