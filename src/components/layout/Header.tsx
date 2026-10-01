import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  User, 
  LogOut, 
  Building2, 
  Sparkles, 
  Check, 
  ChevronDown, 
  Menu,
  Shield,
  ShieldAlert,
  ArrowLeft,
  Settings,
  CheckSquare,
  HardDrive,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DataStore } from '../../services/store';
import { Notification, UserRole } from '../../types';
import { PWAInstallButton } from '../ui/PWAInstallButton';

interface HeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
  onReturnToDev?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  title, 
  onReturnToDev, 
  onGoBack, 
  canGoBack = false,
  onSelectTab 
}) => {
  const { user, company, property, role, isDemoMode, isDevMaster, switchDemoRole, signOut, navigate } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
      if (demoMenuRef.current && !demoMenuRef.current.contains(target)) {
        setShowDemoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      DataStore.getNotifications(user.id).then(list => {
        if (isMounted) setNotifications(list);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await DataStore.markNotificationAsRead(id);
    if (user) {
      const list = await DataStore.getNotifications(user.id);
      setNotifications(list);
    }
  };

  const handleMarkAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.read) {
        await DataStore.markNotificationAsRead(n.id);
      }
    }
    if (user) {
      const list = await DataStore.getNotifications(user.id);
      setNotifications(list);
    }
  };

  const handleReturnToDev = () => {
    if (onReturnToDev) {
      onReturnToDev();
    } else {
      switchDemoRole('DEV');
    }
  };

  const getRoleBadge = (r: UserRole | null) => {
    switch (r) {
      case 'DEV':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">DEV ADMIN</span>;
      case 'EMPRESA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">EMPRESA</span>;
      case 'ZELADOR':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">ZELADOR</span>;
      case 'ADM_PREDIAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">ADM PREDIAL</span>;
      default:
        return null;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shadow-xs w-full max-w-full overflow-visible">
      {/* Left side */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {onToggleSidebar && role !== 'ZELADOR' && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {onGoBack && canGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200 shrink-0"
            title="Voltar à tela anterior"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-none">
              {title || 'Painel de Zeladoria'}
            </h1>
            <div className="hidden xs:block shrink-0">
              {getRoleBadge(role)}
            </div>
            {isDevMaster && role !== 'DEV' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                Simulação DEV
              </span>
            )}
          </div>
          {(company || property) && (
            <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1 truncate max-w-[180px] sm:max-w-xs md:max-w-none">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{company?.trade_name || company?.legal_name}</span>
              {property && <span className="text-slate-400 shrink-0">• {property.name}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Prominent Return to DEV button - EXCLUSIVO para usuário original DEV visualizando outro papel */}
        {isDevMaster && role !== 'DEV' && (
          <button
            onClick={handleReturnToDev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0 animate-fade-in"
            title="Retornar ao painel de Administrador DEV"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <Shield className="w-3.5 h-3.5" />
            <span>Voltar ao DEV</span>
          </button>
        )}

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Role Switcher (Demonstration) - EXCLUSIVO para quem tem acesso DEV */}
        {isDevMaster && (
          <div className="relative" ref={demoMenuRef}>
            <button
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-semibold transition cursor-pointer"
              title="Alternar Perfil em Demonstração (Acesso DEV)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="font-bold text-purple-900 hidden sm:inline">Demo: {role}</span>
              <ChevronDown className="w-3 h-3 text-purple-400 shrink-0" />
            </button>

            {showDemoDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                <div className="px-3 py-1.5 border-b border-purple-100 text-xs font-semibold text-purple-900 flex items-center justify-between bg-purple-50/60">
                  <span>Demonstração de Perfis (DEV)</span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold">4 Papéis</span>
                </div>
                {(['DEV', 'EMPRESA', 'ZELADOR', 'ADM_PREDIAL'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchDemoRole(r);
                      if (onSelectTab) onSelectTab('dashboard');
                      setShowDemoDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-purple-50/60 transition cursor-pointer ${
                      role === r ? 'font-bold text-purple-700 bg-purple-50' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1.5">
                        {r === 'DEV' ? <Shield className="w-3 h-3 text-purple-600" /> : null}
                        {r === 'DEV' ? 'Administrador Global (DEV)' : r === 'EMPRESA' ? 'Gestão da Empresa' : r === 'ZELADOR' ? 'Zelador em Campo' : 'Síndico / ADM Predial'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {r === 'DEV' ? 'cast.servicostecnicos@gmail.com' : r === 'EMPRESA' ? 'empresa@cast.com' : r === 'ZELADOR' ? 'zelador@cast.com' : 'adm@cast.com'}
                      </span>
                    </div>
                    {role === r && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notification Bell with counter */}
        <button
          onClick={() => setShowNotifModal(true)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative cursor-pointer"
          aria-label="Abrir notificações"
          title="Abrir notificações"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar & Menu (Ícone com as iniciais para Perfil e Configurações) */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
            title="Acessar Configurações e Meu Perfil"
            aria-label="Abrir menu de configurações do usuário"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm ring-2 ring-blue-100">
              {user?.name ? user.name.slice(0, 2) : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                {user?.name || 'Usuário'}
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-1">
                {user?.email}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${showUserDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in overflow-hidden">
              {/* Header do Usuário */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                    {user?.name ? user.name.slice(0, 2) : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-600">Papel:</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">
                    {role === 'ZELADOR' ? 'Zelador em Campo' : role === 'EMPRESA' ? 'Gestão Empresa' : role === 'ADM_PREDIAL' ? 'Síndico / ADM Predial' : 'Desenvolvedor DEV'}
                  </span>
                </div>
              </div>

              {/* Opções do Menu */}
              <div className="py-1">
                {role === 'ZELADOR' && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onSelectTab) onSelectTab('dashboard');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Minhas Tarefas (Início)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    localStorage.setItem('profile_subtab', 'perfil');
                    window.dispatchEvent(new CustomEvent('switch-profile-subtab', { detail: 'perfil' }));
                    setShowUserDropdown(false);
                    if (onSelectTab) onSelectTab('perfil');
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Meu Perfil & Cadastro</span>
                </button>

                <button
                  onClick={() => {
                    localStorage.setItem('profile_subtab', 'configuracoes');
                    window.dispatchEvent(new CustomEvent('switch-profile-subtab', { detail: 'configuracoes' }));
                    setShowUserDropdown(false);
                    if (onSelectTab) onSelectTab('perfil');
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Configurações da Conta</span>
                </button>

                {(role === 'EMPRESA' || isDevMaster) && (
                  <button
                    onClick={() => {
                      localStorage.setItem('profile_subtab', 'google_drive');
                      window.dispatchEvent(new CustomEvent('switch-profile-subtab', { detail: 'google_drive' }));
                      setShowUserDropdown(false);
                      if (onSelectTab) onSelectTab('perfil');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Google Drive Corporativo</span>
                  </button>
                )}

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    signOut();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer font-semibold"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pop-up Modal de Notificações (Centralizado e Responsivo para Desktop e Mobile) */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          {/* Backdrop click to close */}
          <div 
            className="fixed inset-0 -z-10" 
            onClick={() => setShowNotifModal(false)} 
          />

          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-modal-title"
          >
            {/* Header do Pop-up */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="notif-modal-title" className="text-sm font-bold text-slate-900">Notificações</h3>
                  <p className="text-[11px] text-slate-500">
                    {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo atualizado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                  >
                    Marcar lidas
                  </button>
                )}
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                  title="Fechar"
                  aria-label="Fechar pop-up"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Nenhuma notificação registrada</p>
                  <p className="text-[11px] text-slate-400 mt-1">Você será avisado sobre tarefas e atualizações aqui.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    className={`p-3.5 rounded-2xl transition cursor-pointer mb-1.5 ${
                      !n.read 
                        ? 'bg-blue-50/70 border border-blue-100 hover:bg-blue-100/60' 
                        : 'bg-white hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs font-bold ${!n.read ? 'text-blue-900' : 'text-slate-800'}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                        {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    {!n.read && (
                      <div className="mt-2 flex justify-end">
                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Toque para marcar como lida
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer com botão fechar */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Total: {notifications.length} avisos</span>
              <button
                type="button"
                onClick={() => setShowNotifModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
