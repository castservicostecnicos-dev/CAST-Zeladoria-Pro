import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Inbox, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Users, 
  Repeat, 
  Building2, 
  Play, 
  Trash2, 
  Edit3, 
  Eye, 
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  TrendingUp,
  Sparkles,
  UserPlus,
  FileText
} from 'lucide-react';
import { 
  Task, 
  Routine, 
  TaskRequest, 
  Profile, 
  Property, 
  TaskPriority, 
  TaskStatus, 
  RequestStatus,
  RoutineFrequency
} from '../../types';
import { DataStore } from '../../services/store';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { DailyReportManager } from '../../components/reports/DailyReportManager';

interface EmpresaDashboardProps {
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const EmpresaDashboard: React.FC<EmpresaDashboardProps> = ({ 
  activeSubTab = 'dashboard', 
  onSelectSubTab 
}) => {
  const { user, company } = useAuth();

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [zeladores, setZeladores] = useState<Profile[]>([]);
  const [adms, setAdms] = useState<Profile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  // Task Filter state
  const [searchTask, setSearchTask] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');
  const [zeladorFilter, setZeladorFilter] = useState<string>('todos');

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalType, setUserModalType] = useState<'ZELADOR' | 'ADM_PREDIAL'>('ZELADOR');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showProcessRequestModal, setShowProcessRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TaskRequest | null>(null);
  const [requestDecision, setRequestDecision] = useState<'APROVADA' | 'RECUSADA'>('APROVADA');
  const [assignZeladorForRequest, setAssignZeladorForRequest] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'task' | 'user' | 'routine'; id: string; name: string } | null>(null);

  // Forms
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    property_id: '',
    category: 'Limpeza',
    priority: 'NORMAL' as TaskPriority,
    assigned_to: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '08:00',
    deadline: '',
    location: '',
    notes: '',
  });

  const [routineForm, setRoutineForm] = useState({
    name: '',
    description: '',
    location: '',
    category: 'Limpeza',
    priority: 'NORMAL' as TaskPriority,
    assigned_to: '',
    property_id: '',
    frequency: 'diária' as RoutineFrequency,
    scheduled_time: '08:00',
    start_date: new Date().toISOString().split('T')[0],
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    badge_number: '',
    birth_date: '',
    property_id: '',
    notes: '',
  });

  const loadAll = async () => {
    if (!user || !user.company_id) return;
    const cid = user.company_id;

    const [tList, rList, reqList, zList, aList, pList] = await Promise.all([
      DataStore.getTasks(user),
      DataStore.getRoutines(cid),
      DataStore.getRequests(cid),
      DataStore.getProfiles(cid, 'ZELADOR'),
      DataStore.getProfiles(cid, 'ADM_PREDIAL'),
      DataStore.getProperties(cid),
    ]);

    setTasks(tList);
    setRoutines(rList);
    setRequests(reqList);
    setZeladores(zList);
    setAdms(aList);
    setProperties(pList);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  // Metrics (Section 11)
  const todayStr = new Date().toISOString().split('T')[0];
  const tasksToday = tasks.filter(t => t.scheduled_date === todayStr);
  const tasksPending = tasks.filter(t => t.status === 'PENDENTE' || t.status === 'ACEITA');
  const tasksInProgress = tasks.filter(t => t.status === 'EM_ANDAMENTO');
  const tasksCompleted = tasks.filter(t => t.status === 'CONCLUIDA');
  const tasksDelayed = tasks.filter(t => t.status === 'ATRASADA');
  const pendingRequests = requests.filter(r => r.status === 'SOLICITADA' || r.status === 'ANALISANDO');

  const completionRate = tasks.length > 0 ? Math.round((tasksCompleted.length / tasks.length) * 100) : 0;

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch = 
      t.title.toLowerCase().includes(searchTask.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTask.toLowerCase()) ||
      (t.location && t.location.toLowerCase().includes(searchTask.toLowerCase()));
    if (!matchSearch) return false;
    if (statusFilter !== 'todos' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'todos' && t.priority !== priorityFilter) return false;
    if (zeladorFilter !== 'todos' && t.assigned_to !== zeladorFilter) return false;
    return true;
  });

  // Task Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.company_id) return;
    if (!taskForm.assigned_to) {
      alert('Selecione um zelador responsável.');
      return;
    }

    await DataStore.createTask({
      company_id: user.company_id,
      property_id: taskForm.property_id || (properties[0]?.id || ''),
      title: taskForm.title,
      description: taskForm.description,
      category: taskForm.category,
      priority: taskForm.priority,
      assigned_to: taskForm.assigned_to,
      created_by: user.id,
      scheduled_date: taskForm.scheduled_date,
      scheduled_time: taskForm.scheduled_time,
      deadline: taskForm.deadline || undefined,
      location: taskForm.location,
      notes: taskForm.notes,
    }, user);

    setShowTaskModal(false);
    setTaskForm({
      title: '',
      description: '',
      property_id: '',
      category: 'Limpeza',
      priority: 'NORMAL',
      assigned_to: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '08:00',
      deadline: '',
      location: '',
      notes: '',
    });
    loadAll();
  };

  // Routine Handlers
  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.company_id) return;

    await DataStore.createRoutine({
      company_id: user.company_id,
      property_id: routineForm.property_id || (properties[0]?.id || ''),
      name: routineForm.name,
      description: routineForm.description,
      location: routineForm.location,
      category: routineForm.category,
      priority: routineForm.priority,
      assigned_to: routineForm.assigned_to || (zeladores[0]?.id || ''),
      frequency: routineForm.frequency,
      scheduled_time: routineForm.scheduled_time,
      start_date: routineForm.start_date,
      active: true,
    }, user);

    setShowRoutineModal(false);
    loadAll();
  };

  const handleGenerateTasksFromRoutines = async () => {
    if (!user || !user.company_id) return;
    const count = await DataStore.generateTasksFromRoutines(user.company_id, user);
    alert(`Sucesso! ${count} tarefa(s) foram geradas a partir das rotinas ativas.`);
    loadAll();
  };

  // Request Decision Handlers
  const handleProcessRequest = async () => {
    if (!user || !selectedRequest) return;
    if (requestDecision === 'APROVADA' && !assignZeladorForRequest) {
      alert('Selecione o zelador que executará a tarefa aprovada.');
      return;
    }

    await DataStore.processRequest(
      selectedRequest.id,
      requestDecision,
      requestDecision === 'APROVADA' ? assignZeladorForRequest : null,
      user,
      rejectionReason
    );

    setShowProcessRequestModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
    loadAll();
  };

  // User Handlers (Zelador / ADM Predial)
  const handleOpenCreateUser = (type: 'ZELADOR' | 'ADM_PREDIAL') => {
    setUserModalType(type);
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      badge_number: '',
      birth_date: '',
      property_id: properties[0]?.id || '',
      notes: '',
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: Profile) => {
    setUserModalType(u.role as 'ZELADOR' | 'ADM_PREDIAL');
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      cpf: u.cpf || '',
      badge_number: u.badge_number || '',
      birth_date: u.birth_date || '',
      property_id: u.property_id || properties[0]?.id || '',
      notes: u.notes || '',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.company_id) return;

    if (editingUser) {
      await DataStore.updateProfile(editingUser.id, {
        name: userForm.name,
        phone: userForm.phone,
        cpf: userForm.cpf,
        badge_number: userForm.badge_number,
        birth_date: userForm.birth_date,
        property_id: userForm.property_id,
        notes: userForm.notes,
      }, user);
    } else {
      await DataStore.createProfile({
        auth_user_id: `auth-${Date.now()}`,
        company_id: user.company_id,
        property_id: userForm.property_id,
        role: userModalType,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        cpf: userForm.cpf,
        badge_number: userForm.badge_number,
        birth_date: userForm.birth_date,
        status: 'Ativo',
        notes: userForm.notes,
      }, user);
    }

    setShowUserModal(false);
    loadAll();
  };

  const handleToggleUserStatus = async (u: Profile) => {
    if (!user) return;
    const nextStatus = u.status === 'Ativo' ? 'Inativo' : 'Ativo';
    await DataStore.updateProfile(u.id, { status: nextStatus }, user);
    loadAll();
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTarget) return;
    if (deleteTarget.type === 'task') {
      await DataStore.deleteTask(deleteTarget.id, user);
    } else if (deleteTarget.type === 'user') {
      await DataStore.deleteProfile(deleteTarget.id, user);
    }
    setDeleteTarget(null);
    setShowConfirmDelete(false);
    loadAll();
  };

  // Export CSV (Section 44)
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      alert('Nenhuma tarefa para exportar.');
      return;
    }

    const headers = ['ID', 'Titulo', 'Categoria', 'Prioridade', 'Status', 'Data Agendada', 'Horario', 'Responsavel', 'Conclusao'];
    const rows = tasks.map(t => {
      const respName = zeladores.find(z => z.id === t.assigned_to)?.name || 'N/A';
      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        t.priority,
        t.status,
        t.scheduled_date,
        t.scheduled_time,
        `"${respName}"`,
        t.completed_at ? new Date(t.completed_at).toLocaleString('pt-BR') : 'Pendente'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_tarefas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDashboardView = () => (
    <div className="space-y-6">
      {/* Daily PDF Report Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-5 shadow-xs border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                Relatórios Diários Oficiais em PDF
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PDF Instantâneo
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Emita o demonstrativo com separação clara de <span className="text-emerald-300 font-semibold">tudo o que foi feito</span> e <span className="text-rose-300 font-semibold">o que não foi feito</span>.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onSelectSubTab) onSelectSubTab('relatorios');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Acessar Relatórios Diários</span>
        </button>
      </div>

      {/* 6 Top Metric Cards (Section 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hoje</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">{tasksToday.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Tarefas agendadas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pendentes</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{tasksPending.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Aguardando início</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Em Andamento</span>
            <Play className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{tasksInProgress.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Sendo executadas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Concluídas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{tasksCompleted.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">{completionRate}% taxa conclusão</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Atrasadas</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{tasksDelayed.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Requerem atenção</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Solicitações</span>
            <Inbox className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">{pendingRequests.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Do ADM Predial</div>
        </div>
      </div>

      {/* Visual Progress & Janitor Distribution Charts (Section 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Status das Tarefas</h4>
            <span className="text-xs font-semibold text-blue-600">{tasks.length} total</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Concluídas</span>
                <span className="font-bold text-emerald-600">{tasksCompleted.length}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${tasks.length ? (tasksCompleted.length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Em Andamento</span>
                <span className="font-bold text-blue-600">{tasksInProgress.length}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${tasks.length ? (tasksInProgress.length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Pendentes</span>
                <span className="font-bold text-amber-600">{tasksPending.length}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${tasks.length ? (tasksPending.length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Atrasadas</span>
                <span className="font-bold text-rose-600">{tasksDelayed.length}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${tasks.length ? (tasksDelayed.length / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Janitor Workload */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Carga de Trabalho por Zelador</h4>
            <span className="text-xs text-slate-500">{zeladores.length} zelador(es) ativos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zeladores.map(z => {
              const count = tasks.filter(t => t.assigned_to === z.id && t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA').length;
              const doneCount = tasks.filter(t => t.assigned_to === z.id && t.status === 'CONCLUIDA').length;
              return (
                <div key={z.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {z.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">{z.name}</div>
                      <div className="text-[11px] text-slate-400">Matrícula: {z.badge_number || 'S/N'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-blue-600">{count} ativas</div>
                    <div className="text-[10px] text-emerald-600 font-medium">{doneCount} concluídas</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-semibold">Rotinas Programadas e Automações:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateTasksFromRoutines}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Gerar Tarefas das Rotinas</span>
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Tarefa Avulsa</span>
          </button>
        </div>
      </div>

      {/* Main Filterable Tasks Table */}
      {renderTasksTable(5)}
    </div>
  );

  const renderTasksTable = (limit?: number) => {
    const listToRender = limit ? filteredTasks.slice(0, limit) : filteredTasks;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filters (Section 20 & 27) */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {limit ? 'Últimas Tarefas Operacionais' : 'Gestão Geral de Tarefas'}
            </h3>
            <p className="text-xs text-slate-500">Acompanhamento em tempo real da equipe de zeladoria.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tarefa, local..."
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value.toUpperCase())}
                className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 w-44 sm:w-52"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none"
            >
              <option value="todos">Todos status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ACEITA">Aceita</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="ATRASADA">Atrasada</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none"
            >
              <option value="todos">Prioridades</option>
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>

            <select
              value={zeladorFilter}
              onChange={(e) => setZeladorFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none"
            >
              <option value="todos">Todos zeladores</option>
              {zeladores.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Tarefa</span>
            </button>
          </div>
        </div>

        {/* Table Rows (Section 21) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3">Tarefa</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3">Local</th>
                <th className="px-5 py-3">Prioridade</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Data / Horário</th>
                <th className="px-5 py-3">Conclusão</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {listToRender.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Nenhuma tarefa encontrada.
                  </td>
                </tr>
              ) : (
                listToRender.map((t) => {
                  const assignedZelador = zeladores.find(z => z.id === t.assigned_to);
                  const hasPhotos = t.photos && t.photos.length > 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{t.title}</span>
                          {hasPhotos && (
                            <span title="Contém fotos">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{t.description}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {assignedZelador ? assignedZelador.name : 'Não atribuído'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{t.location || '-'}</td>
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(`${t.scheduled_date}T00:00:00`).toLocaleDateString('pt-BR')} às {t.scheduled_time}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {t.completed_at ? (
                          <span className="text-emerald-700 font-medium">
                            {new Date(t.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTaskDetails(t)}
                          title="Ver detalhes / fotos"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: 'task', id: t.id, name: t.title });
                            setShowConfirmDelete(true);
                          }}
                          title="Cancelar / Excluir tarefa"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRoutinesView = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-800">Rotinas Periódicas de Zeladoria</h3>
          <p className="text-xs text-slate-500">
            Configure limpezas e inspeções recorrentes (diárias, semanais, mensais). O sistema gera as tarefas automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateTasksFromRoutines}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            <Repeat className="w-4 h-4" />
            <span>Gerar Tarefas Agora</span>
          </button>
          <button
            onClick={() => setShowRoutineModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Rotina</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routines.map((rot) => {
          const resp = zeladores.find(z => z.id === rot.assigned_to);
          return (
            <div key={rot.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {rot.frequency}
                  </span>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      await DataStore.toggleRoutineStatus(rot.id, !rot.active, user);
                      loadAll();
                    }}
                    className={`text-xs font-bold px-2 py-0.5 rounded-full transition ${
                      rot.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {rot.active ? 'Ativa' : 'Pausada'}
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{rot.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rot.description}</p>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div><strong>Local:</strong> {rot.location}</div>
                  <div><strong>Horário:</strong> {rot.scheduled_time}</div>
                  <div><strong>Responsável:</strong> {resp?.name || 'Zelador'}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Início: {rot.start_date}</span>
                <PriorityBadge priority={rot.priority} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRequestsView = () => (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-800">Solicitações dos Administradores Prediais</h3>
        <p className="text-xs text-slate-500">
          Analise e aprove as demandas enviadas pelos síndicos e ADMs para conversão em tarefas executáveis.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3">Solicitação</th>
                <th className="px-5 py-3">Solicitante</th>
                <th className="px-5 py-3">Local</th>
                <th className="px-5 py-3">Data Desejada</th>
                <th className="px-5 py-3">Prioridade</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Nenhuma solicitação recebida até o momento.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const reqAuthor = adms.find(a => a.id === r.requested_by);
                  const isPending = r.status === 'SOLICITADA' || r.status === 'ANALISANDO';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{r.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{r.description}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{reqAuthor?.name || 'ADM Predial'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{r.location}</td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {r.desired_date} às {r.desired_time}
                      </td>
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isPending ? (
                          <button
                            onClick={() => {
                              setSelectedRequest(r);
                              setRequestDecision('APROVADA');
                              setAssignZeladorForRequest(zeladores[0]?.id || '');
                              setShowProcessRequestModal(true);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition"
                          >
                            Analisar / Converter
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Processada</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsersView = (roleType: 'ZELADOR' | 'ADM_PREDIAL') => {
    const list = roleType === 'ZELADOR' ? zeladores : adms;
    const title = roleType === 'ZELADOR' ? 'Equipe de Zeladores' : 'Administradores Prediais (Síndicos)';

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">
              Controle de usuários credenciados com autenticação segura e controle de acesso RBAC.
            </p>
          </div>
          <button
            onClick={() => handleOpenCreateUser(roleType)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar {roleType === 'ZELADOR' ? 'Zelador' : 'ADM'}</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail / Telefone</th>
                <th className="px-5 py-3">CPF</th>
                {roleType === 'ZELADOR' && <th className="px-5 py-3">Matrícula</th>}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Nenhum usuário cadastrado nesta categoria.
                  </td>
                </tr>
              ) : (
                list.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="px-5 py-3.5">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || '-'}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{u.cpf || '-'}</td>
                    {roleType === 'ZELADOR' && (
                      <td className="px-5 py-3.5 font-mono text-slate-600">{u.badge_number || '-'}</td>
                    )}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`p-1.5 rounded-lg transition ${
                          u.status === 'Ativo' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.status === 'Ativo' ? 'Desativar usuário' : 'Ativar usuário'}
                      >
                        {u.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ type: 'user', id: u.id, name: u.name });
                          setShowConfirmDelete(true);
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                        title="Excluir logicamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderReportsView = () => (
    <div className="space-y-6">
      {/* Official Daily PDF Report Generator Component */}
      <DailyReportManager
        tasks={tasks}
        company={company}
        property={properties[0] || null}
        properties={properties}
        zeladores={zeladores}
        currentUserName={user?.name || 'Administrador da Empresa'}
        isAdmPredial={false}
      />

      {/* General Metrics & CSV Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Métricas Gerais & Exportação em Planilha</h3>
            <p className="text-xs text-slate-500">Métricas consolidadas de todas as tarefas e exportação bruta em formato CSV.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Dados Gerais (CSV)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taxa de Conclusão Global</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{completionRate}%</div>
            <div className="text-xs text-slate-400 mt-0.5">{tasksCompleted.length} de {tasks.length} concluídas</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Índice de Atrasos</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {tasks.length ? Math.round((tasksDelayed.length / tasks.length) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{tasksDelayed.length} tarefas pendentes de regularização</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitações Convertidas</div>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {requests.filter(r => r.status === 'CONVERTIDA_EM_TAREFA').length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Demandas prediais atendidas com sucesso</div>
          </div>
        </div>
      </div>

      {renderTasksTable()}
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Visão Geral' },
          { id: 'tarefas', label: `Tarefas (${tasks.length})` },
          { id: 'rotinas', label: `Rotinas Recorrentes (${routines.length})` },
          { id: 'solicitacoes', label: `Solicitações (${pendingRequests.length} pendentes)` },
          { id: 'zeladores', label: `Zeladores (${zeladores.length})` },
          { id: 'adm_predial', label: `ADM Predial (${adms.length})` },
          { id: 'relatorios', label: 'Relatórios & Exportação' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectSubTab && onSelectSubTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render selected view */}
      {activeSubTab === 'dashboard' && renderDashboardView()}
      {activeSubTab === 'tarefas' && renderTasksTable()}
      {activeSubTab === 'rotinas' && renderRoutinesView()}
      {activeSubTab === 'solicitacoes' && renderRequestsView()}
      {activeSubTab === 'zeladores' && renderUsersView('ZELADOR')}
      {activeSubTab === 'adm_predial' && renderUsersView('ADM_PREDIAL')}
      {activeSubTab === 'relatorios' && renderReportsView()}

      {/* Create Task Modal (Section 9) */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Criar Nova Tarefa"
        subtitle="Atribua a demanda diretamente para um zelador da equipe."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título da Tarefa *</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value.toUpperCase() })}
              placeholder="Ex: Limpeza das caixas de gordura"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição do Serviço *</label>
            <textarea
              required
              rows={2}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value.toUpperCase() })}
              placeholder="Instruções claras para execução pelo zelador..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zelador Responsável *</label>
              <select
                required
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Selecione um zelador...</option>
                {zeladores.map(z => (
                  <option key={z.id} value={z.id}>{z.name} ({z.badge_number || 'S/N'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Empreendimento *</label>
              <select
                value={taskForm.property_id}
                onChange={(e) => setTaskForm({ ...taskForm, property_id: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Local Exato</label>
              <input
                type="text"
                value={taskForm.location}
                onChange={(e) => setTaskForm({ ...taskForm, location: e.target.value.toUpperCase() })}
                placeholder="Ex: Subsolo 1, Bloco A"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
              <input
                type="text"
                value={taskForm.category}
                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value.toUpperCase() })}
                placeholder="Limpeza, Manutenção..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data Agendada</label>
              <input
                type="date"
                required
                value={taskForm.scheduled_date}
                onChange={(e) => setTaskForm({ ...taskForm, scheduled_date: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Previsto</label>
              <input
                type="time"
                value={taskForm.scheduled_time}
                onChange={(e) => setTaskForm({ ...taskForm, scheduled_time: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              Criar e Atribuir Tarefa
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Details & Photos Modal (Section 7 & 13) */}
      {selectedTaskDetails && (
        <Modal
          isOpen={Boolean(selectedTaskDetails)}
          onClose={() => setSelectedTaskDetails(null)}
          title={selectedTaskDetails.title}
          subtitle={`Status: ${selectedTaskDetails.status} • Prioridade: ${selectedTaskDetails.priority}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
              <div className="text-slate-800 font-semibold">{selectedTaskDetails.description}</div>
              <div className="text-slate-500">
                <strong>Local:</strong> {selectedTaskDetails.location || 'Não informado'}
              </div>
              <div className="text-slate-500">
                <strong>Data Agendada:</strong> {new Date(`${selectedTaskDetails.scheduled_date}T00:00:00`).toLocaleDateString('pt-BR')} às {selectedTaskDetails.scheduled_time}
              </div>
              {selectedTaskDetails.completed_at && (
                <div className="text-emerald-700 font-medium pt-1 border-t border-slate-200">
                  <strong>Concluída em:</strong> {new Date(selectedTaskDetails.completed_at).toLocaleString('pt-BR')}
                </div>
              )}
            </div>

            {selectedTaskDetails.completion_description && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-800 mb-1">Descrição do Serviço Realizado (Zelador):</div>
                <p className="text-emerald-950 leading-relaxed">{selectedTaskDetails.completion_description}</p>
              </div>
            )}

            {selectedTaskDetails.photos && selectedTaskDetails.photos.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Registro Fotográfico Comprobatório ({selectedTaskDetails.photos.length})
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTaskDetails.photos.map((p) => (
                    <div key={p.id} className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                      <img 
                        src={p.storage_path} 
                        alt="Foto da execução" 
                        className="w-full h-36 object-cover hover:scale-105 transition-transform" 
                      />
                      <div className="p-2 bg-slate-50 text-[10px] text-slate-500">
                        Enviado em {new Date(p.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Routine Modal (Section 10) */}
      <Modal
        isOpen={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
        title="Criar Rotina Recorrente"
        subtitle="Tarefas recorrentes geradas periodicamente para a equipe."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRoutine} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Rotina *</label>
            <input
              type="text"
              required
              value={routineForm.name}
              onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value.toUpperCase() })}
              placeholder="Ex: Vistoria diária de bombas e reservatórios"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              value={routineForm.description}
              onChange={(e) => setRoutineForm({ ...routineForm, description: e.target.value.toUpperCase() })}
              placeholder="Passos detalhados da rotina..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Frequência</label>
              <select
                value={routineForm.frequency}
                onChange={(e) => setRoutineForm({ ...routineForm, frequency: e.target.value as RoutineFrequency })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="diária">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
                <option value="personalizada">Personalizada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Previsto</label>
              <input
                type="time"
                value={routineForm.scheduled_time}
                onChange={(e) => setRoutineForm({ ...routineForm, scheduled_time: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zelador Padrão</label>
              <select
                value={routineForm.assigned_to}
                onChange={(e) => setRoutineForm({ ...routineForm, assigned_to: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                {zeladores.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Local</label>
              <input
                type="text"
                value={routineForm.location}
                onChange={(e) => setRoutineForm({ ...routineForm, location: e.target.value.toUpperCase() })}
                placeholder="Ex: Área externa e jardins"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRoutineModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              Salvar Rotina
            </button>
          </div>
        </form>
      </Modal>

      {/* Process Request Modal (Section 8 & 16) */}
      {selectedRequest && (
        <Modal
          isOpen={showProcessRequestModal}
          onClose={() => setShowProcessRequestModal(false)}
          title="Processar Solicitação Predial"
          subtitle={`Demanda: ${selectedRequest.title}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-800 font-semibold">{selectedRequest.description}</p>
              <div className="mt-2 text-[11px] text-slate-500">
                <strong>Local:</strong> {selectedRequest.location} • <strong>Data Desejada:</strong> {selectedRequest.desired_date} às {selectedRequest.desired_time}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Decisão:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestDecision('APROVADA')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    requestDecision === 'APROVADA'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Aprovar & Converter em Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => setRequestDecision('RECUSADA')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    requestDecision === 'RECUSADA'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Recusar Demanda
                </button>
              </div>
            </div>

            {requestDecision === 'APROVADA' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Atribuir a qual zelador? *
                </label>
                <select
                  value={assignZeladorForRequest}
                  onChange={(e) => setAssignZeladorForRequest(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
                >
                  {zeladores.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificativa da Recusa
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo para o síndico..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProcessRequestModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessRequest}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
              >
                Confirmar Processamento
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* User Create / Edit Modal (Section 4 & 5) */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? `Editar ${userModalType}` : `Cadastrar ${userModalType === 'ZELADOR' ? 'Zelador' : 'ADM Predial'}`}
        subtitle="Controle seguro de contas e papéis RBAC."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value.toUpperCase() })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail *</label>
              <input
                type="email"
                required
                disabled={Boolean(editingUser)}
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value.toLowerCase() })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 lowercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
              <input
                type="text"
                required
                value={userForm.cpf}
                onChange={(e) => setUserForm({ ...userForm, cpf: e.target.value.toUpperCase() })}
                placeholder="000.000.000-00"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / Celular</label>
              <input
                type="text"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value.toUpperCase() })}
                placeholder="(11) 99999-9999"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {userModalType === 'ZELADOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Matrícula / Código Interno</label>
                <input
                  type="text"
                  value={userForm.badge_number}
                  onChange={(e) => setUserForm({ ...userForm, badge_number: e.target.value.toUpperCase() })}
                  placeholder="Ex: ZEL-0045"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={userForm.birth_date}
                  onChange={(e) => setUserForm({ ...userForm, birth_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
            <input
              type="text"
              value={userForm.notes}
              onChange={(e) => setUserForm({ ...userForm, notes: e.target.value.toUpperCase() })}
              placeholder="Anotações internas..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal (Section 48) */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title={`Excluir ${deleteTarget?.type === 'task' ? 'Tarefa' : 'Usuário'}`}
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação aplicará exclusão lógica (soft delete) para garantir a preservação do histórico de dados.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </div>
  );
};
