# Zeladoria Pro - Sistema de Gestão de Zeladoria Predial

**Zeladoria Pro** é uma plataforma SaaS multi-tenant desenvolvida para empresas de facilities, conservação e zeladoria predial. O sistema conecta empresas prestadoras de serviço, equipes operacionais de zeladoria e administradores prediais (síndicos) em um fluxo de trabalho ágil, auditável e em tempo real.

O banco de dados é **totalmente independente do código**, gerenciado via **Google Firebase Firestore**, garantindo persistência em nuvem, segurança e disponibilidade.

---

## 🌟 Principais Funcionalidades

### 1. Níveis de Acesso (RBAC)
- 🛡️ **DEV (Administrador Global):** Cadastro e monitoramento de empresas clientes (tenants), controle de ativação/desativação, exclusão lógica (soft delete) e modo demonstração guiado.
- 🏢 **EMPRESA (Gestão Operacional):** Painel gerencial com métricas em tempo real, gestão de tarefas com filtros avançados, agendador de rotinas recorrentes, triagem de solicitações prediais, cadastro de zeladores/síndicos e relatórios com exportação CSV.
- 🧹 **ZELADOR (Execução em Campo - Mobile First):** Interface otimizada para smartphones com visualização imediata ("O que preciso fazer hoje"), máquina de estados (*Pendente → Aceita → Em Andamento → Concluída*), envio de fotos comprobatórias com a câmera e bloqueio de edição pós-conclusão.
- 🏢 **ADM PREDIAL (Síndico):** Acompanhamento transparente das tarefas realizadas no condomínio e botão rápido para abrir novas solicitações com fotos e data desejada.

### 2. PWA (Progressive Web App)
- Totalmente instalável no smartphone ou desktop (iOS, Android, Chrome, Edge).
- Cache offline com detecção de perda de conexão de internet.
- Design responsivo e adaptativo com Tailwind CSS.

### 3. Integração com Firebase Firestore
- **Banco de Dados em Nuvem:** Firestore provisionado com coleções para `companies`, `properties`, `profiles`, `tasks`, `task_requests`, `routines`, `audit_logs` e `notifications`.
- **Regras de Segurança (`firestore.rules`):** Regras implantadas para controle de acesso.
- **Blueprint dos Dados (`firebase-blueprint.json`):** Esquema estruturado e documentado.
- **Modo Demonstração Instantâneo:** Possibilita alternância em 1 clique entre os 4 papéis com dados pré-carregados.

---

## 🚀 Contas de Demonstração

Na tela inicial do sistema, você pode alternar instantaneamente entre os 4 perfis de teste ou usar as credenciais:

| Perfil | E-mail de Teste | Senha Padrão | Descrição |
|---|---|---|---|
| **DEV** | `dev@demo.com` | `123456` | Painel do dono do SaaS / cadastro de empresas |
| **EMPRESA** | `empresa@demo.com` | `123456` | Gestão de tarefas, rotinas, zeladores e relatórios |
| **ZELADOR** | `zelador@demo.com` | `123456` | Interface móvel para o zelador em campo |
| **ADM PREDIAL** | `adm@demo.com` | `123456` | Painel do síndico / acompanhamento do prédio |

---

## 💻 Como Rodar Localmente

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no seu navegador.

3. **Compilar para produção:**
   ```bash
   npm run build
   ```

---

## 📁 Estrutura do Projeto

```
src/
  ├── components/
  │     ├── layout/         # Header, Sidebar com menu por papel
  │     └── ui/             # Badges, Modais, Toasts, PWA Install Button
  ├── contexts/
  │     └── AuthContext.tsx # Sessão e autenticação integrada ao Firebase
  ├── hooks/
  │     └── usePWA.ts       # Hook para instalação PWA e status de conexão
  ├── lib/
  │     └── firebase.ts     # Inicialização do Firebase App, Firestore e Auth
  ├── pages/
  │     ├── auth/           # Login e recuperação de senha
  │     ├── dev/            # Dashboard DEV (gestão de empresas)
  │     ├── empresa/        # Dashboard Empresa (tarefas, rotinas, zeladores)
  │     ├── zelador/        # Dashboard Zelador (mobile-first)
  │     ├── adm_predial/    # Dashboard Síndico (solicitações)
  │     ├── demo/           # Demonstração guiada com 4 cards
  │     └── profile/        # Meu Perfil e troca de senha
  ├── services/
  │     ├── mockData.ts     # Dados base para inicialização
  │     └── store.ts        # Camada unificada com Firebase Firestore
  ├── types/
  │     └── index.ts        # Tipos TypeScript do domínio
  ├── App.tsx               # Roteamento baseado em RBAC
  └── main.tsx              # Ponto de entrada React 19
```
