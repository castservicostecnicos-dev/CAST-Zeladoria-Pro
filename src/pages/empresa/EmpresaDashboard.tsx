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
  FileText,
  HardDrive,
  ExternalLink,
  Folder,
  Link as LinkIcon,
  CloudUpload,
  LogOut,
  Check,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  MapPin,
  X
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
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { DailyReportManager } from '../../components/reports/DailyReportManager';
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  isDriveConnected,
  extractDriveFolderId,
  testDriveConnection
} from '../../services/googleDriveService';

interface EmpresaDashboardProps {
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const EmpresaDashboard: React.FC<EmpresaDashboardProps> = ({ 
  activeSubTab = 'dashboard', 
  onSelectSubTab 
}) => {
  const { user, company, refreshCompany } = useAuth();
  const { showToast } = useToast();

  // Google Drive State (Corporate company drive management)
  const [driveFolderUrl, setDriveFolderUrl] = useState(company?.google_drive_folder_url || '');
  const [driveFolderId, setDriveFolderId] = useState(company?.google_drive_folder_id || '');
  const [driveFolderName, setDriveFolderName] = useState(company?.google_drive_folder_name || 'CAST - Documentos e Relatórios');
  const [driveEmail, setDriveEmail] = useState(company?.google_drive_email || 'empresa@cast.com');
  const [isDriveAuthConnected, setIsDriveAuthConnected] = useState(isDriveConnected() || Boolean(company?.google_drive_connected));
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isSavingDriveConfig, setIsSavingDriveConfig] = useState(false);
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [driveTestMessage, setDriveTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [driveConfigSaved, setDriveConfigSaved] = useState(false);

  // Sync Google Drive settings with Company updates
  useEffect(() => {
    if (company) {
      setDriveFolderUrl(company.google_drive_folder_url || '');
      setDriveFolderId(company.google_drive_folder_id || '');
      setDriveFolderName(company.google_drive_folder_name || 'CAST - Documentos e Relatórios');
      setDriveEmail(company.google_drive_email || 'empresa@cast.com');
      setIsDriveAuthConnected(isDriveConnected() || Boolean(company.google_drive_connected));
    }
  }, [company]);

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
  const [dateFilter, setDateFilter] = useState<'todos' | 'hoje'>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');
  const [zeladorFilter, setZeladorFilter] = useState<string>('todos');

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalType, setUserModalType] = useState<'ZELADOR' | 'ADM_PREDIAL'>('ZELADOR');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showProcessRequestModal, setShowProcessRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TaskRequest | null>(null);
  const [requestDecision, setRequestDecision] = useState<'APROVADA' | 'RECUSADA'>('APROVADA');
  const [assignZeladorForRequest, setAssignZeladorForRequest] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'task' | 'user' | 'routine' | 'property'; id: string; name: string } | null>(null);

  // Property (Condomínio) state
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchProperty, setSearchProperty] = useState('');
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    units: '',
    floors: '',
    notes: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

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
    if (dateFilter === 'hoje' && t.scheduled_date !== todayStr) return false;
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
      showToast('Selecione um zelador responsável para a tarefa.', 'warning');
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

    const createdTitle = taskForm.title;
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
    showToast(`Tarefa "${createdTitle}" criada e atribuída com sucesso!`, 'success');
    loadAll();
  };

  // Routine Handlers
  const handleOpenCreateRoutine = () => {
    setEditingRoutine(null);
    setRoutineForm({
      name: '',
      description: '',
      location: '',
      category: 'Limpeza',
      priority: 'NORMAL' as TaskPriority,
      assigned_to: zeladores[0]?.id || '',
      property_id: properties[0]?.id || '',
      frequency: 'diária' as RoutineFrequency,
      scheduled_time: '08:00',
      start_date: new Date().toISOString().split('T')[0],
    });
    setShowRoutineModal(true);
  };

  const handleOpenEditRoutine = (rot: Routine) => {
    setEditingRoutine(rot);
    setRoutineForm({
      name: rot.name,
      description: rot.description,
      location: rot.location,
      category: rot.category,
      priority: rot.priority,
      assigned_to: rot.assigned_to || (zeladores[0]?.id || ''),
      property_id: rot.property_id || (properties[0]?.id || ''),
      frequency: rot.frequency,
      scheduled_time: rot.scheduled_time || '08:00',
      start_date: rot.start_date || new Date().toISOString().split('T')[0],
    });
    setShowRoutineModal(true);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.company_id) return;

    if (editingRoutine) {
      await DataStore.updateRoutine(editingRoutine.id, {
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
      }, user);
      showToast(`Rotina recorrente "${routineForm.name}" atualizada com sucesso!`, 'success');
    } else {
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
      showToast(`Rotina recorrente "${routineForm.name}" criada com sucesso!`, 'success');
    }

    setEditingRoutine(null);
    setShowRoutineModal(false);
    loadAll();
  };

  const handleGenerateTasksFromRoutines = async () => {
    if (!user || !user.company_id) return;
    const count = await DataStore.generateTasksFromRoutines(user.company_id, user);
    showToast(`Sucesso! ${count} tarefa(s) foram geradas a partir das rotinas ativas.`, 'success');
    loadAll();
  };

  // Request Decision Handlers
  const handleProcessRequest = async () => {
    if (!user || !selectedRequest) return;
    if (requestDecision === 'APROVADA' && !assignZeladorForRequest) {
      showToast('Selecione o zelador que executará a tarefa aprovada.', 'warning');
      return;
    }

    await DataStore.processRequest(
      selectedRequest.id,
      requestDecision,
      requestDecision === 'APROVADA' ? assignZeladorForRequest : null,
      user,
      rejectionReason
    );

    const isApproved = requestDecision === 'APROVADA';
    setShowProcessRequestModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
    showToast(`Solicitação ${isApproved ? 'aprovada e convertida em tarefa' : 'recusada'} com sucesso!`, 'success');
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
      showToast(`Dados de "${userForm.name}" atualizados com sucesso!`, 'success');
    } else {
      await DataStore.createProfile({
        auth_user_id: `auth-${Date.now()}`,
        company_id: user.company_id,
        property_id: userForm.property_id || (properties[0]?.id || null),
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
      showToast(`Novo ${userModalType === 'ZELADOR' ? 'zelador' : 'administrador predial'} "${userForm.name}" cadastrado!`, 'success');
    }

    setShowUserModal(false);
    loadAll();
  };

  const handleToggleUserStatus = async (u: Profile) => {
    if (!user) return;
    const nextStatus = u.status === 'Ativo' ? 'Inativo' : 'Ativo';
    await DataStore.updateProfile(u.id, { status: nextStatus }, user);
    showToast(`Usuário "${u.name}" ${nextStatus === 'Ativo' ? 'ativado' : 'desativado'} com sucesso.`, 'info');
    loadAll();
  };

  // Property (Condomínio) Handlers
  const handleOpenCreateProperty = () => {
    setEditingProperty(null);
    setPropertyForm({
      name: '',
      address: '',
      city: 'São Paulo',
      state: 'SP',
      units: '',
      floors: '',
      notes: '',
      status: 'Ativo',
    });
    setShowPropertyModal(true);
  };

  const handleOpenEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setPropertyForm({
      name: prop.name,
      address: prop.address || '',
      city: prop.city || 'São Paulo',
      state: prop.state || 'SP',
      units: prop.units ? String(prop.units) : '',
      floors: prop.floors ? String(prop.floors) : '',
      notes: prop.notes || '',
      status: prop.status || 'Ativo',
    });
    setShowPropertyModal(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.company_id) return;

    if (!propertyForm.name.trim()) {
      showToast('O nome do condomínio é obrigatório.', 'warning');
      return;
    }

    try {
      if (editingProperty) {
        await DataStore.updateProperty(editingProperty.id, {
          name: propertyForm.name.trim().toUpperCase(),
          address: propertyForm.address.trim().toUpperCase(),
          city: propertyForm.city.trim().toUpperCase(),
          state: propertyForm.state.trim().toUpperCase(),
          units: propertyForm.units ? parseInt(propertyForm.units, 10) : undefined,
          floors: propertyForm.floors ? parseInt(propertyForm.floors, 10) : undefined,
          notes: propertyForm.notes.trim().toUpperCase(),
          status: propertyForm.status,
        }, user);
        showToast(`Condomínio "${propertyForm.name}" atualizado com sucesso!`, 'success');
      } else {
        await DataStore.createProperty({
          company_id: user.company_id,
          name: propertyForm.name.trim().toUpperCase(),
          address: propertyForm.address.trim().toUpperCase(),
          city: propertyForm.city.trim().toUpperCase(),
          state: propertyForm.state.trim().toUpperCase(),
          units: propertyForm.units ? parseInt(propertyForm.units, 10) : undefined,
          floors: propertyForm.floors ? parseInt(propertyForm.floors, 10) : undefined,
          notes: propertyForm.notes.trim().toUpperCase(),
          status: propertyForm.status,
        }, user);
        showToast(`Novo condomínio "${propertyForm.name}" cadastrado com sucesso!`, 'success');
      }

      setShowPropertyModal(false);
      loadAll();
    } catch (err: any) {
      showToast('Erro ao salvar condomínio: ' + (err?.message || 'Falha.'), 'error');
    }
  };

  const handleTogglePropertyStatus = async (prop: Property) => {
    if (!user) return;
    const nextStatus = prop.status === 'Ativo' ? 'Inativo' : 'Ativo';
    await DataStore.updateProperty(prop.id, { status: nextStatus }, user);
    showToast(`Condomínio "${prop.name}" ${nextStatus === 'Ativo' ? 'ativado' : 'inativado'} com sucesso.`, 'info');
    loadAll();
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTarget) return;
    const targetName = deleteTarget.name;
    const targetType = deleteTarget.type === 'task' ? 'Tarefa' : deleteTarget.type === 'routine' ? 'Rotina' : deleteTarget.type === 'property' ? 'Condomínio' : 'Usuário';

    if (deleteTarget.type === 'task') {
      await DataStore.deleteTask(deleteTarget.id, user);
    } else if (deleteTarget.type === 'user') {
      await DataStore.deleteProfile(deleteTarget.id, user);
    } else if (deleteTarget.type === 'routine') {
      await DataStore.deleteRoutine(deleteTarget.id, user);
    } else if (deleteTarget.type === 'property') {
      await DataStore.deleteProperty(deleteTarget.id, user);
    }
    setDeleteTarget(null);
    setShowConfirmDelete(false);
    showToast(`${targetType} "${targetName}" excluída com sucesso.`, 'info');
    loadAll();
  };

  // Export CSV (Section 44)
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      showToast('Nenhuma tarefa para exportar no momento.', 'warning');
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

  // Google Drive Handlers (Section: Empresa Google Drive Management)
  const handleConnectDrive = async () => {
    if (!company || !user) return;
    setIsConnectingDrive(true);
    setDriveTestMessage(null);
    try {
      const res = await connectGoogleDrive();
      if (!res) {
        setIsConnectingDrive(false);
        return;
      }
      setIsDriveAuthConnected(true);
      const emailToSave = res.user.email || driveEmail || 'empresa@cast.com';
      setDriveEmail(emailToSave);

      await DataStore.updateCompany(company.id, {
        google_drive_connected: true,
        google_drive_connected_at: new Date().toISOString(),
        google_drive_email: emailToSave,
      }, user);

      await refreshCompany();
      setDriveTestMessage({
        type: 'success',
        text: `Google Drive corporativo conectado com sucesso (${emailToSave})!`,
      });
    } catch (err: any) {
      console.error('Erro ao conectar Google Drive:', err);
      setDriveTestMessage({
        type: 'error',
        text: err?.message || 'Falha na autenticação com o Google.',
      });
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (!company || !user) return;
    disconnectGoogleDrive();
    setIsDriveAuthConnected(false);
    await DataStore.updateCompany(company.id, {
      google_drive_connected: false,
    }, user);
    await refreshCompany();
    setDriveTestMessage({
      type: 'success',
      text: 'Google Drive desconectado da sessão com segurança.',
    });
  };

  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    setIsSavingDriveConfig(true);
    setDriveTestMessage(null);
    try {
      const cleanedId = extractDriveFolderId(driveFolderId || driveFolderUrl);
      const finalUrl = driveFolderUrl.trim() || (cleanedId ? `https://drive.google.com/drive/folders/${cleanedId}` : '');

      await DataStore.updateCompany(company.id, {
        google_drive_email: driveEmail.trim().toLowerCase(),
        google_drive_folder_name: driveFolderName.trim(),
        google_drive_folder_id: cleanedId,
        google_drive_folder_url: finalUrl,
      }, user);

      await refreshCompany();
      setDriveConfigSaved(true);
      showToast('Configurações do Google Drive salvas com sucesso!', 'success');
      setTimeout(() => setDriveConfigSaved(false), 3500);
    } catch (err: any) {
      showToast('Erro ao salvar configurações do Google Drive: ' + err.message, 'error');
    } finally {
      setIsSavingDriveConfig(false);
    }
  };

  const handleTestDrive = async () => {
    setIsTestingDrive(true);
    setDriveTestMessage(null);
    try {
      if (!isDriveConnected()) {
        const conn = await connectGoogleDrive();
        if (!conn) {
          setIsTestingDrive(false);
          return;
        }
        setIsDriveAuthConnected(true);
      }

      const res = await testDriveConnection(driveFolderId || driveFolderUrl, driveFolderName);
      setDriveTestMessage({
        type: 'success',
        text: `Teste realizado com êxito! Pasta "${res.folderName}" verificada e pronta no Google Drive (${res.userEmail}).`,
      });
    } catch (err: any) {
      setDriveTestMessage({
        type: 'error',
        text: 'Erro no teste: ' + (err?.message || 'Verifique as permissões da conta Google.'),
      });
    } finally {
      setIsTestingDrive(false);
    }
  };

  const renderDashboardView = () => (
    <div className="w-full max-w-full overflow-x-hidden animate-fade-in">
      {/* Grid de Blocos Interativos (Visão Geral Operacional) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Bloco 1: Hoje */}
        <button
          type="button"
          onClick={() => {
            setDateFilter('hoje');
            setStatusFilter('todos');
            setSearchTask('');
            setPriorityFilter('todos');
            setZeladorFilter('todos');
            if (onSelectSubTab) onSelectSubTab('tarefas');
          }}
          className="group bg-white hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-blue-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition tracking-tight">
              {tasksToday.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Tarefas de Hoje</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Data Atual
            </span>
          </div>
        </button>

        {/* Bloco 2: Pendentes */}
        <button
          type="button"
          onClick={() => {
            setDateFilter('todos');
            setStatusFilter('PENDENTE');
            setSearchTask('');
            setPriorityFilter('todos');
            setZeladorFilter('todos');
            if (onSelectSubTab) onSelectSubTab('tarefas');
          }}
          className="group bg-white hover:bg-amber-50/40 border border-slate-200/90 hover:border-amber-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-amber-500 group-hover:text-white transition">
              <Clock className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-amber-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-amber-600 tracking-tight">
              {tasksPending.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Tarefas Pendentes</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Fila de Execução
            </span>
          </div>
        </button>

        {/* Bloco 3: Em Andamento */}
        <button
          type="button"
          onClick={() => {
            setDateFilter('todos');
            setStatusFilter('EM_ANDAMENTO');
            setSearchTask('');
            setPriorityFilter('todos');
            setZeladorFilter('todos');
            if (onSelectSubTab) onSelectSubTab('tarefas');
          }}
          className="group bg-white hover:bg-sky-50/40 border border-slate-200/90 hover:border-sky-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-sky-600 group-hover:text-white transition">
              <Play className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-sky-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-sky-600 tracking-tight">
              {tasksInProgress.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Em Andamento</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
              Em Campo
            </span>
          </div>
        </button>

        {/* Bloco 4: Concluídas */}
        <button
          type="button"
          onClick={() => {
            setDateFilter('todos');
            setStatusFilter('CONCLUIDA');
            setSearchTask('');
            setPriorityFilter('todos');
            setZeladorFilter('todos');
            if (onSelectSubTab) onSelectSubTab('tarefas');
          }}
          className="group bg-white hover:bg-emerald-50/40 border border-slate-200/90 hover:border-emerald-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {tasksCompleted.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Tarefas Concluídas</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {completionRate}% taxa
            </span>
          </div>
        </button>

        {/* Bloco 5: Atrasadas */}
        <button
          type="button"
          onClick={() => {
            setDateFilter('todos');
            setStatusFilter('ATRASADA');
            setSearchTask('');
            setPriorityFilter('todos');
            setZeladorFilter('todos');
            if (onSelectSubTab) onSelectSubTab('tarefas');
          }}
          className="group bg-white hover:bg-rose-50/40 border border-slate-200/90 hover:border-rose-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-rose-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-rose-600 tracking-tight">
              {tasksDelayed.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Tarefas Atrasadas</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              Alerta Operacional
            </span>
          </div>
        </button>

        {/* Bloco 6: Solicitações */}
        <button
          type="button"
          onClick={() => {
            if (onSelectSubTab) onSelectSubTab('solicitacoes');
          }}
          className="group bg-white hover:bg-purple-50/40 border border-slate-200/90 hover:border-purple-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition">
              <Inbox className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-purple-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-purple-600 tracking-tight">
              {pendingRequests.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Solicitações Prediais</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {requests.length} Registradas
            </span>
          </div>
        </button>

        {/* Bloco 7: Rotinas Recorrentes */}
        <button
          type="button"
          onClick={() => {
            if (onSelectSubTab) onSelectSubTab('rotinas');
          }}
          className="group bg-white hover:bg-indigo-50/40 border border-slate-200/90 hover:border-indigo-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition">
              <Repeat className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-indigo-600 tracking-tight">
              {routines.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Rotinas Recorrentes</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {routines.filter(r => r.active).length} Ativas
            </span>
          </div>
        </button>

        {/* Bloco: Condomínios */}
        <button
          type="button"
          onClick={() => {
            if (onSelectSubTab) onSelectSubTab('condominios');
          }}
          className="group bg-white hover:bg-emerald-50/40 border border-slate-200/90 hover:border-emerald-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-emerald-700 tracking-tight">
              {properties.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Condomínios</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              {properties.filter(p => p.status === 'Ativo').length} Ativos
            </span>
          </div>
        </button>

        {/* Bloco 8: Zeladores */}
        <button
          type="button"
          onClick={() => {
            if (onSelectSubTab) onSelectSubTab('zeladores');
          }}
          className="group bg-white hover:bg-cyan-50/40 border border-slate-200/90 hover:border-cyan-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold shadow-2xs group-hover:bg-cyan-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-cyan-700 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-cyan-700 tracking-tight">
              {zeladores.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Zeladores em Campo</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full">
              Equipe Operacional
            </span>
          </div>
        </button>

        {/* Bloco 9: ADM Predial */}
        <button
          type="button"
          onClick={() => {
            if (onSelectSubTab) onSelectSubTab('adm_predial');
          }}
          className="group bg-white hover:bg-slate-100/60 border border-slate-200/90 hover:border-slate-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shadow-2xs group-hover:bg-slate-800 group-hover:text-white transition">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-slate-800 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {adms.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">ADM Predial / Síndicos</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              Gestão & Chamados
            </span>
          </div>
        </button>

        {/* Bloco 10: Relatórios */}
        <button
          type="button"
          onClick={() => {
            if (onSelectSubTab) onSelectSubTab('relatorios');
          }}
          className="group bg-white hover:bg-teal-50/40 border border-slate-200/90 hover:border-teal-400 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer flex flex-col justify-between min-h-[145px]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition">
              <FileText className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-teal-600 transition">
              <span>Abrir</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="my-1.5">
            <div className="text-3xl font-black text-teal-600 tracking-tight">
              {tasksCompleted.length}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">Relatórios & Laudos</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              PDF com Fotos
            </span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderTasksTable = (limit?: number) => {
    const listToRender = limit ? filteredTasks.slice(0, limit) : filteredTasks;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filters (Section 20 & 27) */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDateFilter('todos');
                setStatusFilter('todos');
                if (onSelectSubTab) onSelectSubTab('dashboard');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200 shrink-0"
              title="Voltar aos Blocos da Visão Geral"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar aos Blocos</span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  {limit ? 'Últimas Tarefas Operacionais' : 'Gestão Geral de Tarefas'}
                </h3>
                {dateFilter === 'hoje' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    Filtrando: Hoje
                    <button
                      type="button"
                      onClick={() => setDateFilter('todos')}
                      className="ml-1 hover:text-blue-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Status: {statusFilter}
                    <button
                      type="button"
                      onClick={() => setStatusFilter('todos')}
                      className="ml-1 hover:text-amber-950 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(dateFilter !== 'todos' || statusFilter !== 'todos' || searchTask || priorityFilter !== 'todos' || zeladorFilter !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('todos');
                  setStatusFilter('todos');
                  setSearchTask('');
                  setPriorityFilter('todos');
                  setZeladorFilter('todos');
                }}
                className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                title="Limpar todos os filtros"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}

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
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[750px] text-left border-collapse">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-800">Rotinas Periódicas de Zeladoria</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSubTab && onSelectSubTab('dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
            title="Voltar aos Blocos da Visão Geral"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar aos Blocos</span>
          </button>
          <button
            onClick={handleGenerateTasksFromRoutines}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            title="Gera imediatamente as tarefas do dia com base nas rotinas ativas"
          >
            <Repeat className="w-4 h-4" />
            <span>Gerar Tarefas Agora</span>
          </button>
          <button
            onClick={handleOpenCreateRoutine}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Rotina</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routines.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Repeat className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Nenhuma rotina periódica cadastrada</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Crie rotinas recorrentes de limpeza, manutenção e inspeções para geração automática de tarefas para os zeladores.
            </p>
            <button
              onClick={handleOpenCreateRoutine}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeira Rotina</span>
            </button>
          </div>
        ) : (
          routines.map((rot) => {
            const resp = zeladores.find(z => z.id === rot.assigned_to);
            return (
              <div key={rot.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {rot.frequency}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          if (!user) return;
                          await DataStore.toggleRoutineStatus(rot.id, !rot.active, user);
                          showToast(`Rotina "${rot.name}" ${!rot.active ? 'ativada' : 'pausada'}.`, 'info');
                          loadAll();
                        }}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                          rot.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title={rot.active ? 'Clique para pausar esta rotina' : 'Clique para ativar esta rotina'}
                      >
                        {rot.active ? 'Ativa' : 'Pausada'}
                      </button>
                      <button
                        onClick={() => handleOpenEditRoutine(rot)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Editar rotina"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ type: 'routine', id: rot.id, name: rot.name });
                          setShowConfirmDelete(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Excluir rotina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                      {rot.category || 'Limpeza'}
                    </span>
                    <span>Início: {rot.start_date}</span>
                  </div>
                  <PriorityBadge priority={rot.priority} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderRequestsView = () => (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-800">Solicitações dos Administradores Prediais</h3>
        <button
          type="button"
          onClick={() => onSelectSubTab && onSelectSubTab('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200 shrink-0 self-start sm:self-auto"
          title="Voltar aos Blocos da Visão Geral"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar aos Blocos</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[700px] text-left border-collapse">
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
      <div className="space-y-5 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onSelectSubTab && onSelectSubTab('dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
              title="Voltar aos Blocos da Visão Geral"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar aos Blocos</span>
            </button>
            <button
              onClick={() => handleOpenCreateUser(roleType)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar {roleType === 'ZELADOR' ? 'Zelador' : 'ADM'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Condomínio Vinculado</th>
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
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Nenhum usuário cadastrado nesta categoria.
                  </td>
                </tr>
              ) : (
                list.map((u) => {
                  const linkedProp = properties.find(p => p.id === u.property_id);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{u.name}</td>
                      <td className="px-5 py-3.5">
                        {linkedProp ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{linkedProp.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 italic">
                            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Sem condomínio</span>
                          </span>
                        )}
                      </td>
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
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const renderPropertiesView = () => {
    const filteredProps = properties.filter(p => 
      p.name.toLowerCase().includes(searchProperty.toLowerCase()) ||
      p.address.toLowerCase().includes(searchProperty.toLowerCase()) ||
      p.city.toLowerCase().includes(searchProperty.toLowerCase())
    );

    return (
      <div className="space-y-5 w-full max-w-full overflow-x-hidden animate-fade-in">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Gestão de Condomínios & Empreendimentos</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastre e gerencie os condomínios atendidos pela empresa, vinculando a equipe de zeladores e síndicos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onSelectSubTab && onSelectSubTab('dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
              title="Voltar aos Blocos da Visão Geral"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar aos Blocos</span>
            </button>
            <button
              onClick={handleOpenCreateProperty}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Condomínio</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, endereço ou cidade..."
              value={searchProperty}
              onChange={(e) => setSearchProperty(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="text-xs font-medium text-slate-500">
            Total: <strong>{properties.length}</strong> {properties.length === 1 ? 'condomínio' : 'condomínios'} ({properties.filter(p => p.status === 'Ativo').length} ativos)
          </div>
        </div>

        {/* Grid of Condominium Cards */}
        {filteredProps.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Nenhum condomínio encontrado</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Cadastre os condomínios atendidos pela sua empresa para atribuir os zeladores e administradores prediais.
            </p>
            <button
              onClick={handleOpenCreateProperty}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Condomínio</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProps.map((prop) => {
              const propZeladores = zeladores.filter(z => z.property_id === prop.id);
              const propAdms = adms.filter(a => a.property_id === prop.id);
              const propTasks = tasks.filter(t => t.property_id === prop.id);
              const propPendingTasks = propTasks.filter(t => t.status !== 'CONCLUIDA');

              return (
                <div 
                  key={prop.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{prop.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            prop.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {prop.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditProperty(prop)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Editar condomínio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: 'property', id: prop.id, name: prop.name });
                            setShowConfirmDelete(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Inativar/Excluir condomínio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-3">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{prop.address} • {prop.city}/{prop.state}</span>
                    </div>

                    {/* Units & Floors if set */}
                    {(prop.units || prop.floors) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                        {prop.units && <span><strong>{prop.units}</strong> unidades</span>}
                        {prop.units && prop.floors && <span>•</span>}
                        {prop.floors && <span><strong>{prop.floors}</strong> andares</span>}
                      </div>
                    )}

                    {/* Equipes vinculadas */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Zeladores Atribuídos:</span>
                          <span className="text-emerald-700 font-bold">{propZeladores.length}</span>
                        </div>
                        {propZeladores.length === 0 ? (
                          <span className="text-[11px] text-amber-600 italic">Nenhum zelador vinculado</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {propZeladores.map(z => (
                              <span key={z.id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                {z.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>ADM Predial / Síndicos:</span>
                          <span className="text-blue-700 font-bold">{propAdms.length}</span>
                        </div>
                        {propAdms.length === 0 ? (
                          <span className="text-[11px] text-amber-600 italic">Nenhum síndico vinculado</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {propAdms.map(a => (
                              <span key={a.id} className="text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                                {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats & Fast Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      <strong>{propPendingTasks.length}</strong> tarefas pendentes
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePropertyStatus(prop)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                        prop.status === 'Ativo' 
                          ? 'text-amber-700 hover:bg-amber-50' 
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {prop.status === 'Ativo' ? 'Inativar' : 'Reativar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderReportsView = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-800">Relatórios & Demonstrativos Diários</h3>
        <button
          type="button"
          onClick={() => onSelectSubTab && onSelectSubTab('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200 shrink-0 self-start sm:self-auto"
          title="Voltar aos Blocos da Visão Geral"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar aos Blocos</span>
        </button>
      </div>

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
          <h3 className="text-base font-bold text-slate-800">Métricas Gerais & Exportação em Planilha</h3>
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

  const renderGoogleDriveView = () => (
    <div className="max-w-2xl mx-auto space-y-4 w-full overflow-x-hidden animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelectSubTab && onSelectSubTab('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar aos Blocos</span>
        </button>

        {company?.google_drive_folder_url && (
          <a
            href={company.google_drive_folder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold"
          >
            <span>Abrir Pasta no Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Card: Cadastro do Google Drive */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Folder className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Cadastro do Google Drive</h3>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isDriveAuthConnected 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDriveAuthConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isDriveAuthConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {driveTestMessage && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border ${
            driveTestMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            <div className="flex items-center gap-1.5">
              {driveTestMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{driveTestMessage.text}</span>
            </div>
            <button 
              type="button"
              onClick={() => setDriveTestMessage(null)}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {driveConfigSaved && (
          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSaveDriveConfig} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail Oficial no Google *
            </label>
            <input
              type="email"
              required
              value={driveEmail}
              onChange={(e) => setDriveEmail(e.target.value.toLowerCase())}
              placeholder="empresa@cast.com"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Pasta no Drive *
            </label>
            <input
              type="text"
              required
              value={driveFolderName}
              onChange={(e) => setDriveFolderName(e.target.value)}
              placeholder="Ex: CAST - Documentos e Relatórios"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link ou ID da Pasta no Drive (Opcional)
            </label>
            <input
              type="text"
              value={driveFolderUrl}
              onChange={(e) => {
                const url = e.target.value;
                setDriveFolderUrl(url);
                const extracted = extractDriveFolderId(url);
                if (extracted && extracted !== url) {
                  setDriveFolderId(extracted);
                }
              }}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {isDriveAuthConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectDrive}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  disabled={isConnectingDrive}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isConnectingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  <span>Conectar Conta Google</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTestDrive}
                disabled={isTestingDrive}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTestingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Testar Conexão</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSavingDriveConfig}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSavingDriveConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Salvar Cadastro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Render selected view */}
      {activeSubTab === 'dashboard' && renderDashboardView()}
      {activeSubTab === 'tarefas' && renderTasksTable()}
      {activeSubTab === 'rotinas' && renderRoutinesView()}
      {activeSubTab === 'solicitacoes' && renderRequestsView()}
      {activeSubTab === 'condominios' && renderPropertiesView()}
      {activeSubTab === 'zeladores' && renderUsersView('ZELADOR')}
      {activeSubTab === 'adm_predial' && renderUsersView('ADM_PREDIAL')}
      {activeSubTab === 'relatorios' && renderReportsView()}
      {activeSubTab === 'google_drive' && renderGoogleDriveView()}

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

      {/* Create / Edit Routine Modal */}
      <Modal
        isOpen={showRoutineModal}
        onClose={() => {
          setShowRoutineModal(false);
          setEditingRoutine(null);
        }}
        title={editingRoutine ? "Editar Rotina Recorrente" : "Criar Rotina Recorrente"}
        subtitle={editingRoutine ? `Ajuste os parâmetros da rotina "${editingRoutine.name}".` : "Tarefas recorrentes geradas periodicamente para a equipe."}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveRoutine} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Rotina *</label>
            <input
              type="text"
              required
              value={routineForm.name}
              onChange={(e) => setRoutineForm({ ...routineForm, name: e.target.value.toUpperCase() })}
              placeholder="Ex: Vistoria diária de bombas e reservatórios"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
              <select
                value={routineForm.category}
                onChange={(e) => setRoutineForm({ ...routineForm, category: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="Limpeza">Limpeza</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Inspeção">Inspeção</option>
                <option value="Segurança">Segurança</option>
                <option value="Jardinagem">Jardinagem</option>
                <option value="Piscina">Piscina</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
              <select
                value={routineForm.priority}
                onChange={(e) => setRoutineForm({ ...routineForm, priority: e.target.value as TaskPriority })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
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
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowRoutineModal(false);
                setEditingRoutine(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition cursor-pointer"
            >
              {editingRoutine ? 'Salvar Alterações' : 'Criar Rotina'}
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

          {/* Condomínio / Prédio Vinculado */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Condomínio / Empreendimento Vinculado *
              </label>
              {properties.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    handleOpenCreateProperty();
                  }}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  + Cadastrar Condomínio
                </button>
              )}
            </div>
            <select
              required
              value={userForm.property_id}
              onChange={(e) => setUserForm({ ...userForm, property_id: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Selecione o condomínio...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.city}/{p.state} {p.status === 'Inativo' ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {userModalType === 'ADM_PREDIAL'
                ? 'O Administrador Predial / Síndico terá acesso e gerenciará este condomínio específico.'
                : 'Condomínio base no qual o zelador atuará e executará rotinas e tarefas.'}
            </p>
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

      {/* Create / Edit Property (Condomínio) Modal */}
      <Modal
        isOpen={showPropertyModal}
        onClose={() => {
          setShowPropertyModal(false);
          setEditingProperty(null);
        }}
        title={editingProperty ? "Editar Condomínio" : "Cadastrar Novo Condomínio"}
        subtitle="Adicione ou atualize os dados do condomínio para organizar a equipe e as tarefas."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProperty} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Condomínio / Prédio *</label>
            <input
              type="text"
              required
              value={propertyForm.name}
              onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value.toUpperCase() })}
              placeholder="Ex: Condomínio Residencial Parque dos Ipês"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Completo *</label>
            <input
              type="text"
              required
              value={propertyForm.address}
              onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value.toUpperCase() })}
              placeholder="Ex: Av. Paulista, 1500 - Bela Vista"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade *</label>
              <input
                type="text"
                required
                value={propertyForm.city}
                onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value.toUpperCase() })}
                placeholder="Ex: São Paulo"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado (UF) *</label>
              <input
                type="text"
                required
                maxLength={2}
                value={propertyForm.state}
                onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value.toUpperCase() })}
                placeholder="SP"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total de Unidades / Apartamentos</label>
              <input
                type="number"
                min="1"
                value={propertyForm.units}
                onChange={(e) => setPropertyForm({ ...propertyForm, units: e.target.value })}
                placeholder="Ex: 72"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Andares / Pavimentos</label>
              <input
                type="number"
                min="1"
                value={propertyForm.floors}
                onChange={(e) => setPropertyForm({ ...propertyForm, floors: e.target.value })}
                placeholder="Ex: 18"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Internas</label>
            <input
              type="text"
              value={propertyForm.notes}
              onChange={(e) => setPropertyForm({ ...propertyForm, notes: e.target.value.toUpperCase() })}
              placeholder="Instruções de acesso à portaria, detalhes estruturais..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowPropertyModal(false);
                setEditingProperty(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
            >
              {editingProperty ? 'Salvar Alterações' : 'Cadastrar Condomínio'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal (Section 48) */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title={`Excluir ${deleteTarget?.type === 'task' ? 'Tarefa' : deleteTarget?.type === 'routine' ? 'Rotina Recorrente' : deleteTarget?.type === 'property' ? 'Condomínio' : 'Usuário'}`}
        message={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação removerá ${deleteTarget?.type === 'routine' ? 'esta rotina periódica da empresa' : deleteTarget?.type === 'task' ? 'esta tarefa do sistema' : deleteTarget?.type === 'property' ? 'este condomínio da base da empresa' : 'este usuário'}.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        isDestructive={true}
      />
    </div>
  );
};
