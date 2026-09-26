export type UserRole = 'DEV' | 'EMPRESA' | 'ZELADOR' | 'ADM_PREDIAL';

export type UserStatus = 'Ativo' | 'Inativo';
export type CompanyStatus = 'Ativa' | 'Inativa';

export type TaskStatus = 
  | 'PENDENTE' 
  | 'ACEITA' 
  | 'EM_ANDAMENTO' 
  | 'CONCLUIDA' 
  | 'CANCELADA' 
  | 'ATRASADA';

export type TaskPriority = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export type RequestStatus = 
  | 'SOLICITADA' 
  | 'ANALISANDO' 
  | 'APROVADA' 
  | 'RECUSADA' 
  | 'CONVERTIDA_EM_TAREFA';

export type RoutineFrequency = 'diária' | 'semanal' | 'mensal' | 'personalizada';

export interface Company {
  id: string;
  legal_name: string;      // Razão social
  trade_name: string;      // Nome fantasia
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  responsible_name: string;
  responsible_email: string;
  responsible_phone: string;
  status: CompanyStatus;
  google_drive_folder_id?: string | null;
  google_drive_folder_url?: string | null;
  google_drive_folder_name?: string | null;
  google_drive_email?: string | null;
  google_drive_connected?: boolean;
  google_drive_connected_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Property {
  id: string;
  company_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  status: 'Ativo' | 'Inativo';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  company_id?: string | null;
  property_id?: string | null;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  birth_date?: string;
  photo_url?: string;
  badge_number?: string; // Matrícula/código interno
  status: UserStatus;
  notes?: string;
  password?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TaskPhoto {
  id: string;
  task_id: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  company_id: string;
  property_id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string; // profile_id of Zelador
  created_by: string;  // profile_id of creator
  requested_by?: string | null; // profile_id of ADM_PREDIAL if from request
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:mm
  deadline?: string;
  location?: string;
  notes?: string;
  recurrence?: string;
  completed_at?: string | null;
  completed_by?: string | null;
  completion_description?: string | null;
  photos?: TaskPhoto[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TaskRequest {
  id: string;
  company_id: string;
  property_id: string;
  requested_by: string; // profile_id of ADM_PREDIAL
  title: string;
  description: string;
  location: string;
  priority: TaskPriority;
  desired_date: string;
  desired_time: string;
  notes?: string;
  photos?: string[];
  status: RequestStatus;
  converted_task_id?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  company_id: string;
  property_id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  priority: TaskPriority;
  assigned_to: string; // profile_id of Zelador
  frequency: RoutineFrequency;
  days_of_week?: string[]; // ['seg', 'ter', 'qua', 'qui', 'sex']
  scheduled_time: string;
  start_date: string;
  end_date?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  company_id?: string | null;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  company_id?: string | null;
  user_id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}
