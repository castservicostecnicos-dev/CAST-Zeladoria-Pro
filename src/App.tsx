import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Login } from './pages/auth/Login';
import { DevDashboard } from './pages/dev/DevDashboard';
import { EmpresaDashboard } from './pages/empresa/EmpresaDashboard';
import { ZeladorDashboard } from './pages/zelador/ZeladorDashboard';
import { AdmPredialDashboard } from './pages/adm_predial/AdmPredialDashboard';
import { DemoGuide } from './pages/demo/DemoGuide';
import { MyProfile } from './pages/profile/MyProfile';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OfflineIndicator } from './components/ui/PWAInstallButton';

function AppContent() {
  const { user, role, isLoading, switchDemoRole, isDevMaster } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Define valid tabs per role to prevent blank screens when alternating profiles
  const getValidTabsForRole = (r: string): string[] => {
    switch (r) {
      case 'DEV':
        return ['dashboard', 'empresas', 'demonstracao', 'perfil'];
      case 'EMPRESA':
        return ['dashboard', 'tarefas', 'rotinas', 'solicitacoes', 'zeladores', 'adm_predial', 'relatorios', 'google_drive', 'perfil'];
      case 'ZELADOR':
        return ['dashboard', 'tarefas', 'perfil'];
      case 'ADM_PREDIAL':
        return ['dashboard', 'tarefas', 'solicitacoes', 'relatorios', 'perfil'];
      default:
        return ['dashboard', 'perfil'];
    }
  };

  // When role changes (e.g. demo role switch or login), ensure the activeTab belongs to this role
  useEffect(() => {
    if (!role) return;
    const validTabs = getValidTabsForRole(role);
    if (!validTabs.includes(activeTab)) {
      setActiveTab('dashboard');
      setTabHistory([]);
    }
  }, [role]);

  const handleSelectTab = (newTab: string) => {
    if (newTab === 'demonstracao' && !isDevMaster) {
      return;
    }
    if (newTab === 'google_drive') {
      localStorage.setItem('profile_subtab', 'google_drive');
      if (activeTab !== 'perfil') {
        setTabHistory(prev => [...prev, activeTab]);
        setActiveTab('perfil');
      }
      return;
    }
    if (newTab !== activeTab) {
      setTabHistory(prev => [...prev, activeTab]);
      setActiveTab(newTab);
    }
  };

  const handleGoBack = () => {
    if (tabHistory.length > 0) {
      const nextHistory = [...tabHistory];
      const prevTab = nextHistory.pop()!;
      setTabHistory(nextHistory);
      setActiveTab(prevTab);
    } else if (isDevMaster && role !== 'DEV') {
      switchDemoRole('DEV');
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Carregando Zeladoria Pro...</p>
      </div>
    );
  }

  // If unauthenticated, show Login
  if (!user || !role) {
    return (
      <>
        <OfflineIndicator />
        <Login />
      </>
    );
  }

  // Get Page Title
  const getPageTitle = () => {
    if (activeTab === 'perfil') return 'Meu Perfil';
    if (activeTab === 'demonstracao') return 'Modo Demonstração';

    switch (role) {
      case 'DEV':
        return activeTab === 'empresas' ? 'Gestão de Empresas' : 'Painel DEV Admin';
      case 'EMPRESA':
        return activeTab === 'tarefas' 
          ? 'Gestão de Tarefas' 
          : activeTab === 'rotinas' 
          ? 'Rotinas Recorrentes' 
          : activeTab === 'solicitacoes' 
          ? 'Solicitações Prediais'
          : activeTab === 'condominios'
          ? 'Gestão de Condomínios'
          : activeTab === 'zeladores'
          ? 'Equipe de Zeladores'
          : activeTab === 'adm_predial'
          ? 'Administradores Prediais'
          : activeTab === 'relatorios'
          ? 'Relatórios de Gestão'
          : activeTab === 'google_drive'
          ? 'Google Drive Corporativo'
          : 'Painel da Empresa';
      case 'ZELADOR':
        return 'Minhas Tarefas';
      case 'ADM_PREDIAL':
        return activeTab === 'solicitacoes' 
          ? 'Minhas Solicitações' 
          : activeTab === 'relatorios'
          ? 'Relatórios Diários (PDF)'
          : 'Painel do Condomínio';
      default:
        return 'Zeladoria Pro';
    }
  };

  // Render role-specific main view
  const renderMainContent = () => {
    if (activeTab === 'perfil') {
      return <MyProfile onBack={handleGoBack} />;
    }

    if (activeTab === 'demonstracao') {
      return <DemoGuide />;
    }

    switch (role) {
      case 'DEV':
        return (
          <DevDashboard 
            activeTab={activeTab} 
            onSelectTab={handleSelectTab} 
          />
        );
      case 'EMPRESA':
        return (
          <EmpresaDashboard 
            activeSubTab={activeTab} 
            onSelectSubTab={handleSelectTab} 
          />
        );
      case 'ZELADOR':
        return <ZeladorDashboard onBack={handleGoBack} />;
      case 'ADM_PREDIAL':
        return (
          <AdmPredialDashboard 
            activeTabProp={activeTab}
            onSelectTab={handleSelectTab}
          />
        );
      default:
        return <Login />;
    }
  };

  const canGoBack = activeTab !== 'dashboard' || tabHistory.length > 0 || (isDevMaster && role !== 'DEV');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 w-full max-w-full overflow-x-hidden">
      <OfflineIndicator />

      {/* Sidebar Navigation (Oculto para Zelador, que utiliza navegação pelo ícone de perfil) */}
      {role !== 'ZELADOR' && (
        <Sidebar
          currentTab={activeTab}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        <Header 
          title={getPageTitle()}
          onToggleSidebar={role !== 'ZELADOR' ? () => setIsMobileSidebarOpen(!isMobileSidebarOpen) : undefined} 
          onReturnToDev={() => {
            if (isDevMaster) {
              switchDemoRole('DEV');
              handleSelectTab('demonstracao');
            }
          }}
          onGoBack={handleGoBack}
          canGoBack={canGoBack}
          onSelectTab={handleSelectTab}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
