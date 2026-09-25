# Guia de Deploy e Produção - Zeladoria Pro

Este documento detalha o processo passo a passo para colocar a aplicação **Zeladoria Pro** em produção utilizando **Render.com** (Static Site) e **Supabase** (PostgreSQL + Auth + Storage).

---

## 1. Arquitetura em Produção

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Hospedagem Frontend:** [Render.com](https://render.com) (Static Site)
- **Banco de Dados & Autenticação:** [Supabase](https://supabase.com) (PostgreSQL gerenciado, Row Level Security, Supabase Auth e Supabase Storage)
- **Persistência:** PWA com suporte offline e sincronização em nuvem.

---

## 2. Configuração do Supabase

### 2.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Defina uma senha forte para o banco de dados e selecione a região mais próxima (ex: `sa-east-1` / São Paulo).

### 2.2 Executar o Esquema do Banco
1. No painel do Supabase, acesse **SQL Editor**.
2. Abra e execute o script localizado em:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. O script criará:
   - Todas as tabelas com integridade referencial (`companies`, `properties`, `profiles`, `tasks`, `task_photos`, `task_requests`, `routines`, `audit_logs`, `notifications`);
   - Índices para alto desempenho em queries por empresa, data e status;
   - Regras de Row Level Security (RLS) que isolam os dados entre empresas (multi-tenant);
   - Bucket no Supabase Storage chamado `task-photos` com políticas de leitura e gravação para anexos de fotos.

### 2.3 Obter Credenciais
No painel do Supabase, vá em **Project Settings > API** e copie:
- `Project URL` (ex: `https://xyzcompany.supabase.co`)
- `Project API anon key` (chave pública para uso no cliente)

---

## 3. Deploy no Render.com (Static Site)

### 3.1 Criar Novo Serviço no Render
1. Acesse [dashboard.render.com](https://dashboard.render.com).
2. Clique em **New +** e selecione **Static Site**.
3. Conecte o repositório Git do projeto.

### 3.2 Configurações de Build
- **Name:** `zeladoria-pro`
- **Branch:** `main` (ou sua branch de release)
- **Build Command:**
  ```bash
  npm run build
  ```
- **Publish Directory:**
  ```bash
  dist
  ```

### 3.3 Variáveis de Ambiente no Render
Na aba **Environment** do serviço no Render, adicione:

| Chave | Valor Exemplo | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | URL da sua instância Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Chave pública anônima do Supabase |

> **Nota:** Caso essas variáveis não sejam configuradas, o sistema entrará automaticamente em **Modo Demonstração (Demo)** com persistência local (`localStorage`), permitindo testes completos e demonstrações a clientes sem falhas.

### 3.4 Regra de Redirecionamento SPA (Single Page Application)
No painel do Render, vá em **Redirects/Rewrites**:
- **Type:** `Rewrite`
- **Source:** `/*`
- **Destination:** `/index.html`

*Esta regra é essencial para que a navegação do cliente e URLs diretas funcionem sem erro 404.*

---

## 4. Diretrizes de Persistência e Atualizações Seguras (Seção 51.29)

Ao atualizar o sistema em produção, siga estas boas práticas:
1. **Migrations Idempotentes:** Todas as alterações de banco em `supabase/migrations/` utilizam `IF NOT EXISTS` ou `ALTER TABLE ADD COLUMN IF NOT EXISTS` para nunca apagar dados existentes.
2. **Soft Delete Ativo:** Empresas, usuários e tarefas utilizam a coluna `deleted_at`. Nunca execute `DROP TABLE` ou `DELETE` destrutivo em produção.
3. **Auditoria de Ações:** Toda ação relevante gera registro na tabela `audit_logs`.
4. **Deploy Zero-Downtime:** Por ser hospedado em CDN através do Render, as atualizações do frontend entram no ar de forma atômica após o término do build.

---

## 5. Verificação Pós-Deploy

1. Acesse a URL fornecida pelo Render (ex: `https://zeladoria-pro.onrender.com`).
2. Teste o acesso através dos 4 perfis demonstrativos na tela inicial.
3. Verifique o registro do Service Worker e o botão de instalação PWA.
4. Execute o fluxo de conclusão de uma tarefa com foto e certifique-se da gravação no histórico.
