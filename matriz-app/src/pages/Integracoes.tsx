import { Topbar } from "../ui/common";

export default function Integracoes() {
  return (
    <>
      <Topbar title="Integrações" />
      <div className="view">
        <div className="panel" style={{ maxWidth: 640 }}>
          <h3>Instagram · API oficial da Meta</h3>
          <div className="body">
            <div className="alert warn">Ainda não conectado. A conexão real (OAuth oficial da Meta) entra na próxima etapa, depois do App Review. Login no app e conexão com o Instagram são coisas diferentes.</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--linha)" }}><span className="muted">Conta conectada</span><span className="muted">nenhuma</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--linha)" }}><span className="muted">Status da conexão</span><span className="muted">desconectado</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--linha)" }}><span className="muted">Última sincronização</span><span className="muted">—</span></div>
            <button className="btn gold" style={{ marginTop: 14 }} disabled>Conectar Instagram (em breve)</button>
            <div className="note" style={{ marginTop: 16 }}>
              Ao conectar, o sistema importará publicações, mídia, legenda, formato, data, link, ID da mídia, curtidas, comentários, alcance, visualizações, compartilhamentos, salvamentos e demais Insights disponíveis; atualizará as métricas e guardará snapshots. Métrica que a API não fornecer aparece como “Não disponível” — nunca como zero.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
