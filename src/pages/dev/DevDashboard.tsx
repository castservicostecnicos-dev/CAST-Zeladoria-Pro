import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Power, 
  Trash2, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  PlayCircle,
  ExternalLink,
  ShieldCheck,
  Building,
  Users,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  Terminal,
  Code2,
  ArrowLeft
} from 'lucide-react';
import { Company, UserRole, Profile } from '../../types';
import { DataStore } from '../../services/store';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { DemoGuide } from '../demo/DemoGuide';

interface DevDashboardProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const DevDashboard: React.FC<DevDashboardProps> = ({ 
  activeTab: externalActiveTab,
  onSelectTab
}) => {
  const { user, switchDemoRole } = useAuth();
  const [internalTab, setInternalTab] = useState<'empresas' | 'demonstracao'>('empresas');

  const currentTab = externalActiveTab === 'demonstracao' ? 'demonstracao' : internalTab;

  const handleSelectTab = (tab: 'empresas' | 'demonstracao') => {
    setInternalTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const [companies, setCompanies] = useState<Company[]>([]);
  const [devProfiles, setDevProfiles] = useState<Profile[]>([]);
  const [activeSubView, setActiveSubView] = useState<'empresas' | 'devs'>('empresas');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Register type toggle: 'empresa' | 'dev'
  const [registerType, setRegisterType] = useState<'empresa' | 'dev'>('empresa');

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingDev, setEditingDev] = useState<Profile | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const [showDevDeleteModal, setShowDevDeleteModal] = useState(false);
  const [devToDelete, setDevToDelete] = useState<Profile | null>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [companyToReset, setCompanyToReset] = useState<Company | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<{ id: string; name: string; email: string; role?: string } | null>(null);
  const [newDirectPassword, setNewDirectPassword] = useState('');
  const [confirmDirectPassword, setConfirmDirectPassword] = useState('');
  const [showDirectPassword, setShowDirectPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Company Form state
  const [formData, setFormData] = useState({
    legal_name: '',
    trade_name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'SP',
    responsible_name: '',
    responsible_email: '',
    responsible_phone: '',
    status: 'Ativa' as 'Ativa' | 'Inativa',
  });

  // Dev Form state
  const [devFormData, setDevFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    city: 'SÃO PAULO',
    state: 'SP',
    password: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    notes: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const loadData = async () => {
    const [cList, pList] = await Promise.all([
      DataStore.getCompanies(),
      DataStore.getProfiles(undefined, 'DEV'),
    ]);
    setCompanies(cList);
    setDevProfiles(pList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateCompany = () => {
    setRegisterType('empresa');
    setEditingCompany(null);
    setEditingDev(null);
    setFormData({
      legal_name: '',
      trade_name: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'SP',
      responsible_name: '',
      responsible_email: '',
      responsible_phone: '',
      status: 'Ativa',
    });
    setShowRegisterModal(true);
  };

  const handleOpenCreateDev = () => {
    setRegisterType('dev');
    setEditingCompany(null);
    setEditingDev(null);
    setDevFormData({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      city: 'SÃO PAULO',
      state: 'SP',
      password: '123456',
      status: 'Ativo',
      notes: 'DESENVOLVEDOR / ADMINISTRADOR GLOBAL DEV',
    });
    setShowRegisterModal(true);
  };

  const handleOpenEditCompany = (comp: Company) => {
    setRegisterType('empresa');
    setEditingDev(null);
    setEditingCompany(comp);
    setFormData({
      legal_name: comp.legal_name,
      trade_name: comp.trade_name,
      cnpj: comp.cnpj,
      email: comp.email,
      phone: comp.phone,
      address: comp.address,
      city: comp.city,
      state: comp.state,
      responsible_name: comp.responsible_name,
      responsible_email: comp.responsible_email,
      responsible_phone: comp.responsible_phone,
      status: comp.status,
    });
    setShowRegisterModal(true);
  };

  const handleOpenEditDev = (dev: Profile) => {
    setRegisterType('dev');
    setEditingCompany(null);
    setEditingDev(dev);
    setDevFormData({
      name: dev.name,
      email: dev.email,
      phone: dev.phone || '',
      cpf: dev.cpf || '',
      city: dev.city || 'SÃO PAULO',
      state: dev.state || 'SP',
      password: '',
      status: dev.status,
      notes: dev.notes || '',
    });
    setShowRegisterModal(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (editingCompany) {
      await DataStore.updateCompany(editingCompany.id, formData, user);
    } else {
      await DataStore.createCompany(formData, user);
    }

    setShowRegisterModal(false);
    loadData();
  };

  const handleSaveDev = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!devFormData.name.trim() || !devFormData.email.trim()) {
      alert('Por favor, preencha o nome e o e-mail do desenvolvedor.');
      return;
    }

    if (editingDev) {
      await DataStore.updateProfile(editingDev.id, {
        name: devFormData.name.toUpperCase().trim(),
        email: devFormData.email.toLowerCase().trim(),
        phone: devFormData.phone.toUpperCase().trim(),
        cpf: devFormData.cpf.toUpperCase().trim(),
        city: devFormData.city.toUpperCase().trim(),
        state: devFormData.state.toUpperCase().trim(),
        status: devFormData.status,
        notes: devFormData.notes.toUpperCase().trim(),
      }, user);
      alert('Dados do desenvolvedor DEV atualizados com sucesso!');
    } else {
      const allProfiles = await DataStore.getProfiles();
      const existing = allProfiles.find(p => p.email.toLowerCase().trim() === devFormData.email.toLowerCase().trim() && !p.deleted_at);
      if (existing) {
        alert(`Atenção: Já existe um usuário cadastrado com o e-mail: ${devFormData.email}`);
        return;
      }

      await DataStore.createProfile({
        auth_user_id: `auth-dev-${Date.now()}`,
        role: 'DEV',
        name: devFormData.name.toUpperCase().trim(),
        email: devFormData.email.toLowerCase().trim(),
        phone: devFormData.phone.toUpperCase().trim(),
        cpf: devFormData.cpf.toUpperCase().trim(),
        city: devFormData.city.toUpperCase().trim(),
        state: devFormData.state.toUpperCase().trim(),
        status: devFormData.status,
        notes: devFormData.notes ? devFormData.notes.toUpperCase().trim() : 'DESENVOLVEDOR / ADMINISTRADOR GLOBAL DEV',
      }, user);
      alert(`Novo Desenvolvedor (DEV) cadastrado com sucesso!\n\nNome: ${devFormData.name.toUpperCase().trim()}\nE-mail de Login: ${devFormData.email.toLowerCase().trim()}`);
    }

    setShowRegisterModal(false);
    loadData();
  };

  const handleToggleStatus = async (comp: Company) => {
    if (!user) return;
    const nextStatus = comp.status === 'Ativa' ? 'Inativa' : 'Ativa';
    await DataStore.updateCompany(comp.id, { status: nextStatus }, user);
    loadData();
  };

  const handleToggleDevStatus = async (dev: Profile) => {
    if (!user) return;
    if (dev.id === user.id) {
      alert('Você não pode desativar seu próprio usuário em sessão ativa.');
      return;
    }
    const nextStatus = dev.status === 'Ativo' ? 'Inativo' : 'Ativo';
    await DataStore.updateProfile(dev.id, { status: nextStatus }, user);
    loadData();
  };

  const handleConfirmDelete = async () => {
    if (!user || !companyToDelete) return;
    await DataStore.deleteCompany(companyToDelete.id, user);
    setCompanyToDelete(null);
    loadData();
  };

  const handleConfirmDeleteDev = async () => {
    if (!user || !devToDelete) return;
    if (devToDelete.id === user.id) {
      alert('Você não pode excluir seu próprio usuário em sessão ativa.');
      return;
    }
    await DataStore.deleteProfile(devToDelete.id, user);
    setDevToDelete(null);
    setShowDevDeleteModal(false);
    loadData();
  };

  const handleOpenResetForDev = (dev: Profile) => {
    setUserToResetPassword({
      id: dev.id,
      name: dev.name,
      email: dev.email,
      role: 'Desenvolvedor DEV',
    });
    setNewDirectPassword('');
    setConfirmDirectPassword('');
    setShowResetModal(true);
  };

  const handleOpenResetForCompany = async (comp: Company) => {
    setCompanyToReset(comp);
    const allProfiles = await DataStore.getProfiles();
    const compProfile = allProfiles.find(
      p => p.company_id === comp.id || (p.email && comp.responsible_email && p.email.toLowerCase() === comp.responsible_email.toLowerCase())
    );

    setUserToResetPassword({
      id: compProfile ? compProfile.id : comp.id,
      name: comp.responsible_name || comp.trade_name,
      email: comp.responsible_email || comp.email,
      role: `Empresa: ${comp.trade_name}`,
    });
    setNewDirectPassword('');
    setConfirmDirectPassword('');
    setShowResetModal(true);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewDirectPassword(res);
    setConfirmDirectPassword(res);
    setShowDirectPassword(true);
  };

  const handleSaveDirectPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userToResetPassword) return;

    if (!newDirectPassword || newDirectPassword.length < 4) {
      alert('A nova senha deve possuir ao menos 4 caracteres.');
      return;
    }

    if (newDirectPassword !== confirmDirectPassword) {
      alert('A confirmação de senha não confere. Por favor, digite a mesma senha nos dois campos.');
      return;
    }

    setIsResettingPassword(true);
    try {
      await DataStore.resetUserPassword(userToResetPassword.id, newDirectPassword, user);
      alert(`Senha redefinida com sucesso para o usuário "${userToResetPassword.name}" (${userToResetPassword.email})!\n\nA nova senha já está ativa para acesso imediato no sistema sem necessidade de link por e-mail.`);
      setShowResetModal(false);
      setUserToResetPassword(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar nova senha.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Metrics
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'Ativa').length;
  const inactiveCompanies = companies.filter(c => c.status === 'Inativa').length;
  const totalDevs = devProfiles.length;
  const activeDevs = devProfiles.filter(d => d.status === 'Ativo').length;

  const filteredCompanies = companies.filter(c => {
    const matchSearch = 
      c.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm) ||
      c.responsible_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchSearch) return false;
    if (filterStatus === 'ativas') return c.status === 'Ativa';
    if (filterStatus === 'inativas') return c.status === 'Inativa';
    return true;
  });

  const filteredDevs = devProfiles.filter(d => {
    const matchSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.phone && d.phone.includes(searchTerm));
    
    if (!matchSearch) return false;
    if (filterStatus === 'ativas') return d.status === 'Ativo';
    if (filterStatus === 'inativas') return d.status === 'Inativo';
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Dev Navigation Subtabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-200/70 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => handleSelectTab('empresas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial justify-center ${
            currentTab === 'empresas'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Gestão de Empresas</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${currentTab === 'empresas' ? 'bg-purple-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
            {totalCompanies}
          </span>
        </button>

        <button
          onClick={() => handleSelectTab('demonstracao')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex-1 sm:flex-initial justify-center ${
            currentTab === 'demonstracao'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PlayCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Demonstração de Perfis</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full font-bold">
            4 Papéis
          </span>
        </button>
      </div>

      {currentTab === 'demonstracao' ? (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-950">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                <PlayCircle className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Ambiente de Demonstração Guiada</h4>
                <p className="text-xs text-purple-700">
                  Alterne entre os papéis para testar as telas e fluxos com dados de teste.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSelectTab('empresas')}
              className="px-3 py-1.5 rounded-xl border border-purple-300 text-purple-800 bg-white hover:bg-purple-100 text-xs font-bold transition shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Voltar para Empresas
            </button>
          </div>

          <DemoGuide />
        </div>
      ) : (
        <>
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Empresas</div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{totalCompanies}</div>
          <div className="text-[11px] text-slate-400 mt-1">{activeCompanies} ativas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Empresas Ativas</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{activeCompanies}</div>
          <div className="text-[11px] text-slate-400 mt-1">{inactiveCompanies} inativa(s)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Desenvolvedores DEV</div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-1">{totalDevs}</div>
          <div className="text-[11px] text-slate-400 mt-1">Acesso administrativo</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Devs Ativos</div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{activeDevs}</div>
          <div className="text-[11px] text-slate-400 mt-1">Credenciais ativas</div>
        </div>
      </div>

      {/* Companies & Devs Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                {activeSubView === 'empresas' ? 'Empresas Prestadoras' : 'Desenvolvedores (DEV) Cadastrados'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeSubView === 'empresas' 
                  ? 'Gerencie o credenciamento de empresas prestadoras de zeladoria.' 
                  : 'Gerencie os usuários administradores com permissão de acesso global DEV.'}
              </p>
            </div>

            {/* View Switcher: Empresas vs Devs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveSubView('empresas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubView === 'empresas'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubView === 'empresas' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {totalCompanies}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubView('devs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubView === 'devs'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Devs</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubView === 'devs' ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {totalDevs}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 min-w-[160px] sm:min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeSubView === 'empresas' ? 'Buscar empresa, CNPJ...' : 'Buscar desenvolvedor...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none cursor-pointer shrink-0"
              >
                <option value="todos">Todos status</option>
                <option value="ativas">Somente Ativos</option>
                <option value="inativas">Somente Inativos</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeSubView === 'empresas' ? (
                <button
                  onClick={handleOpenCreateCompany}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Empresa</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenCreateDev}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Dev</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table View: Empresas */}
        {activeSubView === 'empresas' && (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">CNPJ</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Data Cadastro</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Nenhuma empresa encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{c.trade_name}</div>
                        <div className="text-[11px] text-slate-400">{c.legal_name}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{c.cnpj}</td>
                      <td className="px-5 py-3.5 font-medium">{c.responsible_name}</td>
                      <td className="px-5 py-3.5 text-slate-500">{c.email}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          title={c.status === 'Ativa' ? 'Desativar empresa' : 'Ativar empresa'}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            c.status === 'Ativa' 
                              ? 'text-amber-600 hover:bg-amber-50' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditCompany(c)}
                          title="Editar dados"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenResetForCompany(c)}
                          title="Redefinir senha diretamente"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setCompanyToDelete(c);
                            setShowDeleteModal(true);
                          }}
                          title="Excluir (Soft delete)"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
        )}

        {/* Table View: Desenvolvedores (DEV) */}
        {activeSubView === 'devs' && (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-5 py-3">Desenvolvedor (DEV)</th>
                  <th className="px-5 py-3">E-mail de Acesso (Login)</th>
                  <th className="px-5 py-3">Telefone / WhatsApp</th>
                  <th className="px-5 py-3">Localização</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Data Cadastro</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredDevs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Nenhum desenvolvedor encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredDevs.map((d) => {
                    const isCurrentUser = user?.id === d.id;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {d.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{d.name}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-extrabold rounded-md">
                                    Você
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Acesso DEV Global</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800 lowercase">
                          {d.email}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {d.phone || 'Não informado'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {d.city ? `${d.city} / ${d.state || 'SP'}` : 'Não informado'}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {new Date(d.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleToggleDevStatus(d)}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? 'Não é possível desativar sua própria sessão' : d.status === 'Ativo' ? 'Desativar acesso DEV' : 'Ativar acesso DEV'}
                            className={`p-1.5 rounded-lg transition ${
                              isCurrentUser 
                                ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                : d.status === 'Ativo'
                                ? 'text-amber-600 hover:bg-amber-50 cursor-pointer'
                                : 'text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEditDev(d)}
                            title="Editar dados do Dev"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenResetForDev(d)}
                            title="Redefinir senha diretamente"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setDevToDelete(d);
                              setShowDevDeleteModal(true);
                            }}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? 'Não é possível excluir seu próprio usuário em sessão' : 'Excluir Dev'}
                            className={`p-1.5 rounded-lg transition ${
                              isCurrentUser 
                                ? 'opacity-30 cursor-not-allowed text-slate-400' 
                                : 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
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
        )}
      </div>
        </>
      )}

      {/* Unified Registration & Edit Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title={
          editingCompany 
            ? `Editar Empresa: ${editingCompany.trade_name}`
            : editingDev
            ? `Editar Desenvolvedor: ${editingDev.name}`
            : 'Novo Cadastro no Sistema'
        }
        subtitle={
          editingCompany || editingDev
            ? 'Atualize as informações cadastrais abaixo.'
            : 'Escolha se deseja cadastrar uma Empresa de zeladoria ou outro Desenvolvedor (DEV).'
        }
        maxWidth="xl"
      >
        {/* Toggle between "Cadastrar Empresa" and "Cadastrar Dev" */}
        {!editingCompany && !editingDev && (
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => setRegisterType('empresa')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
                registerType === 'empresa'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Cadastrar Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => setRegisterType('dev')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
                registerType === 'dev'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Cadastrar Dev</span>
            </button>
          </div>
        )}

        {/* 1. Cadastrar / Editar Empresa */}
        {registerType === 'empresa' && (
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  required
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value.toUpperCase() })}
                  placeholder="Ex: ZELADORIA MODELO LTDA"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value.toUpperCase() })}
                  placeholder="Ex: ZELADORIA MODELO"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ *</label>
                <input
                  type="text"
                  required
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.toUpperCase() })}
                  placeholder="00.000.000/0001-00"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  placeholder="contato@empresa.com"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 lowercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.toUpperCase() })}
                  placeholder="(11) 99999-9999"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                placeholder="RUA, NÚMERO, BAIRRO"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value.toUpperCase() })}
                  placeholder="SÃO PAULO"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Ativa' | 'Inativa' })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Inativa">Inativa</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Dados do Responsável pela Empresa</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome do Responsável *</label>
                  <input
                    type="text"
                    required
                    value={formData.responsible_name}
                    onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value.toUpperCase() })}
                    placeholder="NOME COMPLETO"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">E-mail do Responsável *</label>
                  <input
                    type="email"
                    required
                    value={formData.responsible_email}
                    onChange={(e) => setFormData({ ...formData, responsible_email: e.target.value.toLowerCase() })}
                    placeholder="responsavel@empresa.com"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 lowercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Telefone do Responsável</label>
                  <input
                    type="text"
                    value={formData.responsible_phone}
                    onChange={(e) => setFormData({ ...formData, responsible_phone: e.target.value.toUpperCase() })}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition cursor-pointer"
              >
                {editingCompany ? 'Salvar Alterações' : 'Concluir Cadastro da Empresa'}
              </button>
            </div>
          </form>
        )}

        {/* 2. Cadastrar / Editar Desenvolvedor (DEV) */}
        {registerType === 'dev' && (
          <form onSubmit={handleSaveDev} className="space-y-4">
            {/* Informational banner about DEV privileges */}
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-purple-950 font-bold">Acesso Administrativo Global (DEV)</strong>
                <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                  Este usuário terá acesso total ao painel global DEV, com permissão para gerenciar todas as empresas prestadoras, criar novos administradores e operar em modo demonstração multi-tenant.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo do Dev *</label>
                <input
                  type="text"
                  required
                  value={devFormData.name}
                  onChange={(e) => setDevFormData({ ...devFormData, name: e.target.value.toUpperCase() })}
                  placeholder="EX: CARLOS ALBERTO SILVA (DEV)"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 uppercase font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail de Login (DEV) *</label>
                <input
                  type="email"
                  required
                  value={devFormData.email}
                  onChange={(e) => setDevFormData({ ...devFormData, email: e.target.value.toLowerCase() })}
                  placeholder="dev.carlos@empresa.com"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 lowercase font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Utilizado para autenticação na tela inicial</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={devFormData.phone}
                  onChange={(e) => setDevFormData({ ...devFormData, phone: e.target.value.toUpperCase() })}
                  placeholder="(11) 98888-7777"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPF (Opcional)</label>
                <input
                  type="text"
                  value={devFormData.cpf}
                  onChange={(e) => setDevFormData({ ...devFormData, cpf: e.target.value.toUpperCase() })}
                  placeholder="000.000.000-00"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status do Acesso</label>
                <select
                  value={devFormData.status}
                  onChange={(e) => setDevFormData({ ...devFormData, status: e.target.value as 'Ativo' | 'Inativo' })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="Ativo">Ativo (Acesso Liberado)</option>
                  <option value="Inativo">Inativo (Acesso Bloqueado)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={devFormData.city}
                  onChange={(e) => setDevFormData({ ...devFormData, city: e.target.value.toUpperCase() })}
                  placeholder="SÃO PAULO"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={devFormData.state}
                  onChange={(e) => setDevFormData({ ...devFormData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observações / Escopo do Dev</label>
              <input
                type="text"
                value={devFormData.notes}
                onChange={(e) => setDevFormData({ ...devFormData, notes: e.target.value.toUpperCase() })}
                placeholder="EX: ENGENHARIA DE SOFTWARE / SUPORTE OPERACIONAL"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition cursor-pointer"
              >
                {editingDev ? 'Salvar Alterações do Dev' : 'Concluir Cadastro do Dev'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Company Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir "${companyToDelete?.trade_name}"? Esta ação aplicará exclusão lógica (soft delete) para proteger histórico e registros de tarefas.`}
        confirmText="Sim, excluir empresa"
        cancelText="Cancelar"
        isDestructive={true}
      />

      {/* Delete Dev Confirmation */}
      <ConfirmModal
        isOpen={showDevDeleteModal}
        onClose={() => {
          setShowDevDeleteModal(false);
          setDevToDelete(null);
        }}
        onConfirm={handleConfirmDeleteDev}
        title="Excluir Desenvolvedor (DEV)"
        message={`Tem certeza que deseja revogar o acesso do desenvolvedor "${devToDelete?.name}"? Ele perderá imediatamente as credenciais de acesso DEV.`}
        confirmText="Sim, excluir desenvolvedor"
        cancelText="Cancelar"
        isDestructive={true}
      />

      {/* Direct Password Reset Modal (Directly in Dashboard without email link) */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setUserToResetPassword(null);
        }}
        title="Redefinir Senha Diretamente no Painel"
        subtitle={userToResetPassword ? `${userToResetPassword.name} • ${userToResetPassword.email}` : 'Alteração imediata de credencial'}
      >
        <form onSubmit={handleSaveDirectPassword} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
            <span className="font-bold block mb-1">Acesso Direto DEV:</span>
            A nova senha será salva <strong>diretamente no sistema</strong> sem o envio de link de recuperação por e-mail. O usuário poderá utilizá-la imediatamente para login.
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Nova Senha</label>
              <button
                type="button"
                onClick={handleGenerateRandomPassword}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
              >
                Gerar Senha Automática
              </button>
            </div>
            <div className="relative">
              <input
                type={showDirectPassword ? 'text' : 'password'}
                value={newDirectPassword}
                onChange={(e) => setNewDirectPassword(e.target.value)}
                placeholder="Digite a nova senha (mínimo 4 dígitos)"
                required
                minLength={4}
                className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowDirectPassword(!showDirectPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showDirectPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Confirmar Nova Senha</label>
            <input
              type={showDirectPassword ? 'text' : 'password'}
              value={confirmDirectPassword}
              onChange={(e) => setConfirmDirectPassword(e.target.value)}
              placeholder="Confirme a nova senha exatamente igual"
              required
              minLength={4}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowResetModal(false);
                setUserToResetPassword(null);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isResettingPassword}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isResettingPassword ? 'Gravando...' : 'Salvar Nova Senha'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
