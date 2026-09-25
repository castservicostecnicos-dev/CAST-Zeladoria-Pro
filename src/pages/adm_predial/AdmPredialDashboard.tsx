import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Play, 
  Send, 
  Camera, 
  Eye, 
  Calendar, 
  MapPin,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { Task, TaskRequest, TaskPriority, Profile } from '../../types';
import { DataStore } from '../../services/store';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { DailyReportManager } from '../../components/reports/DailyReportManager';

interface AdmPredialDashboardProps {
  activeTabProp?: string;
  onSelectTab?: (tab: string) => void;
}

export const AdmPredialDashboard: React.FC<AdmPredialDashboardProps> = ({
  activeTabProp,
  onSelectTab
}) => {
  const { user, property, company } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [zeladores, setZeladores] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'tarefas' | 'solicitacoes' | 'relatorios'>('tarefas');

  useEffect(() => {
    if (activeTabProp === 'relatorios' || activeTabProp === 'solicitacoes' || activeTabProp === 'tarefas') {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  // New Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(null);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'NORMAL' as TaskPriority,
    desired_date: new Date().toISOString().split('T')[0],
    desired_time: '14:00',
    notes: '',
  });

  const loadData = async () => {
    if (!user || !user.company_id) return;
    const [tList, rList, pList] = await Promise.all([
      DataStore.getTasks(user),
      DataStore.getRequests(user.company_id, user.property_id || undefined),
      DataStore.getProfiles(user.company_id),
    ]);
    setTasks(tList);
    setRequests(rList);
    setZeladores(pList.filter(p => p.role === 'ZELADOR'));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.company_id) return;

    await DataStore.createRequest({
      company_id: user.company_id,
      property_id: user.property_id || (property?.id || 'prop-demo-001'),
      requested_by: user.id,
      title: requestForm.title,
      description: requestForm.description,
      location: requestForm.location,
      priority: requestForm.priority,
      desired_date: requestForm.desired_date,
      desired_time: requestForm.desired_time,
      notes: requestForm.notes,
    }, user);

    setShowRequestModal(false);
    setRequestForm({
      title: '',
      description: '',
      location: '',
      priority: 'NORMAL',
      desired_date: new Date().toISOString().split('T')[0],
      desired_time: '14:00',
      notes: '',
    });
    alert('Solicitação enviada com sucesso para a equipe de gestão da empresa!');
    loadData();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const tasksToday = tasks.filter(t => t.scheduled_date === todayStr);
  const tasksPending = tasks.filter(t => t.status === 'PENDENTE' || t.status === 'ACEITA');
  const tasksInProgress = tasks.filter(t => t.status === 'EM_ANDAMENTO');
  const tasksCompleted = tasks.filter(t => t.status === 'CONCLUIDA');

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Banner with "Solicitar Nova Tarefa" Button (Section 12) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Condomínio: {property?.name || 'Residencial Modelo'}
          </span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1">
            Painel do Administrador Predial & Síndico
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe a execução dos serviços do seu condomínio e envie solicitações para a empresa prestadora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('relatorios');
              if (onSelectTab) onSelectTab('relatorios');
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Relatório Diário (PDF)</span>
          </button>

          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Solicitar Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (Section 12) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500">Tarefas de Hoje</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{tasksToday.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Em execução</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-amber-600">Pendentes</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{tasksPending.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Aguardando zelador</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-blue-600">Em Andamento</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{tasksInProgress.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Sendo feitas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-emerald-600">Concluídas</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{tasksCompleted.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Com comprovante</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('tarefas');
            if (onSelectTab) onSelectTab('tarefas');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'tarefas'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tarefas do Condomínio ({tasks.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('solicitacoes');
            if (onSelectTab) onSelectTab('solicitacoes');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'solicitacoes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Minhas Solicitações ({requests.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('relatorios');
            if (onSelectTab) onSelectTab('relatorios');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'relatorios'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Relatório Diário (PDF)</span>
        </button>
      </div>

      {/* Tab: Tasks */}
      {activeTab === 'tarefas' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Tarefas em Execução no Empreendimento</h3>
            <span className="text-xs text-slate-400">{tasks.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-5 py-3">Tarefa</th>
                  <th className="px-5 py-3">Local</th>
                  <th className="px-5 py-3">Data / Horário</th>
                  <th className="px-5 py-3">Prioridade</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Nenhuma tarefa encontrada para este condomínio.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div>{t.title}</div>
                        <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{t.description}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{t.location || 'Geral'}</td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(`${t.scheduled_date}T00:00:00`).toLocaleDateString('pt-BR')} às {t.scheduled_time}
                      </td>
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedTaskDetails(t)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Requests */}
      {activeTab === 'solicitacoes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.length === 0 ? (
              <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                Nenhuma solicitação enviada até o momento. Clique em "Solicitar Nova Tarefa" para abrir uma demanda.
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <StatusBadge status={r.status} />
                      <PriorityBadge priority={r.priority} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div><strong>Local:</strong> {r.location}</div>
                      <div><strong>Data/Hora Desejada:</strong> {r.desired_date} às {r.desired_time}</div>
                      {r.notes && <div><strong>Notas:</strong> {r.notes}</div>}
                      {r.rejection_reason && (
                        <div className="p-2 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 mt-2">
                          <strong>Motivo da recusa:</strong> {r.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Enviado em {new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                    {r.converted_task_id && (
                      <span className="text-emerald-600 font-bold">Tarefa em execução</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Daily Reports (PDF) */}
      {activeTab === 'relatorios' && (
        <DailyReportManager
          tasks={tasks}
          company={company}
          property={property}
          zeladores={zeladores}
          currentUserName={user?.name || 'Síndico / Administrador Predial'}
          isAdmPredial={true}
        />
      )}

      {/* Create Request Modal (Section 8 & 15) */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Solicitar Nova Tarefa"
        subtitle="Sua solicitação será enviada para análise da empresa de zeladoria."
        maxWidth="lg"
      >
        <form onSubmit={handleSendRequest} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título da Demanda *</label>
            <input
              type="text"
              required
              value={requestForm.title}
              onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value.toUpperCase() })}
              placeholder="Ex: Troca de lâmpada no hall do Bloco B"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Detalhada *</label>
            <textarea
              required
              rows={3}
              value={requestForm.description}
              onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value.toUpperCase() })}
              placeholder="Descreva a necessidade com o máximo de detalhes para o zelador..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Local Exato no Condomínio *</label>
              <input
                type="text"
                required
                value={requestForm.location}
                onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value.toUpperCase() })}
                placeholder="Ex: Hall 3º andar, Bloco A"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade Sugerida</label>
              <select
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value as TaskPriority })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data Desejada</label>
              <input
                type="date"
                required
                value={requestForm.desired_date}
                onChange={(e) => setRequestForm({ ...requestForm, desired_date: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Desejado</label>
              <input
                type="time"
                value={requestForm.desired_time}
                onChange={(e) => setRequestForm({ ...requestForm, desired_time: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Adicionais</label>
            <input
              type="text"
              value={requestForm.notes}
              onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value.toUpperCase() })}
              placeholder="Ex: Chave do alçapão está na portaria"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Solicitação</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Details Modal */}
      {selectedTaskDetails && (
        <Modal
          isOpen={Boolean(selectedTaskDetails)}
          onClose={() => setSelectedTaskDetails(null)}
          title={selectedTaskDetails.title}
          subtitle={`Status: ${selectedTaskDetails.status}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-800 font-semibold">{selectedTaskDetails.description}</div>
              <div className="text-slate-500"><strong>Local:</strong> {selectedTaskDetails.location}</div>
              <div className="text-slate-500">
                <strong>Data Agendada:</strong> {new Date(`${selectedTaskDetails.scheduled_date}T00:00:00`).toLocaleDateString('pt-BR')} às {selectedTaskDetails.scheduled_time}
              </div>
            </div>

            {selectedTaskDetails.completion_description && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-800 block mb-1">Serviço Realizado:</span>
                <p className="text-emerald-950">{selectedTaskDetails.completion_description}</p>
              </div>
            )}

            {selectedTaskDetails.photos && selectedTaskDetails.photos.length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Foto Comprobatória:</span>
                <img 
                  src={selectedTaskDetails.photos[0].storage_path} 
                  alt="Comprovante" 
                  className="rounded-xl w-full h-44 object-cover border border-slate-200" 
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
