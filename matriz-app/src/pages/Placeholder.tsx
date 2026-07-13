import { Topbar, Empty } from "../ui/common";

export default function Placeholder({ title }: { title: string }) {
  return (
    <>
      <Topbar title={title} />
      <div className="view">
        <div className="panel">
          <div className="body">
            <Empty icon="🧩" title={`${title} — em construção`} hint="Esta tela entra numa próxima etapa. A base (banco, login, papéis) já está pronta." />
          </div>
        </div>
      </div>
    </>
  );
}
