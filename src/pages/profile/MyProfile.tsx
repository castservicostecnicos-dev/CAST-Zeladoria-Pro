import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Shield, 
  Building2, 
  Lock, 
  CheckCircle2, 
  ArrowLeft,
  Settings,
  Bell,
  CheckSquare,
  KeyRound,
  Eye,
  EyeOff,
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DataStore } from '../../services/store';

interface MyProfileProps {
  onBack?: () => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ onBack }) => {
  const { user, company, property, role, updateCurrentUser, requestPasswordReset, navigate } = useAuth();
  const toast = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'configuracoes'>(() => {
    return localStorage.getItem('profile_subtab') === 'configuracoes' ? 'configuracoes' : 'perfil';
  });

  React.useEffect(() => {
    const stored = localStorage.getItem('profile_subtab');
    if (stored === 'configuracoes' || stored === 'perfil') {
      setActiveSubTab(stored);
    }
  }, []);

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || 'SP');
  const [isSaving, setIsSaving] = useState(false);

  // Settings / Password Form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  // App notification preference
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateCurrentUser({
        name: name.trim().toUpperCase(),
        phone: phone.trim().toUpperCase(),
        cpf: cpf.trim().toUpperCase(),
        city: city.trim().toUpperCase(),
        state: state.trim().toUpperCase(),
      });
      toast.success('Dados cadastrais atualizados com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar perfil: ' + (err?.message || 'Falha.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newPassword || newPassword.length < 4) {
      toast.warning('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning('As senhas não conferem. Digite a mesma senha nos dois campos.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await DataStore.resetUserPassword(user.id, newPassword, user);
      toast.success('Sua nova senha foi atualizada com sucesso e já está ativa!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Erro ao salvar nova senha: ' + (err?.message || 'Falha.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordResetEmail = async () => {
    if (!user) return;
    setIsSendingResetEmail(true);
    try {
      await requestPasswordReset(user.email);
      toast.info(`Link seguro de alteração de senha enviado para ${user.email}.`);
    } catch (err: any) {
      toast.error('Não foi possível enviar e-mail: ' + (err?.message || 'Falha.'));
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <div className="w-full max-w-full sm:max-w-2xl mx-auto space-y-5 overflow-x-hidden animate-fade-in pb-12">
      {/* Botão de retorno proeminente */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{role === 'ZELADOR' ? 'Voltar para Minhas Tarefas' : 'Voltar ao Painel'}</span>
          </button>
        </div>
      )}

      {/* Card Principal */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
        {/* Header do Usuário */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl sm:text-2xl uppercase shadow-md shadow-blue-500/20 ring-4 ring-blue-50 shrink-0">
              {user?.name ? user.name.slice(0, 2) : 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">{user?.name}</h2>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                  {role === 'ZELADOR' ? 'Zelador em Campo' : role}
                </span>
                {company && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{company.trade_name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-abas: Dados Cadastrais vs Configurações */}
        <div className="flex items-center gap-2 border-b border-slate-100 my-4 pb-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('perfil')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'perfil'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dados Cadastrais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('configuracoes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'configuracoes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações & Senha</span>
          </button>
        </div>

        {/* TAB 1: Dados Cadastrais */}
        {activeSubTab === 'perfil' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail de Login (Bloqueado)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 bg-slate-50 cursor-not-allowed lowercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.toUpperCase())}
                  placeholder="(11) 99999-9999"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.toUpperCase())}
                  placeholder="000.000.000-00"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>

            {/* Security lock info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Diretrizes de Segurança RBAC</span>
              </div>
              <p>
                Seu papel no sistema é <strong>{role === 'ZELADOR' ? 'Zelador em Campo' : role}</strong> vinculado à empresa <strong>{company?.trade_name || 'Global'}</strong>. Alterações de empresa ou papel devem ser solicitadas à gestão.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Dados Cadastrais'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Configurações da Conta & Senha */}
        {activeSubTab === 'configuracoes' && (
          <div className="space-y-6 pt-1 animate-fade-in">
            {/* Alteração Direta de Senha */}
            <form onSubmit={handleSaveNewPassword} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Alterar Minha Senha de Acesso</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nova Senha *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 pr-9 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirmar Nova Senha *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handlePasswordResetEmail}
                  disabled={isSendingResetEmail}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline disabled:opacity-50"
                >
                  {isSendingResetEmail ? 'Enviando e-mail...' : 'Enviar link de redefinição por e-mail'}
                </button>

                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isChangingPassword ? 'Gravando Senha...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>

            {/* Preferências do Aplicativo */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>Notificações & Alertas no Dispositivo</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div>
                  <div className="font-semibold text-slate-800">Alertas de Novas Tarefas</div>
                  <div className="text-[11px] text-slate-400">Receber avisos instantâneos quando uma tarefa for atribuída a você</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsEnabled(!notificationsEnabled);
                    toast.info(`Alertas de tarefas ${!notificationsEnabled ? 'ativados' : 'desativados'}.`);
                  }}
                  className={`w-11 h-6 rounded-full transition p-1 cursor-pointer flex items-center ${
                    notificationsEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Google Drive Corporativo (Exclusivo Empresa) */}
            {(role === 'EMPRESA' || role === 'DEV') && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>Google Drive Corporativo da Empresa</span>
                  </div>
                  {company?.google_drive_folder_url && (
                    <a
                      href={company.google_drive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Abrir Pasta Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Gerencie a pasta corporativa e a conexão de autenticação do Google Drive para upload automático de relatórios diários em PDF e fotos de comprovação.
                </p>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">
                    Conta: <strong>{company?.google_drive_email || 'empresa@cast.com'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onBack) onBack();
                      navigate('/empresa');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Acessar Configuração do Drive</span>
                  </button>
                </div>
              </div>
            )}

            {/* Informações Operacionais */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800">Vínculo Operacional</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Empresa Gestora:</span>{' '}
                  <strong className="text-slate-800">{company?.trade_name || 'Zeladoria Pro'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Condomínio Principal:</span>{' '}
                  <strong className="text-slate-800">{property?.name || 'Condomínio Modelo'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
