import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/useContent";
import { decide, Status, STATUS_LABEL } from "../lib/db";
import { Topbar, MatrixPill, PermPill, FormatBadge } from "../ui/common";
import ContentPanel from "../ui/ContentPanel";

const EDITOR_COLS: Status[] = ["ideia", "em_producao", "aguardando_aprovacao", "aprovado", "reprovado", "agendado", "publicado", "arquivado"];
const APPROVER_COLS: Status[] = ["aguardando_aprovacao", "aprovado", "reprovado", "publicado"];

export default function Quadro() {
  const { isEditor } = useAuth();
  const { items, loading, reload } = useContent();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((c) => c.id === openId) || null;
  const cols = isEditor ? EDITOR_COLS : APPROVER_COLS;

  async function quickDecide(id: string, d: "aprovado" | "reprovado", e: React.MouseEvent) {
    e.stopPropagation();
    let motivo: string | undefined;
    if (d === "reprovado") motivo = window.prompt("Motivo da reprovação (opcional):") || undefined;
    try {
      await decide(id, d, motivo);
      await reload();
    } catch (err: any) {
      alert("Não foi possível registrar: " + err.message);
    }
  }

  return (
    <>
      <Topbar title={isEditor ? "Quadro" : "Aprovações"} />
      <div className="view">
        {loading ? (
          <p className="muted">Carregando…</p>
        ) : (
          <div className="kanban">
            {cols.map((st) => {
              const list = items.filter((c) => c.status === st);
              return (
                <div className="col" key={st}>
                  <h4>{STATUS_LABEL[st]}<span>{list.length}</span></h4>
                  <div className="list">
                    {list.map((c) => (
                      <div key={c.id} className="kcard" onClick={() => setOpenId(c.id)}>
                        <div className="kt">{c.title}</div>
                        <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}><MatrixPill v={c.matrix_type} /><PermPill v={c.permeability} /><FormatBadge v={c.format} /></div>
                        <div className="foot"><span className="muted">{c.origin}</span><span>{c.scheduled_date ? c.scheduled_date.split("-").reverse().join("/") : "sem data"}</span></div>
                        {!isEditor && st === "aguardando_aprovacao" && (
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            <button className="btn green" style={{ padding: "4px 9px", fontSize: 11, flex: 1 }} onClick={(e) => quickDecide(c.id, "aprovado", e)}>✓ Aprovar</button>
                            <button className="btn red" style={{ padding: "4px 9px", fontSize: 11, flex: 1 }} onClick={(e) => quickDecide(c.id, "reprovado", e)}>✕ Reprovar</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="muted" style={{ marginTop: 10 }}>
          {isEditor ? "Abra um cartão para mudar o status. Só você movimenta os conteúdos." : "Aprove ou reprove os cartões em “Aguardando aprovação”."}
        </p>
      </div>
      {open && <ContentPanel item={open} onClose={() => setOpenId(null)} onReload={reload} />}
    </>
  );
}
