import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/useContent";
import { createContent, ContentWithMetric } from "../lib/db";
import { Topbar, Empty, MatrixPill, PermPill, StatusBadge, cover, dateBR } from "../ui/common";
import { engagement, fmtPct, fmtInt } from "../lib/metrics";
import ContentPanel from "../ui/ContentPanel";

export default function Conteudos() {
  const { isEditor } = useAuth();
  const { items, loading, error, reload } = useContent();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  let list = items;
  if (!isEditor) list = list.filter((c) => ["publicado", "aprovado", "reprovado", "aguardando_aprovacao"].includes(c.status));
  if (q) list = list.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  const open = items.find((c) => c.id === openId) || null;

  async function novo() {
    const c = await createContent({});
    await reload();
    setOpenId(c.id);
  }

  return (
    <>
      <Topbar
        title={isEditor ? "Conteúdos" : "Publicados"}
        right={
          <>
            <input className="field" style={{ padding: "8px 12px", borderRadius: 20, width: 200 }} placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} />
            {isEditor && <button className="btn gold" onClick={novo}>+ Novo conteúdo</button>}
          </>
        }
      />
      <div className="view">
        {error && <div className="err">{error}</div>}
        {loading ? (
          <p className="muted">Carregando…</p>
        ) : list.length === 0 ? (
          <div className="panel"><div className="body"><Empty icon="☰" title="Nenhum conteúdo ainda" hint={isEditor ? "Clique em “+ Novo conteúdo” para começar, ou conecte o Instagram em Integrações." : "Nada publicado ainda."} /></div></div>
        ) : (
          <div className="panel"><div className="body" style={{ padding: 0, overflowX: "auto" }}>
            <table>
              <thead><tr><th></th><th>Título</th><th>Data</th><th>Status</th><th>Matriz</th><th>Perm.</th><th>Alcance</th><th>Engaj.</th></tr></thead>
              <tbody>
                {list.map((c: ContentWithMetric) => (
                  <tr key={c.id} className="rowlink" onClick={() => setOpenId(c.id)}>
                    <td>{cover(c)}</td>
                    <td><b>{c.title}</b><div className="muted" style={{ fontSize: 11 }}>{c.origin}{c.is_unplanned ? " · não planejada" : ""}</div></td>
                    <td>{dateBR(c.scheduled_date)}</td>
                    <td><StatusBadge s={c.status} /></td>
                    <td><MatrixPill v={c.matrix_type} /></td>
                    <td><PermPill v={c.permeability} /></td>
                    <td>{fmtInt(c.metric?.reach ?? null)}</td>
                    <td>{fmtPct(c.metric ? engagement(c.metric) : null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>
      {open && <ContentPanel item={open} onClose={() => setOpenId(null)} onReload={reload} />}
    </>
  );
}
