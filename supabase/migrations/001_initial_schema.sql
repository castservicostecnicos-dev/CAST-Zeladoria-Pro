-- ================================================================
-- Migration: 001_initial_schema.sql
-- Descrição: Esquema inicial para o Zeladoria Pro SaaS
-- Regra de Persistência: Criado com IF NOT EXISTS para segurança
-- ================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: companies (Empresas Clientes / Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    email TEXT NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    responsible_name TEXT NOT NULL,
    responsible_email TEXT NOT NULL,
    responsible_phone VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. TABELA: properties (Empreendimentos / Condomínios)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA: profiles (Perfis de Usuários com RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('DEV', 'EMPRESA', 'ZELADOR', 'ADM_PREDIAL')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone VARCHAR(30),
    cpf VARCHAR(14),
    badge_number VARCHAR(50),
    birth_date DATE,
    photo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 5. TABELA: tasks (Tarefas Operacionais)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Geral',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ACEITA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ATRASADA')),
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL DEFAULT '08:00:00',
    deadline TIMESTAMPTZ,
    location TEXT,
    notes TEXT,
    recurrence VARCHAR(50),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    completion_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 6. TABELA: task_photos (Registros Fotográficos da Execução)
CREATE TABLE IF NOT EXISTS public.task_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: task_requests (Solicitações do ADM Predial)
CREATE TABLE IF NOT EXISTS public.task_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')),
    desired_date DATE NOT NULL,
    desired_time TIME NOT NULL DEFAULT '14:00:00',
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'SOLICITADA' CHECK (status IN ('SOLICITADA', 'ANALISANDO', 'APROVADA', 'RECUSADA', 'CONVERTIDA_EM_TAREFA')),
    converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA: routines (Rotinas Periódicas Recorrentes)
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    category VARCHAR(50) DEFAULT 'Rotina',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')),
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    frequency VARCHAR(30) NOT NULL DEFAULT 'diária' CHECK (frequency IN ('diária', 'semanal', 'mensal', 'personalizada')),
    days_of_week TEXT[],
    scheduled_time TIME NOT NULL DEFAULT '08:00:00',
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA: audit_logs (Logs de Auditoria e Segurança)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA: notifications (Notificações Internas)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_status ON public.tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_date ON public.tasks(assigned_to, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_requests_company ON public.task_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_routines_company_active ON public.routines(company_id, active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current profile
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS public.profiles AS $$
    SELECT * FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies for companies:
CREATE POLICY "DEV full control of companies" ON public.companies
    FOR ALL USING ((SELECT role FROM public.get_current_profile()) = 'DEV');

CREATE POLICY "Empresa can read own company" ON public.companies
    FOR SELECT USING (id = (SELECT company_id FROM public.get_current_profile()));

-- Policies for tasks:
CREATE POLICY "Empresa can manage own company tasks" ON public.tasks
    FOR ALL USING (
        company_id = (SELECT company_id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'EMPRESA'
    );

CREATE POLICY "Zelador can view and update assigned tasks" ON public.tasks
    FOR SELECT USING (
        assigned_to = (SELECT id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'ZELADOR'
    );

CREATE POLICY "Zelador can update own task execution" ON public.tasks
    FOR UPDATE USING (
        assigned_to = (SELECT id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'ZELADOR'
    );

CREATE POLICY "ADM Predial can view property tasks" ON public.tasks
    FOR SELECT USING (
        property_id = (SELECT property_id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'ADM_PREDIAL'
    );

-- Policies for task_requests:
CREATE POLICY "ADM Predial can manage own requests" ON public.task_requests
    FOR ALL USING (
        requested_by = (SELECT id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'ADM_PREDIAL'
    );

CREATE POLICY "Empresa can process company requests" ON public.task_requests
    FOR ALL USING (
        company_id = (SELECT company_id FROM public.get_current_profile())
        AND (SELECT role FROM public.get_current_profile()) = 'EMPRESA'
    );

-- Storage bucket configuration for task-photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-photos', 'task-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-photos');

CREATE POLICY "Users can view task photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task-photos');
