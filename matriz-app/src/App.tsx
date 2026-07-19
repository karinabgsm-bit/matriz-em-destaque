import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./ui/Layout";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import Conteudos from "./pages/Conteudos";
import Quadro from "./pages/Quadro";
import Metricas from "./pages/Metricas";
import Integracoes from "./pages/Integracoes";
import Calendario from "./pages/Calendario";
import Matriz from "./pages/Matriz";
import Relatorio from "./pages/Relatorio";
import Placeholder from "./pages/Placeholder";

export default function App() {
  const { loading, userId, profile } = useAuth();

  if (loading) return <div className="center">Carregando…</div>;
  if (!userId) return <Login />;
  if (!profile)
    return (
      <div className="center">
        Sua conta ainda não tem um perfil definido. Peça à Karina para configurar seu papel.
      </div>
    );

  const editor = profile.role === "editor";

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/conteudos" element={<Conteudos />} />
        <Route path="/quadro" element={<Quadro />} />
        <Route path="/metricas" element={<Metricas />} />
        {editor && <Route path="/calendario" element={<Calendario />} />}
        {editor && <Route path="/matriz" element={<Matriz />} />}
        {editor && <Route path="/relatorio" element={<Relatorio />} />}
        {editor && <Route path="/importadas" element={<Placeholder title="Importados do Instagram" />} />}
        {editor && <Route path="/integracoes" element={<Integracoes />} />}
        {editor && <Route path="/config" element={<Placeholder title="Configurações" />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
