import React, { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DataStore } from '../../services/store';
import { Notification, UserRole } from '../../types';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { GoogleDriveButton } from '../common/GoogleDriveButton';

interface HeaderProps {
  onToggleSidebar?: () => void;
  title?: string;
  onReturnToDev?: () => void;
  onGoBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, onReturnToDev, onGoBack }) => {
  const { user, company, property, role, isDemoMode, switchDemoRole, signOut, navigate } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shadow-xs w-full max-w-full overflow-hidden">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200 shrink-0"
            title="Voltar à tela anterior"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Voltar</span>
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-none">
              {title || 'Painel de Zeladoria'}
            </h1>
            {getRoleBadge(role)}
          </div>
          {(company || property) && (
            <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-none">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{company?.trade_name || company?.legal_name}</span>
              {property && <span className="text-slate-400 shrink-0">• {property.name}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Prominent Return to DEV button when viewing other profiles */}
        {role !== 'DEV' && (
          <button
            onClick={handleReturnToDev}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm hover:shadow transition cursor-pointer animate-pulse-subtle shrink-0"
            title="Retornar ao painel de Administrador DEV"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voltar ao</span>
            <span>DEV</span>
          </button>
        )}

        {/* Google Drive Cloud Storage Indicator / Connect */}
        <GoogleDriveButton compact={true} />

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Role Switcher (Demonstration) */}
        <div className="relative">
          <button
            onClick={() => setShowDemoDropdown(!showDemoDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Alternar Perfil em Demonstração"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline text-slate-500">Perfil:</span>
            <span className="font-bold text-slate-900">{role}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showDemoDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Perfis de Demonstração</span>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">4 Papéis</span>
              </div>
              {(['DEV', 'EMPRESA', 'ZELADOR', 'ADM_PREDIAL'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchDemoRole(r);
                    setShowDemoDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                    role === r ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5">
                      {r === 'DEV' ? <Shield className="w-3 h-3 text-purple-600" /> : null}
                      {r === 'DEV' ? 'Administrador Global (DEV)' : r === 'EMPRESA' ? 'Gestão da Empresa' : r === 'ZELADOR' ? 'Zelador em Campo' : 'Síndico / ADM Predial'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {r === 'DEV' ? 'dev@demo.com' : r === 'EMPRESA' ? 'empresa@demo.com' : r === 'ZELADOR' ? 'zelador@demo.com' : 'adm@demo.com'}
                    </span>
                  </div>
                  {role === r && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell with counter */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
            aria-label="Ver notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notificações</span>
                <span className="text-[11px] text-slate-500">{unreadCount} não lida(s)</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhuma notificação registrada.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                        !n.read ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
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
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 lg:hidden">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  navigate('/perfil');
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
              >
                <User className="w-4 h-4 text-slate-400" />
                Meu Perfil
              </button>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  signOut();
                }}
                className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition border-t border-slate-100"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
