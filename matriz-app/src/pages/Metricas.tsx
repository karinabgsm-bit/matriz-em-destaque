import { useState } from "react";
import { useContent } from "../lib/useContent";
import { Topbar, Empty } from "../ui/common";
import {
  interactions, engagement, generalEngagement, shareRate, saveRate, commentRate,
  retention, repetition, followerConversion, sumOrNull, safeDiv,
  fmtInt, fmtPct, fmtNum, Snapshot,
} from "../lib/metrics";
import { ContentWithMetric } from "../lib/db";

type Tab = "gerais" | "pub" | "video" | "comp";

export default function Metricas() {
  const { items, loading } = useContent();
  const [tab, setTab] = useState<Tab>("gerais");
  const published = items.filter((c) => c.status === "publicado" && c.metric) as (ContentWithMetric & { metric: Snapshot })[];

  return (
    <>
      <Topbar title="Métricas" />
      <div className="view">
        <div className="tabs">
          {([["gerais", "1 · Gerais"], ["pub", "2 · Por publicação"], ["video", "3 · Vídeo"], ["comp", "4 · Comparação"]] as [Tab, string][]).map(([k, l]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
          <div className="spacer" />
          <span className="muted">{published.length} publicações</span>
        </div>
        {loading ? <p className="muted">Carregando…</p> :
          published.length === 0 ? (
            <div className="panel"><div className="body"><Empty icon="▲" title="Sem métricas ainda" hint="As métricas aparecem quando houver publicações com dados (manuais ou importados do Instagram)." /></div></div>
          ) : (
            <>
              {tab === "gerais" && <Gerais snaps={published.map((c) => c.metric)} />}
              {tab === "pub" && <PorPublicacao items={published} />}
              {tab === "video" && <Video items={published} />}
              {tab === "comp" && <Comparacao items={published} />}
            </>
          )}
      </div>
    </>
  );
}

function Kpi({ l, n, sub }: { l: string; n: string; sub?: string }) {
  return <div className="panel"><div className="body kpi"><span className="l">{l}</span><span className="n">{n}</span>{sub && <span className="muted" style={{ fontSize: 11 }}>{sub}</span>}</div></div>;
}

function Gerais({ snaps }: { snaps: Snapshot[] }) {
  const totReach = sumOrNull(snaps.map((s) => s.reach));
  const totInter = sumOrNull(snaps.map((s) => interactions(s)));
  const tot = (k: keyof Snapshot) => sumOrNull(snaps.map((s) => s[k] as number | null));
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
        <Kpi l="Publicações" n={String(snaps.length)} />
        <Kpi l="Alcance acumulado" n={fmtInt(totReach)} sub="soma — não são pessoas únicas" />
        <Kpi l="Visualizações" n={fmtInt(tot("views"))} />
        <Kpi l="Interações totais" n={fmtInt(totInter)} />
        <Kpi l="Taxa geral engaj." n={fmtPct(generalEngagement(snaps))} sub="agregada" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(5,1fr)", marginTop: 14 }}>
        <Kpi l="Curtidas" n={fmtInt(tot("likes"))} />
        <Kpi l="Comentários" n={fmtInt(tot("comments"))} />
        <Kpi l="Compartilham." n={fmtInt(tot("shares"))} />
        <Kpi l="Salvamentos" n={fmtInt(tot("saves"))} />
        <Kpi l="Seguidores gerados" n={fmtInt(tot("followers_generated"))} />
      </div>
      <div className="note" style={{ marginTop: 14 }}>
        <b>Taxa geral (correta):</b> {fmtInt(totInter)} interações ÷ {fmtInt(totReach)} de alcance × 100 = <b>{fmtPct(generalEngagement(snaps))}</b>.
        O sistema soma primeiro e divide depois — nunca faz a média das taxas individuais. Métrica indisponível aparece como “Não disponível”, nunca zero.
      </div>
    </>
  );
}

function PorPublicacao({ items }: { items: (ContentWithMetric & { metric: Snapshot })[] }) {
  return (
    <div className="panel"><div className="body" style={{ padding: 0, overflowX: "auto" }}>
      <table>
        <thead><tr><th>Conteúdo</th><th>Views</th><th>Alcance</th><th>Curt.</th><th>Com.</th><th>Comp.</th><th>Salv.</th><th>Visitas</th><th>Seg.</th><th>Interações</th><th>Engaj.</th><th>Tx comp.</th><th>Tx salv.</th><th>Tx com.</th></tr></thead>
        <tbody>
          {items.map((c) => { const m = c.metric; return (
            <tr key={c.id}>
              <td><b>{c.title.slice(0, 26)}</b></td>
              <td>{fmtInt(m.views)}</td><td>{fmtInt(m.reach)}</td><td>{fmtInt(m.likes)}</td><td>{fmtInt(m.comments)}</td><td>{fmtInt(m.shares)}</td><td>{fmtInt(m.saves)}</td>
              <td>{fmtInt(m.profile_visits)}</td><td>{fmtInt(m.followers_generated)}</td>
              <td><b>{fmtInt(interactions(m))}</b></td><td><b>{fmtPct(engagement(m))}</b></td>
              <td>{fmtPct(shareRate(m))}</td><td>{fmtPct(saveRate(m))}</td><td>{fmtPct(commentRate(m))}</td>
            </tr>
          ); })}
        </tbody>
      </table>
    </div></div>
  );
}

function Video({ items }: { items: (ContentWithMetric & { metric: Snapshot })[] }) {
  const vids = items.filter((c) => c.metric.video_duration_s != null);
  if (!vids.length) return <div className="panel"><div className="body"><Empty icon="▷" title="Sem vídeos com dados de retenção" /></div></div>;
  return (
    <div className="panel"><div className="body" style={{ padding: 0, overflowX: "auto" }}>
      <table>
        <thead><tr><th>Vídeo</th><th>Duração</th><th>Views</th><th>Alcance</th><th>Tempo médio</th><th>Retenção</th><th>Repetição</th></tr></thead>
        <tbody>
          {vids.map((c) => { const m = c.metric; return (
            <tr key={c.id}><td><b>{c.title.slice(0, 28)}</b></td><td>{fmtInt(m.video_duration_s)}s</td><td>{fmtInt(m.views)}</td><td>{fmtInt(m.reach)}</td><td>{fmtInt(m.video_avg_watch_s)}s</td><td>{fmtPct(retention(m), 1)}</td><td>{fmtNum(repetition(m))}×</td></tr>
          ); })}
        </tbody>
      </table>
    </div></div>
  );
}

function Comparacao({ items }: { items: (ContentWithMetric & { metric: Snapshot })[] }) {
  const bestBy = (score: (c: ContentWithMetric & { metric: Snapshot }) => number | null) =>
    items.filter((c) => score(c) != null).sort((a, b) => (score(b)! - score(a)!))[0];
  const row = (label: string, c: any, val: string) =>
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--linha)" }}><span>{label}<div className="muted" style={{ fontSize: 11 }}>{c ? c.title.slice(0, 34) : "—"}</div></span><b>{c ? val : "Não disponível"}</b></div>;

  const bestMatrix = (mt: string) => items.filter((c) => c.matrix_type === mt).sort((a, b) => (b.metric.reach ?? -1) - (a.metric.reach ?? -1))[0];
  const bReach = (c: ContentWithMetric & { metric: Snapshot }) => c.metric.reach;

  const bHero = bestMatrix("hero"), bHub = bestMatrix("hub"), bHelp = bestMatrix("help");
  const bShare = bestBy((c) => shareRate(c.metric));
  const bSave = bestBy((c) => saveRate(c.metric));
  const bFollow = bestBy((c) => followerConversion(c.metric));
  const bReachC = bestBy((c) => bReach(c));
  const bBest = bestBy((c) => engagement(c.metric));
  const bWorst = items.filter((c) => engagement(c.metric) != null).sort((a, b) => engagement(a.metric)! - engagement(b.metric)!)[0];
  const slotAgg = items.reduce((o, c) => {
    const k = c.scheduled_time || "—";
    const e = engagement(c.metric);
    if (e != null) (o[k] = o[k] || []).push(e);
    return o;
  }, {} as Record<string, number[]>);
  const bestSlot = Object.entries(slotAgg)
    .map(([s, a]) => [s, a.reduce((x, y) => x + y, 0) / a.length] as [string, number])
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <div className="panel"><h3>Melhores por categoria</h3><div className="body">
        {row("Melhor Hero", bHero, bHero ? fmtInt(bHero.metric.reach) + " alcance" : "")}
        {row("Melhor Hub", bHub, bHub ? fmtInt(bHub.metric.reach) + " alcance" : "")}
        {row("Melhor Help", bHelp, bHelp ? fmtInt(bHelp.metric.reach) + " alcance" : "")}
        {row("Maior alcance", bReachC, bReachC ? fmtInt(bReachC.metric.reach) : "")}
      </div></div>
      <div className="panel"><h3>Destaques do período</h3><div className="body">
        {row("Melhor publicação", bBest, bBest ? fmtPct(engagement(bBest.metric)) + " engaj." : "")}
        {row("Pior desempenho", bWorst, bWorst ? fmtPct(engagement(bWorst.metric)) + " engaj." : "")}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--linha)" }}>
          <span>Melhor dia/horário</span><b>{bestSlot ? `${bestSlot[0]} (${fmtPct(bestSlot[1])})` : "Não disponível"}</b>
        </div>
        {row("Maior taxa de compartilhamento", bShare, bShare ? fmtPct(shareRate(bShare.metric)) : "")}
        {row("Maior taxa de salvamento", bSave, bSave ? fmtPct(saveRate(bSave.metric)) : "")}
        {row("Maior conversão em seguidores", bFollow, bFollow ? fmtPct(followerConversion(bFollow.metric)) : "")}
      </div></div>
    </div>
  );
}
