import { useMemo, useState } from "react";
import { useContent } from "../lib/useContent";
import { Topbar, Empty } from "../ui/common";
import { interactions, engagement, generalEngagement, sumOrNull, fmtInt, fmtPct, Snapshot } from "../lib/metrics";
import { ContentWithMetric } from "../lib/db";

type Pub = ContentWithMetric & { metric: Snapshot };
const MMMM = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function monthKey(c: ContentWithMetric): string | null {
  const d = c.published_at || c.scheduled_date || c.created_at;
  return d ? d.slice(0, 7) : null;
}
function monthLabel(k: string) {
  const [y, m] = k.split("-");
  return `${MMMM[Number(m) - 1]} de ${y}`;
}

export default function Relatorio() {
  const { items, loading } = useContent();
  const published = useMemo(() => items.filter((c) => c.status === "publicado" && c.metric) as Pub[], [items]);

  const months = useMemo(() => {
    const set = new Set<string>();
    published.forEach((c) => { const k = monthKey(c); if (k) set.add(k); });
    const now = new Date();
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    return Array.from(set).sort().reverse();
  }, [published]);

  const [month, setMonth] = useState("");
  const selMonth = month || months[0] || "";
  const pubs = published.filter((c) => monthKey(c) === selMonth);

  return (
    <>
      <Topbar title="Relatório" />
      <div className="view">
        <div className="metrics-head">
          <h3 className="serif" style={{ margin: 0 }}>Relatório do mês</h3>
          <div className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>Período</span>
          <select className="month-select" value={selMonth} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="muted">Carregando…</p>
        ) : pubs.length === 0 ? (
          <div className="panel"><div className="body"><Empty icon="▥" title="Sem dados para este mês" hint="O relatório é gerado automaticamente a partir das métricas das publicações." /></div></div>
        ) : (
          <Conteudo pubs={pubs} label={monthLabel(selMonth)} />
        )}
      </div>
    </>
  );
}

function Conteudo({ pubs, label }: { pubs: Pub[]; label: string }) {
  const byReach = pubs.slice().sort((a, b) => (b.metric.reach ?? -1) - (a.metric.reach ?? -1));
  const byEng = pubs.filter((c) => engagement(c.metric) != null).slice().sort((a, b) => engagement(b.metric)! - engagement(a.metric)!);
  const bySaves = pubs.slice().sort((a, b) => (b.metric.saves ?? -1) - (a.metric.saves ?? -1));
  const bottom = byReach.slice().reverse();

  const taxa = generalEngagement(pubs.map((c) => c.metric));
  const totFollowers = sumOrNull(pubs.map((c) => c.metric.followers_generated));

  const item = (c: Pub, extra: string) => (
    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--linha)" }}>
      <span style={{ maxWidth: "62%" }}><b>{c.title}</b></span>
      <span className="muted" style={{ fontSize: 12 }}>{extra}</span>
    </div>
  );

  return (
    <>
      <div className="mcards" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
        <div className="mcard"><div className="accent" style={{ background: "#2f8f5b" }} /><div className="lbl">Publicações no mês</div><div className="val">{pubs.length}</div></div>
        <div className="mcard"><div className="accent" style={{ background: "#c6a24a" }} /><div className="lbl">Taxa geral de engaj.</div><div className="val">{fmtPct(taxa)}</div></div>
        <div className="mcard"><div className="accent" style={{ background: "#2c5c96" }} /><div className="lbl">Seguidores gerados</div><div className="val">{fmtInt(totFollowers)}</div></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel"><h3>✅ O que deu certo</h3><div className="body">
          <p className="muted" style={{ marginTop: 0 }}>Os conteúdos que mais alcançaram pessoas em {label}:</p>
          {byReach.slice(0, 3).map((c) => item(c, fmtInt(c.metric.reach) + " alcance · " + fmtPct(engagement(c.metric)) + " engaj."))}
          {byEng[0] && <div className="alert ok" style={{ marginTop: 10 }}>🏅 Maior engajamento: <b>{byEng[0].title}</b> ({fmtPct(engagement(byEng[0].metric))}). Prova que conexão emocional supera alcance.</div>}
          {bySaves[0]?.metric.saves ? <div className="alert info" style={{ marginTop: 8 }}>🔖 Mais salvo: <b>{bySaves[0].title}</b> ({fmtInt(bySaves[0].metric.saves)} salvamentos) — conteúdo de referência/consulta.</div> : null}
        </div></div>

        <div className="panel"><h3>🔁 O que repetir</h3><div className="body">
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 13.5 }}>
            <li>Repetir os <b>temas dos 3 posts de maior alcance</b> acima — funcionaram com o público.</li>
            <li>Investir em <b>conteúdo com dor/emoção reconhecível</b> (relacionamentos, comportamento), que puxou o maior alcance do mês.</li>
            <li>Manter <b>cortes de entrevista</b> como formato principal de descoberta (Hero).</li>
            <li>Fazer mais conteúdo <b>salvável/útil</b> (Help) — os posts mais salvos viram referência e seguem rendendo.</li>
            <li>Continuar o equilíbrio <b>Hero → Hub → Help</b> ao longo da semana, como na estratégia.</li>
          </ul>
        </div></div>

        <div className="panel"><h3>⚠️ O que não deu certo</h3><div className="body">
          <p className="muted" style={{ marginTop: 0 }}>Publicações com menor alcance/engajamento — vale rever gancho, tema ou horário:</p>
          {bottom.slice(0, 3).map((c) => item(c, fmtInt(c.metric.reach) + " alcance · " + fmtPct(engagement(c.metric)) + " engaj."))}
          <div className="alert warn" style={{ marginTop: 10 }}>Sugestão: reforçar o gancho nos 3 primeiros segundos e conectar o tema a uma emoção ou memória local — foi o que separou os melhores dos piores.</div>
        </div></div>

        <div className="panel"><h3>📌 Resumo</h3><div className="body">
          <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            Em <b>{label}</b>, foram <b>{pubs.length} publicações</b>, com taxa geral de engajamento de <b>{fmtPct(taxa)}</b> e <b>{fmtInt(totFollowers)}</b> novos seguidores gerados.
            O destaque foi <b>{byReach[0]?.title}</b>. Para o próximo ciclo: repetir os temas campeões, manter o equilíbrio Hero/Hub/Help e melhorar o gancho dos conteúdos de menor desempenho.
          </p>
          <p className="muted" style={{ fontSize: 12 }}>Relatório gerado automaticamente a partir das métricas. Atualiza sozinho conforme novos dados entram.</p>
        </div></div>
      </div>
    </>
  );
}
