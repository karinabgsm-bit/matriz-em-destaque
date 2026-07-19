import { useMemo, useState } from "react";
import { useContent } from "../lib/useContent";
import { Topbar, Empty, MatrixPill } from "../ui/common";
import {
  interactions, engagement, generalEngagement, shareRate, saveRate, commentRate,
  retention, repetition, followerConversion, sumOrNull, fmtInt, fmtPct, fmtNum, Snapshot,
} from "../lib/metrics";
import { ContentWithMetric } from "../lib/db";

type Pub = ContentWithMetric & { metric: Snapshot };
const MMM = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MMMM = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function monthKey(c: ContentWithMetric): string | null {
  const d = c.published_at || c.scheduled_date || c.created_at;
  return d ? d.slice(0, 7) : null;
}
function monthLabel(k: string) {
  const [y, m] = k.split("-");
  return `${MMMM[Number(m) - 1]} de ${y}`;
}
function avg(nums: (number | null)[]): number | null {
  const v = nums.filter((n): n is number => n != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

type Tab = "resumo" | "pub" | "video";

export default function Metricas() {
  const { items, loading } = useContent();
  const [tab, setTab] = useState<Tab>("resumo");

  const published = useMemo(
    () => items.filter((c) => c.status === "publicado" && c.metric) as Pub[],
    [items]
  );

  const months = useMemo(() => {
    const set = new Set<string>();
    published.forEach((c) => { const k = monthKey(c); if (k) set.add(k); });
    const now = new Date();
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    return Array.from(set).sort().reverse();
  }, [published]);

  const [month, setMonth] = useState<string>("");
  const selMonth = month || months[0] || "";
  const monthPubs = published.filter((c) => monthKey(c) === selMonth);

  return (
    <>
      <Topbar title="Métricas" />
      <div className="view">
        <div className="metrics-head">
          <div className="tabs" style={{ margin: 0 }}>
            {([["resumo", "Resumo do mês"], ["pub", "Por publicação"], ["video", "Vídeo"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <div className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>Período</span>
          <select className="month-select" value={selMonth} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="muted">Carregando…</p>
        ) : published.length === 0 ? (
          <div className="panel"><div className="body">
            <Empty icon="▲" title="Sem métricas ainda" hint="Os números aparecem automaticamente quando houver publicações com dados (inseridos manualmente ou importados do Instagram)." />
          </div></div>
        ) : (
          <>
            {tab === "resumo" && <ResumoMes pubs={monthPubs} label={monthLabel(selMonth)} />}
            {tab === "pub" && <PorPublicacao pubs={monthPubs} />}
            {tab === "video" && <Video pubs={monthPubs} />}
          </>
        )}
      </div>
    </>
  );
}

/* =================== RESUMO DO MÊS (estilo dashboard) =================== */
function ResumoMes({ pubs, label }: { pubs: Pub[]; label: string }) {
  if (pubs.length === 0)
    return <div className="panel"><div className="body"><Empty icon="🗓" title={`Nenhuma publicação em ${label}`} hint="Escolha outro mês no seletor acima." /></div></div>;

  const snaps = pubs.map((c) => c.metric);
  const tot = (k: keyof Snapshot) => sumOrNull(snaps.map((s) => s[k] as number | null));
  const totInter = sumOrNull(snaps.map((s) => interactions(s)));
  const totReach = tot("reach");
  const taxa = generalEngagement(snaps);

  // Post do mês = maior alcance (o post que mais se destacou)
  const postMes = pubs.filter((c) => c.metric.reach != null).sort((a, b) => (b.metric.reach ?? -1) - (a.metric.reach ?? -1))[0];
  const pior = pubs.filter((c) => engagement(c.metric) != null).sort((a, b) => engagement(a.metric)! - engagement(b.metric)!)[0];
  const bestMatrix = (m: string) => pubs.filter((c) => c.matrix_type === m).sort((a, b) => (b.metric.reach ?? -1) - (a.metric.reach ?? -1))[0];

  const card = (lbl: string, val: string, sub: string, color: string) => (
    <div className="mcard"><div className="accent" style={{ background: color }} /><div className="lbl">{lbl}</div><div className="val">{val}</div><div className="sub">{sub}</div></div>
  );

  return (
    <>
      <h3 className="serif" style={{ margin: "4px 0 12px" }}>Resumo automático — {label}</h3>
      <div className="mcards">
        {card("Publicações", String(pubs.length), "no mês", "#2c2c31")}
        {card("Alcance total", fmtInt(totReach), "soma das publicações", "#2c5c96")}
        {card("Interações totais", fmtInt(totInter), "curt+com+comp+salv", "#c6a24a")}
        {card("Taxa geral de engaj.", fmtPct(taxa), "agregada", "#2f8f5b")}
      </div>
      <div className="mcards" style={{ marginTop: 14 }}>
        {card("Visualizações", fmtInt(tot("views")), "totais", "#8A3AB9")}
        {card("Média de alcance/post", fmtInt(avg(snaps.map((s) => s.reach))), "por publicação", "#2c5c96")}
        {card("Média de interações/post", fmtInt(avg(snaps.map((s) => interactions(s)))), "por publicação", "#c6a24a")}
        {card("Seguidores gerados", fmtInt(tot("followers_generated")), "no mês", "#2f8f5b")}
      </div>

      <div className="note" style={{ marginTop: 14 }}>
        <b>Cálculo automático da taxa geral:</b> {fmtInt(totInter)} interações ÷ {fmtInt(totReach)} de alcance × 100 = <b>{fmtPct(taxa)}</b>.
        Somamos primeiro tudo e só então dividimos — nunca a média das taxas individuais. Métrica indisponível aparece como “Não disponível”, nunca zero.
      </div>

      {postMes && (
        <>
          <h3 className="serif" style={{ margin: "22px 0 12px" }}>🏆 Post do mês</h3>
          <div className="postmes">
            <div className="medal">🏆</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{postMes.title}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}><MatrixPill v={postMes.matrix_type} /></div>
            </div>
            <div className="metricbox" style={{ minWidth: 320 }}>
              <div className="m"><div className="n">{fmtInt(postMes.metric.reach)}</div><div className="l">Alcance</div></div>
              <div className="m"><div className="n">{fmtInt(interactions(postMes.metric))}</div><div className="l">Interações</div></div>
              <div className="m"><div className="n">{fmtPct(engagement(postMes.metric))}</div><div className="l">Engajamento</div></div>
              <div className="m"><div className="n">{fmtInt(postMes.metric.saves)}</div><div className="l">Salvamentos</div></div>
            </div>
          </div>
        </>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
        <div className="panel"><h3>Destaques do mês</h3><div className="body">
          {linha("Melhor publicação", postMes ? postMes.title : null, postMes ? fmtPct(engagement(postMes.metric)) + " engaj." : "")}
          {linha("Pior desempenho", pior ? pior.title : null, pior ? fmtPct(engagement(pior.metric)) + " engaj." : "")}
          {linha("Melhor Hero", bestMatrix("hero")?.title ?? null, bestMatrix("hero") ? fmtInt(bestMatrix("hero").metric.reach) + " alcance" : "")}
          {linha("Melhor Hub", bestMatrix("hub")?.title ?? null, bestMatrix("hub") ? fmtInt(bestMatrix("hub").metric.reach) + " alcance" : "")}
          {linha("Melhor Help", bestMatrix("help")?.title ?? null, bestMatrix("help") ? fmtInt(bestMatrix("help").metric.reach) + " alcance" : "")}
        </div></div>
        <div className="panel"><h3>Taxas médias do mês</h3><div className="body">
          {linha("Taxa de compartilhamento", "média das publicações", fmtPct(avg(snaps.map((s) => shareRate(s)))))}
          {linha("Taxa de salvamento", "média das publicações", fmtPct(avg(snaps.map((s) => saveRate(s)))))}
          {linha("Taxa de comentários", "média das publicações", fmtPct(avg(snaps.map((s) => commentRate(s)))))}
          {linha("Conversão em seguidores", "média das publicações", fmtPct(avg(snaps.map((s) => followerConversion(s)))))}
        </div></div>
      </div>
    </>
  );
}

function linha(label: string, sub: string | null, val: string) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--linha)" }}>
      <span>{label}{sub && <div className="muted" style={{ fontSize: 11 }}>{sub.slice(0, 40)}</div>}</span>
      <b>{val || "Não disponível"}</b>
    </div>
  );
}

/* =================== POR PUBLICAÇÃO =================== */
function PorPublicacao({ pubs }: { pubs: Pub[] }) {
  if (pubs.length === 0) return <div className="panel"><div className="body"><p className="muted">Nenhuma publicação neste mês.</p></div></div>;
  return (
    <div className="panel"><div className="body" style={{ padding: 0, overflowX: "auto" }}>
      <table>
        <thead><tr><th>Conteúdo</th><th>Views</th><th>Alcance</th><th>Curt.</th><th>Com.</th><th>Comp.</th><th>Salv.</th><th>Visitas</th><th>Seg.</th><th>Interações</th><th>Engaj.</th><th>Tx comp.</th><th>Tx salv.</th><th>Tx com.</th></tr></thead>
        <tbody>
          {pubs.map((c) => { const m = c.metric; return (
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

/* =================== VÍDEO =================== */
function Video({ pubs }: { pubs: Pub[] }) {
  const vids = pubs.filter((c) => c.metric.video_duration_s != null);
  if (!vids.length) return <div className="panel"><div className="body"><Empty icon="▷" title="Sem vídeos com dados de retenção neste mês" /></div></div>;
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
