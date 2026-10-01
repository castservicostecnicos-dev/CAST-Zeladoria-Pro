import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  CheckCircle2, 
  ArrowLeft,
  Settings,
  Bell,
  KeyRound,
  Eye,
  EyeOff,
  HardDrive,
  ExternalLink,
  Folder,
  Loader2,
  Check,
  RefreshCw,
  CloudUpload,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DataStore } from '../../services/store';
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  isDriveConnected,
  extractDriveFolderId,
  testDriveConnection
} from '../../services/googleDriveService';

interface MyProfileProps {
  onBack?: () => void;
}

type ProfileSubTab = 'perfil' | 'configuracoes' | 'google_drive';

export const MyProfile: React.FC<MyProfileProps> = ({ onBack }) => {
  const { user, company, property, role, updateCurrentUser, requestPasswordReset, refreshCompany } = useAuth();
  const toast = useToast();

  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTab>(() => {
    const stored = localStorage.getItem('profile_subtab');
    if (stored === 'configuracoes' || stored === 'google_drive') {
      return stored as ProfileSubTab;
    }
    return 'perfil';
  });

  useEffect(() => {
    const handleSwitchEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === 'configuracoes' || customEvent.detail === 'google_drive' || customEvent.detail === 'perfil') {
        setActiveSubTab(customEvent.detail as ProfileSubTab);
      }
    };

    window.addEventListener('switch-profile-subtab', handleSwitchEvent);
    return () => {
      window.removeEventListener('switch-profile-subtab', handleSwitchEvent);
    };
  }, []);

  const handleSwitchTab = (tab: ProfileSubTab) => {
    setActiveSubTab(tab);
    localStorage.setItem('profile_subtab', tab);
  };

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

  useEffect(() => {
    if (company) {
      setDriveFolderUrl(company.google_drive_folder_url || '');
      setDriveFolderId(company.google_drive_folder_id || '');
      setDriveFolderName(company.google_drive_folder_name || 'CAST - Documentos e Relatórios');
      setDriveEmail(company.google_drive_email || 'empresa@cast.com');
      setIsDriveAuthConnected(isDriveConnected() || Boolean(company.google_drive_connected));
    }
  }, [company]);

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
      toast.success('Dados cadastrais atualizados!');
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
      toast.success('Sua nova senha foi atualizada!');
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
      toast.info(`Link de redefinição enviado para ${user.email}.`);
    } catch (err: any) {
      toast.error('Não foi possível enviar e-mail: ' + (err?.message || 'Falha.'));
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Google Drive Handlers
  const handleConnectDrive = async () => {
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

      if (company && user) {
        await DataStore.updateCompany(company.id, {
          google_drive_connected: true,
          google_drive_connected_at: new Date().toISOString(),
          google_drive_email: emailToSave,
        }, user);
        await refreshCompany();
      }
      toast.success('Conta Google conectada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao conectar Google Drive: ' + (err?.message || 'Falha na autenticação.'));
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
    toast.info('Google Drive desconectado da sessão.');
  };

  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    setIsSavingDriveConfig(true);
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
      toast.success('Cadastro do Google Drive salvo!');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err?.message || 'Falha.'));
    } finally {
      setIsSavingDriveConfig(false);
    }
  };

  const handleTestDrive = async () => {
    setIsTestingDrive(true);
    setDriveTestMessage(null);
    try {
      const res = await testDriveConnection();
      if (res.success) {
        setDriveTestMessage({
          type: 'success',
          text: `Conexão bem-sucedida! Conta: ${res.userEmail || driveEmail}`,
        });
        toast.success('Google Drive verificado!');
      } else {
        setDriveTestMessage({
          type: 'error',
          text: 'Google Drive desconectado. Clique em "Conectar Conta Google".',
        });
      }
    } catch (err: any) {
      setDriveTestMessage({
        type: 'error',
        text: 'Erro no teste: ' + (err?.message || 'Verifique as permissões da conta Google.'),
      });
    } finally {
      setIsTestingDrive(false);
    }
  };

  return (
    <div className="w-full max-w-full sm:max-w-2xl mx-auto space-y-5 overflow-x-hidden animate-fade-in pb-12">
      {/* Botão de retorno */}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
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

        {/* Sub-abas de Navegação */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 my-4 pb-2">
          <button
            type="button"
            onClick={() => handleSwitchTab('perfil')}
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
            onClick={() => handleSwitchTab('configuracoes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'configuracoes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações & Senha</span>
          </button>

          {(role === 'EMPRESA' || role === 'DEV') && (
            <button
              type="button"
              onClick={() => handleSwitchTab('google_drive')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'google_drive'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Google Drive Corporativo</span>
            </button>
          )}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
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

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>{isSaving ? 'Salvando...' : 'Salvar Dados'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Configurações da Conta & Senha */}
        {activeSubTab === 'configuracoes' && (
          <div className="space-y-5 pt-1 animate-fade-in">
            {/* Alteração Direta de Senha */}
            <form onSubmit={handleSaveNewPassword} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Alterar Senha</span>
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
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirmar Senha *</label>
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
                  {isSendingResetEmail ? 'Enviando...' : 'Enviar link por e-mail'}
                </button>

                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isChangingPassword ? 'Salvando...' : 'Salvar Senha'}
                </button>
              </div>
            </form>

            {/* Preferências de Notificação */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">Alertas de Tarefas</div>
                  <div className="text-[11px] text-slate-400">Notificações no dispositivo</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  toast.info(`Alertas ${!notificationsEnabled ? 'ativados' : 'desativados'}.`);
                }}
                className={`w-11 h-6 rounded-full transition p-1 cursor-pointer flex items-center ${
                  notificationsEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Google Drive Corporativo (Apenas Opção de Cadastro) */}
        {activeSubTab === 'google_drive' && (role === 'EMPRESA' || role === 'DEV') && (
          <form onSubmit={handleSaveDriveConfig} className="space-y-4 pt-1 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">Cadastro do Google Drive</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDriveAuthConnected 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDriveAuthConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {isDriveAuthConnected ? 'Conectado' : 'Desconectado'}
                </span>
                {company?.google_drive_folder_url && (
                  <a
                    href={company.google_drive_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold ml-1"
                  >
                    <span>Abrir Pasta</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
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

            <div className="space-y-3">
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
        )}
      </div>
    </div>
  );
};
