# Matriz em Destaque — aplicativo (produção)

App React + TypeScript que fala direto com o Supabase (login, dados e segurança RLS).
Sem dados fictícios: o painel começa vazio e só mostra dados reais.

## O que já funciona nesta primeira versão

- **Login real** (Supabase Auth) para Karina e César.
- **Papéis travados no banco**: Karina edita tudo; César só visualiza, aprova ou reprova.
- **Início** (painel do dia / fila de aprovação), **Conteúdos** (lista + cartão em abas), **Quadro** (Kanban), **Métricas** (4 seções com as fórmulas corretas), **Integrações** (tela, conexão real vem depois).
- **Cartão de conteúdo** com abas (Resumo, Estratégia, Produção, Publicação, Métricas), salvamento automático.
- **Estados vazios** de verdade — nada de números de demonstração.

Calendário, Matriz e Importados aparecem como “em construção” e entram nas próximas etapas.

## Rodar no seu computador (opcional, para testar)

1. Instale o Node.js (nodejs.org).
2. Nesta pasta, crie um arquivo `.env` copiando o `.env.example` (a URL e a chave já vêm preenchidas).
3. No terminal, dentro da pasta:
   ```
   npm install
   npm run dev
   ```
4. Abra o endereço que aparecer (ex.: http://localhost:5173) e entre com seu e-mail/senha.

## Publicar no Cloudflare Pages (grátis)

1. Suba esta pasta para um repositório no **GitHub**.
2. No **Cloudflare Pages** → *Create* → *Pages* → conecte o repositório.
3. Configurações de build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Variáveis de ambiente:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (os mesmos valores do `.env`).
4. Publicar. O Cloudflare dá um endereço `https://...pages.dev` com HTTPS.

> Importante para navegação (SPA): nas configurações do projeto no Cloudflare Pages,
> adicione um redirecionamento de todas as rotas para `/index.html` (o arquivo `public/_redirects` já faz isso).

## Segurança

- A chave usada no navegador é a **pública (publishable)** — segura, porque a segurança real está nas políticas RLS do banco.
- O César não consegue criar, editar ou excluir mesmo tentando: o banco recusa. A única ação dele é `approve_content` (aprovar/reprovar).
