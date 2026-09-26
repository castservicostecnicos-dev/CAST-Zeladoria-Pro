import React from 'react';
import { 
  Shield, 
  Layers, 
  Wrench, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

export const DemoGuide: React.FC = () => {
  const { role, switchDemoRole, isDevMaster } = useAuth();

  if (!isDevMaster) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-300">
        <p className="text-sm font-semibold">Acesso restrito ao Administrador DEV.</p>
      </div>
    );
  }

  const demoProfiles: {
    role: UserRole;
    title: string;
    subtitle: string;
    description: string;
    highlights: string[];
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeColor: string;
    userEmail: string;
  }[] = [
    {
      role: 'DEV',
      title: 'DEV',
      subtitle: 'Administração da plataforma',
      description: 'Visão do administrador global e proprietário do SaaS. Controla as empresas clientes cadastradas, ativação, exclusão e tenants.',
      highlights: [
        'Cadastro e controle de empresas parceiras',
        'Ativação e desativação de tenants',
        'Soft delete com proteção de dados',
        'Acesso restrito a dados operacionais dos clientes'
      ],
      icon: Shield,
      accentColor: 'border-purple-200 hover:border-purple-500 bg-purple-50/20',
      badgeColor: 'bg-purple-100 text-purple-700',
      userEmail: 'cast.servicostecnicos@gmail.com',
    },
    {
      role: 'EMPRESA',
      title: 'EMPRESA',
      subtitle: 'Gestão operacional',
      description: 'Visão da empresa prestadora de serviços de zeladoria. Gerencia toda a operação: tarefas, rotinas, zeladores, síndicos e relatórios.',
      highlights: [
        'Criação de tarefas e rotinas automáticas',
        'Aprovação de solicitações do ADM Predial',
        'Gestão de zeladores e condomínios',
        'Relatórios e exportação CSV'
      ],
      icon: Layers,
      accentColor: 'border-blue-200 hover:border-blue-500 bg-blue-50/20',
      badgeColor: 'bg-blue-100 text-blue-700',
      userEmail: 'empresa@cast.com',
    },
    {
      role: 'ZELADOR',
      title: 'ZELADOR',
      subtitle: 'Execução das tarefas',
      description: 'Interface simplificada e mobile-first, desenhada para rápida visualização em campo: "Ver o que preciso fazer hoje", aceitar, iniciar e concluir com fotos.',
      highlights: [
        'Visualização direta: tarefas de hoje',
        'Máquina de estados: Pendente → Aceita → Andamento → Concluída',
        'Upload de foto e descrição do serviço obrigatória',
        'Bloqueio automático após conclusão'
      ],
      icon: Wrench,
      accentColor: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/20',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      userEmail: 'zelador@cast.com',
    },
    {
      role: 'ADM_PREDIAL',
      title: 'ADM PREDIAL',
      subtitle: 'Solicitação e acompanhamento',
      description: 'Visão do síndico ou gestor do condomínio. Acompanha os serviços executados no prédio e pode solicitar novas tarefas diretamente.',
      highlights: [
        'Acompanhamento de tarefas do seu condomínio',
        'Botão "Solicitar Nova Tarefa"',
        'Rastreio de status da solicitação em tempo real',
        'Acesso estritamente limitado ao seu prédio'
      ],
      icon: Building2,
      accentColor: 'border-amber-200 hover:border-amber-500 bg-amber-50/20',
      badgeColor: 'bg-amber-100 text-amber-700',
      userEmail: 'adm@cast.com',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Demonstração Multi-Perfil Integrada
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Navegue entre os 4 Papéis do Sistema
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          Selecione qualquer perfil abaixo para visualizar sua interface e regras de negócio. Ao entrar em qualquer outro perfil, utilize o botão <strong>"Voltar ao Acesso DEV"</strong> no topo da tela para retornar a esta dashboard sem reiniciar o sistema.
        </p>
      </div>

      {/* 4 Cards (Section 36) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {demoProfiles.map((p) => {
          const Icon = p.icon;
          const isCurrent = role === p.role;

          return (
            <div
              key={p.role}
              className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all ${p.accentColor} ${
                isCurrent ? 'ring-2 ring-blue-600 shadow-md' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${p.badgeColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.badgeColor}`}>
                        {p.title}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{p.subtitle}</h3>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                      Perfil Ativo
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Principais Recursos:
                  </span>
                  {p.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">{p.userEmail}</span>
                <button
                  onClick={() => switchDemoRole(p.role)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition shadow-sm"
                >
                  <span>Entrar na demonstração</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
