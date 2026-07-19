import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV_EDITOR = [
  ["/", "◈", "Início"],
  ["/calendario", "▦", "Calendário"],
  ["/quadro", "▤", "Quadro"],
  ["/matriz", "◪", "Matriz"],
  ["/conteudos", "☰", "Conteúdos"],
  ["/importadas", "⤓", "Importados IG"],
  ["/metricas", "▲", "Métricas"],
  ["/relatorio", "▥", "Relatório"],
  ["/integracoes", "⇄", "Integrações"],
  ["/config", "⚙", "Configurações"],
];
const NAV_APPROVER = [
  ["/", "◈", "Início"],
  ["/quadro", "▤", "Aprovações"],
  ["/conteudos", "☰", "Publicados"],
  ["/metricas", "▲", "Métricas"],
];

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, isEditor, signOut } = useAuth();
  const items = isEditor ? NAV_EDITOR : NAV_APPROVER;

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="pin">◆ PIRACICABA</div>
          <h1>Matriz em Destaque</h1>
          <small>Planejamento &amp; Análise</small>
        </div>
        <nav className="nav">
          {items.map(([to, ic, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="ic">{ic}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <b>{profile?.name}</b>
          <span>{profile?.email}</span>
          <div>
            <span className={"roletag " + (isEditor ? "editor" : "approver")}>
              {isEditor ? "EDITORA" : "APROVADOR"}
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              className="btn ghost"
              style={{ padding: "5px 9px", fontSize: 11, color: "#ccc", borderColor: "#3a3a41", background: "transparent" }}
              onClick={signOut}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
