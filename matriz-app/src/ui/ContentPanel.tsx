import { useState } from "react";
import { useAuth } from "../lib/auth";
import { ContentWithMetric, decide, updateContent, Status, STATUS_LABEL, STATUS_ORDER } from "../lib/db";
import { MatrixPill, PermPill, StatusBadge, dateBR } from "./common";
import { interactions, engagement, retention, repetition, fmtInt, fmtPct, fmtNum } from "../lib/metrics";

const SLOTS = ["10h", "12h", "14h", "18h", "20h", "22h"];

export default function ContentPanel({
  item,
  onClose,
  onReload,
}: {
  item: ContentWithMetric;
  onClose: () => void;
  onReload: () => void;
}) {
  const { isEditor } = useAuth();
  const [tab, setTab] = useState(isEditor ? "resumo" : "aprovacao");
  const [busy, setBusy] = useState(false);

  async function save(patch: Record<string, any>) {
    setBusy(true);
    try {
      await updateContent(item.id, patch);
      onReload();
    } catch (e: any) {
      alert("Não foi possível salvar: " + e.message);
    } finally {
      setBusy(false);
    }
  }
  async function runDecide(d: "aprovado" | "reprovado") {
    let motivo: string | undefined;
    if (d === "reprovado") motivo = window.prompt("Motivo da reprovação (opcional):") || undefined;
    setBusy(true);
    try {
      await decide(item.id, d, motivo);
      onReload();
      onClose();
    } catch (e: any) {
      alert("Não foi possível registrar: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="cardpanel">
        <div className="cp-head">
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <MatrixPill v={item.matrix_type} />
            <PermPill v={item.permeability} />
            <StatusBadge s={item.status} />
            <span className="spacer" />
            {busy && <span className="muted" style={{ fontSize: 11 }}>salvando…</span>}
            <button className="btn ghost" style={{ padding: "5px 10px" }} onClick={onClose}>✕</button>
          </div>
          {isEditor ? (
            <input
              style={{ fontSize: 17, fontWeight: 600, border: "none", width: "100%", outline: "none", fontFamily: "Georgia, serif", background: "transparent" }}
              defaultValue={item.title}
              onBlur={(e) => e.target.value !== item.title && save({ title: e.target.value })}
            />
          ) : (
            <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "Georgia, serif" }}>{item.title}</div>
          )}
        </div>

        <div className="cp-tabs">
          {(isEditor
            ? [["resumo", "Resumo"], ["estrategia", "Estratégia"], ["producao", "Produção"], ["publicacao", "Publicação"], ["metricas", "Métricas"]]
            : [["aprovacao", "Aprovação"], ["metricas", "Métricas"]]
          ).map(([k, l]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="cp-body">{isEditor ? editorTab() : approverTab()}</div>

        {!isEditor && item.status === "aguardando_aprovacao" && (
          <div className="approvebar">
            <button className="btn green" style={{ flex: 1 }} disabled={busy} onClick={() => runDecide("aprovado")}>✓ Aprovar</button>
            <button className="btn red" style={{ flex: 1 }} disabled={busy} onClick={() => runDecide("reprovado")}>✕ Reprovar</button>
          </div>
        )}
        {isEditor && (item.status === "ideia" || item.status === "em_producao") && (
          <div className="approvebar">
            <button className="btn gold" onClick={() => save({ status: "aguardando_aprovacao" })}>Enviar para aprovação do César</button>
          </div>
        )}
        {isEditor && item.status === "aprovado" && (
          <div className="approvebar">
            <button className="btn" onClick={() => save({ status: "agendado" })}>Agendar publicação</button>
            <span className="muted" style={{ fontSize: 11, alignSelf: "center" }}>Aprovado ≠ publicado.</span>
          </div>
        )}
      </aside>
    </>
  );

  function field(label: string, key: keyof typeof item, type = "text") {
    return (
      <div className="field">
        <label>{label}</label>
        <input type={type} defaultValue={(item[key] as string) ?? ""} onBlur={(e) => e.target.value !== (item[key] ?? "") && save({ [key]: e.target.value || null })} />
      </div>
    );
  }
  function area(label: string, key: keyof typeof item) {
    return (
      <div className="field">
        <label>{label}</label>
        <textarea defaultValue={(item[key] as string) ?? ""} onBlur={(e) => e.target.value !== (item[key] ?? "") && save({ [key]: e.target.value || null })} />
      </div>
    );
  }
  function select(label: string, key: keyof typeof item, opts: [string, string][], allowEmpty = false) {
    return (
      <div className="field">
        <label>{label}</label>
        <select defaultValue={(item[key] as string) ?? ""} onChange={(e) => save({ [key]: e.target.value || null })}>
          {allowEmpty && <option value="">— selecionar —</option>}
          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    );
  }

  function editorTab() {
    if (tab === "resumo")
      return (
        <>
          {select("Status", "status", STATUS_ORDER.map((s) => [s, STATUS_LABEL[s]] as [string, string]))}
          <div className="two">{field("Data", "scheduled_date", "date")}{select("Horário", "scheduled_time", SLOTS.map((s) => [s, s]), true)}</div>
          {area("Descrição", "caption")}
          <div className="note">Mesmo registro em todas as telas. Só você (editora) edita.</div>
        </>
      );
    if (tab === "estrategia")
      return (
        <>
          <div className="two">
            {select("Modelagem", "matrix_type", [["hero", "Hero"], ["hub", "Hub"], ["help", "Help"]], true)}
            {select("Permeabilidade", "permeability", [["aderencia", "Aderência"], ["profundidade", "Profundidade"]], true)}
          </div>
          <div className="two">{field("Público", "audience")}{field("Objetivo", "objective")}</div>
          {area("CTA", "cta")}
        </>
      );
    if (tab === "producao")
      return (
        <>
          {area("Gancho", "hook")}
          {area("Roteiro", "script")}
          {area("Legenda completa", "caption")}
          {field("Palavras-chave", "keywords")}
          <div className="two">{field("Convidados", "guests")}{field("Colaboradores", "collaborators")}</div>
          <div className="note">Upload de arte/vídeo entra na próxima etapa (storage já criado).</div>
        </>
      );
    if (tab === "publicacao")
      return (
        <>
          {field("Link no Instagram", "permalink")}
          {field("Link no Facebook (opcional)", "facebook_link")}
          {field("ID da mídia (IG)", "external_media_id")}
          <div className="note">Importação e vínculo automático virão com a integração (Fase 4).</div>
        </>
      );
    return metricsTab();
  }

  function metricsTab() {
    const m = item.metric;
    if (!m) return <p className="muted">Sem métricas ainda. Ao publicar/importar, o app grava os snapshots.</p>;
    const cell = (n: number | null, l: string) => (
      <div className="m"><div className="n">{fmtInt(n)}</div><div className="l">{l}</div></div>
    );
    return (
      <>
        <div className="metricbox">
          {cell(m.views, "Views")}{cell(m.reach, "Alcance")}{cell(m.likes, "Curtidas")}{cell(m.comments, "Coment.")}
          {cell(m.shares, "Compart.")}{cell(m.saves, "Salvam.")}{cell(m.profile_visits, "Visitas perfil")}{cell(m.followers_generated, "Seg. gerados")}
          <div className="m" style={{ background: "#faf6ea", borderColor: "#ecdcae" }}><div className="n">{fmtInt(interactions(m))}</div><div className="l">Interações</div></div>
          <div className="m" style={{ background: "#faf6ea", borderColor: "#ecdcae" }}><div className="n">{fmtPct(engagement(m))}</div><div className="l">Engajamento</div></div>
        </div>
        {(item.status === "publicado") && retention(m) != null && (
          <div className="note" style={{ marginTop: 12 }}>Retenção média {fmtPct(retention(m), 1)} · repetição {fmtNum(repetition(m))}×</div>
        )}
      </>
    );
  }

  function approverTab() {
    return (
      <>
        <div style={{ width: "100%", height: 180, borderRadius: 10, background: "linear-gradient(135deg,#c9377e,#2c2c31)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40, marginBottom: 12 }}>◆</div>
        <div className="field"><label>Legenda</label><div style={{ fontSize: 13 }}>{item.caption || "—"}</div></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--linha)" }}><span className="muted">Data</span><b>{dateBR(item.scheduled_date)}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--linha)" }}><span className="muted">Horário</span><b>{item.scheduled_time || "—"}</b></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--linha)" }}><span className="muted">CTA</span><b>{item.cta || "—"}</b></div>
        {item.status === "aguardando_aprovacao" ? (
          <div className="note" style={{ marginTop: 12 }}>Aprove ou reprove abaixo. Para pedir ajustes, fale com a Karina pelo WhatsApp.</div>
        ) : (
          <div className="note" style={{ marginTop: 12 }}>Status atual: {STATUS_LABEL[item.status]}.</div>
        )}
      </>
    );
  }
}
