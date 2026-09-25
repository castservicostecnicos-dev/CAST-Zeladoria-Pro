# Modelagem de Banco de Dados - Zeladoria Pro

Este documento descreve detalhadamente o modelo de dados relacional, tabelas, relacionamentos, permissões por Row Level Security (RLS) e regras de integridade do sistema **Zeladoria Pro**.

---

## 1. Diagrama Lógico e Entidades

O sistema foi desenhado no modelo **Multi-Tenant**, onde a tabela central de isolamento é `companies`. Cada empresa contratante gerencia seus próprios condomínios (`properties`), usuários (`profiles`), tarefas (`tasks`), rotinas (`routines`) e solicitações (`task_requests`).

```
companies (Tenants)
   ├── properties (Empreendimentos / Condomínios)
   ├── profiles (Usuários vinculados: EMPRESA, ZELADOR, ADM_PREDIAL)
   ├── tasks (Tarefas operacionais)
   │     └── task_photos (Fotos comprobatórias da execução)
   ├── routines (Rotinas periódicas recorrentes)
   ├── task_requests (Demandas enviadas pelos Síndicos / ADM Predial)
   ├── audit_logs (Trilhas de auditoria)
   └── notifications (Alertas do sistema)
```

---

## 2. Dicionário de Dados

### 2.1 `companies`
Representa as empresas parceiras e prestadoras de serviços cadastradas na plataforma.
- `id` (UUID, PK): Identificador único da empresa.
- `legal_name` (TEXT): Razão Social.
- `trade_name` (TEXT): Nome Fantasia.
- `cnpj` (VARCHAR(20), UNIQUE): Cadastro Nacional da Pessoa Jurídica.
- `email` (TEXT): E-mail corporativo.
- `phone` (VARCHAR(30)): Telefone principal ou WhatsApp.
- `address`, `city`, `state` (TEXT/VARCHAR): Endereço cadastral.
- `responsible_name`, `responsible_email`, `responsible_phone` (TEXT): Dados do gestor responsável.
- `status` (VARCHAR): `'Ativa'` ou `'Inativa'`.
- `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps de controle.
- `deleted_at` (TIMESTAMPTZ, NULL): Campo para **Soft Delete**. Registros com este campo preenchido são considerados inativos sem perder dados históricos.

### 2.2 `properties`
Condomínios ou edifícios atendidos pela empresa de zeladoria.
- `id` (UUID, PK)
- `company_id` (UUID, FK -> companies.id)
- `name` (TEXT): Nome do condomínio (ex: Edifício Horizonte Azul).
- `address`, `city`, `state` (TEXT)
- `status` (VARCHAR): `'Ativo'` ou `'Inativo'`.

### 2.3 `profiles`
Contas de usuários que acessam o sistema com papéis bem definidos (RBAC).
- `id` (UUID, PK)
- `auth_user_id` (UUID, FK -> auth.users.id, UNIQUE): Vínculo com a autenticação Supabase Auth.
- `company_id` (UUID, FK -> companies.id, NULL para DEV).
- `property_id` (UUID, FK -> properties.id, NULL para EMPRESA/DEV, preenchido para ADM_PREDIAL).
- `role` (VARCHAR): `'DEV'`, `'EMPRESA'`, `'ZELADOR'`, `'ADM_PREDIAL'`.
- `name` (TEXT): Nome completo.
- `email` (TEXT): E-mail de login.
- `phone` (VARCHAR(30)): Telefone.
- `cpf` (VARCHAR(14)): CPF do usuário.
- `badge_number` (VARCHAR(50)): Matrícula ou código interno (usado para Zeladores).
- `birth_date` (DATE): Data de nascimento.
- `photo_url` (TEXT): Foto de perfil opcional.
- `status` (VARCHAR): `'Ativo'` ou `'Inativo'`.
- `deleted_at` (TIMESTAMPTZ, NULL): Soft Delete.

### 2.4 `tasks`
Tarefas operacionais de limpeza, manutenção e zeladoria.
- `id` (UUID, PK)
- `company_id` (UUID, FK -> companies.id)
- `property_id` (UUID, FK -> properties.id)
- `title` (TEXT): Título sucinto da tarefa.
- `description` (TEXT): Instruções de execução.
- `category` (VARCHAR): Categoria (Limpeza, Manutenção, Portaria, etc.).
- `priority` (VARCHAR): `'BAIXA'`, `'NORMAL'`, `'ALTA'`, `'URGENTE'`.
- `status` (VARCHAR): `'PENDENTE'`, `'ACEITA'`, `'EM_ANDAMENTO'`, `'CONCLUIDA'`, `'CANCELADA'`, `'ATRASADA'`.
- `assigned_to` (UUID, FK -> profiles.id): Zelador responsável.
- `created_by` (UUID, FK -> profiles.id): Quem agendou.
- `requested_by` (UUID, FK -> profiles.id, Opcional): Síndico que solicitou.
- `scheduled_date` (DATE): Data prevista.
- `scheduled_time` (TIME): Horário previsto.
- `completed_at` (TIMESTAMPTZ, NULL): Momento exato em que o zelador concluiu o serviço.
- `completion_description` (TEXT, NULL): Descrição obrigatória feita pelo zelador ao concluir.
- `deleted_at` (TIMESTAMPTZ, NULL): Soft Delete.

### 2.5 `task_photos`
Comprovantes fotográficos anexados às tarefas concluídas.
- `id` (UUID, PK)
- `task_id` (UUID, FK -> tasks.id)
- `storage_path` (TEXT): URL ou chave no Supabase Storage.
- `uploaded_by` (UUID, FK -> profiles.id)
- `created_at` (TIMESTAMPTZ)

### 2.6 `task_requests`
Demandas abertas pelos síndicos / ADM Predial que dependem de aprovação da empresa.
- `id` (UUID, PK)
- `company_id` (UUID, FK -> companies.id)
- `property_id` (UUID, FK -> properties.id)
- `requested_by` (UUID, FK -> profiles.id)
- `title`, `description`, `location` (TEXT)
- `priority` (VARCHAR): Prioridade sugerida.
- `desired_date`, `desired_time` (DATE, TIME): Data e hora desejadas.
- `status` (VARCHAR): `'SOLICITADA'`, `'ANALISANDO'`, `'APROVADA'`, `'RECUSADA'`, `'CONVERTIDA_EM_TAREFA'`.
- `converted_task_id` (UUID, FK -> tasks.id, NULL)
- `rejection_reason` (TEXT, NULL): Motivo da recusa caso não seja aprovada.

### 2.7 `routines`
Modelos de rotinas recorrentes (diárias, semanais, mensais) para geração periódica de tarefas.
- `id` (UUID, PK)
- `company_id` (UUID, FK -> companies.id)
- `property_id` (UUID, FK -> properties.id)
- `name`, `description`, `location` (TEXT)
- `assigned_to` (UUID, FK -> profiles.id)
- `frequency` (VARCHAR): `'diária'`, `'semanal'`, `'mensal'`, `'personalizada'`.
- `days_of_week` (TEXT[])
- `scheduled_time` (TIME)
- `start_date` (DATE)
- `active` (BOOLEAN): Liga / desliga geração automática.

---

## 3. Segurança e Políticas de Acesso (RLS)

O banco de dados possui **Row Level Security (RLS)** ativo em todas as tabelas:
- **DEV:** Acesso irrestrito a `companies` para fins de cobrança e cadastro, mas isolado de operações internas das empresas para garantir sigilo.
- **EMPRESA:** Acesso total aos dados de sua respectiva `company_id`.
- **ZELADOR:** Acesso exclusivo para ler suas próprias tarefas atribuídas (`assigned_to`) e atualizar o status (`ACEITA`, `EM_ANDAMENTO`, `CONCLUIDA`). Uma vez concluída, a tarefa é bloqueada contra alterações.
- **ADM PREDIAL:** Acesso estritamente restrito às tarefas de seu condomínio (`property_id`) e às solicitações criadas por ele.
