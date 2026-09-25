# Guia de Deploy no Render (Static Site)

Este guia explica como realizar o deploy do **Zeladoria Pro** no **Render** no formato **Static Site**.

---

## 1. Configurações no Render

1. Acesse o painel do [Render](https://dashboard.render.com/) e clique em **New +** > **Static Site**.
2. Conecte seu repositório Git.
3. Configure os seguintes campos:
   * **Name:** `zeladoria-pro` (ou o nome de sua preferência)
   * **Branch:** `main` (ou a branch principal)
   * **Root Directory:** (deixe em branco para raiz do projeto)
   * **Build Command:** `npm run build`
   * **Publish Directory:** `dist`

---

## 2. Redirecionamento SPA (Single Page Application)

O repositório já inclui os arquivos automáticos:
* `render.yaml`: define a rota de rewrite de `/*` para `/index.html`.
* `public/_redirects`: regra estática padrão com `/*    /index.html   200`.

Isso garante que ao recarregar a página em qualquer rota interna (como `/login`, `/perfil`, `/tarefas`), a aplicação carregará normalmente sem retornar erro 404.

---

## 3. Banco de Dados e Armazenamento

* **Banco de Dados:** A persistência e dados operacionais utilizam o Firebase Firestore integrado (`ai-studio-pdftoappconverte-...`).
* **Cache Offline:** IndexedDB e LocalStorage otimizados para modo offline.
* **Armazenamento de Fotos e PDFs:** Integração nativa com o **Google Drive** para salvar comprovantes fotográficos e relatórios fora do código e do servidor local.
* **Nenhum secret ou banco do Supabase é necessário.**
