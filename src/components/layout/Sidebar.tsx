import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Repeat, 
  Inbox, 
  Users, 
  UserCheck, 
  BarChart3, 
  Building2, 
  PlayCircle, 
  User, 
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  isOpenMobile, 
  onCloseMobile 
}) => {
  const { role, signOut, isDemoMode, switchDemoRole } = useAuth();

  const getMenuItems = (userRole: UserRole | null) => {
    switch (userRole) {
      case 'DEV':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'empresas', label: 'Empresas', icon: Building2 },
          { id: 'demonstracao', label: 'Demonstração', icon: PlayCircle },
          { id: 'perfil', label: 'Meu Perfil', icon: User },
        ];
      case 'EMPRESA':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
          { id: 'rotinas', label: 'Rotinas', icon: Repeat },
          { id: 'solicitacoes', label: 'Solicitações', icon: Inbox },
          { id: 'zeladores', label: 'Zeladores', icon: Users },
          { id: 'adm_predial', label: 'ADM Predial', icon: UserCheck },
          { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
          { id: 'perfil', label: 'Meu Perfil', icon: User },
        ];
      case 'ZELADOR':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'tarefas', label: 'Minhas Tarefas', icon: CheckSquare },
          { id: 'perfil', label: 'Meu Perfil', icon: User },
        ];
      case 'ADM_PREDIAL':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
          { id: 'solicitacoes', label: 'Solicitações', icon: Inbox },
          { id: 'relatorios', label: 'Relatórios (PDF)', icon: BarChart3 },
          { id: 'perfil', label: 'Meu Perfil', icon: User },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Logo */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">Zeladoria</span>
              <span className="text-blue-400 text-base font-bold ml-1">Pro</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase px-3 py-1 tracking-wider">
              Menu Principal
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions & Session info */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Quick Return to DEV button in Sidebar when user is in another role */}
          {role !== 'DEV' && (
            <button
              onClick={() => {
                switchDemoRole('DEV');
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Voltar ao Acesso DEV</span>
            </button>
          )}

          {isDemoMode && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-tight flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Você está navegando no ambiente de demonstração com dados de teste.</span>
            </div>
          )}

          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};
