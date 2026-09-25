import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  AlertTriangle, 
  Camera, 
  Upload, 
  MapPin, 
  Calendar, 
  Check, 
  ArrowRight,
  Sparkles,
  Info,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, TaskStatus } from '../../types';
import { DataStore } from '../../services/store';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { compressImage } from '../../lib/imageCompression';
import { isDriveConnected, uploadBase64ImageToDrive, connectGoogleDrive } from '../../services/googleDriveService';

export interface ZeladorDashboardProps {
  onBack?: () => void;
}

export const ZeladorDashboard: React.FC<ZeladorDashboardProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'hoje' | 'pendentes' | 'em_andamento' | 'concluidas' | 'todas'>('hoje');

  // Completion Form
  const [completionDescription, setCompletionDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTasks = async () => {
    if (!user) return;
    const list = await DataStore.getTasks(user);
    setTasks(list);
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const todayStr = new Date().toISOString().split('T')[0];
  const tasksToday = tasks.filter(t => t.scheduled_date === todayStr);
  const tasksPending = tasks.filter(t => t.status === 'PENDENTE' || t.status === 'ACEITA');
  const tasksInProgress = tasks.filter(t => t.status === 'EM_ANDAMENTO');
  const tasksCompleted = tasks.filter(t => t.status === 'CONCLUIDA');
  const tasksDelayed = tasks.filter(t => t.status === 'ATRASADA');

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'hoje') return t.scheduled_date === todayStr;
    if (activeTab === 'pendentes') return t.status === 'PENDENTE' || t.status === 'ACEITA';
    if (activeTab === 'em_andamento') return t.status === 'EM_ANDAMENTO';
    if (activeTab === 'concluidas') return t.status === 'CONCLUIDA';
    return true;
  });

  // Action: Accept task
  const handleAcceptTask = async (task: Task) => {
    if (!user) return;
    await DataStore.updateTaskStatus(task.id, 'ACEITA', user);
    await loadTasks();
    if (selectedTask?.id === task.id) {
      setSelectedTask(prev => prev ? { ...prev, status: 'ACEITA' } : null);
    }
  };

  // Action: Start task
  const handleStartTask = async (task: Task) => {
    if (!user) return;
    await DataStore.updateTaskStatus(task.id, 'EM_ANDAMENTO', user);
    await loadTasks();
    if (selectedTask?.id === task.id) {
      setSelectedTask(prev => prev ? { ...prev, status: 'EM_ANDAMENTO' } : null);
    }
  };

  // Action: Complete task (Section 7)
  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTask) return;
    if (!completionDescription.trim()) {
      alert('Por favor, descreva brevemente o serviço realizado.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalPhotoUrl = photoPreview || undefined;

      // Se houver foto e o Google Drive estiver conectado, envia diretamente para o Drive fora do ambiente local
      if (photoPreview && isDriveConnected()) {
        try {
          const driveFile = await uploadBase64ImageToDrive(
            photoPreview, 
            `comprovante_tarefa_${selectedTask.id}_${Date.now()}.jpg`
          );
          finalPhotoUrl = driveFile.webViewLink;
        } catch (driveErr) {
          console.warn('[ZeladorDashboard] Falha ao enviar para o Drive, mantendo armazenamento comprimido:', driveErr);
        }
      }

      await DataStore.updateTaskStatus(selectedTask.id, 'CONCLUIDA', user, {
        completion_description: completionDescription,
        photo_url: finalPhotoUrl,
      });

      // Joyful celebratory feedback
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setSelectedTask(null);
      setCompletionDescription('');
      setPhotoPreview(null);
      await loadTasks();
    } catch (err: any) {
      alert(err.message || 'Erro ao concluir tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulated Camera / Image Upload (Section 13 & 34)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingPhoto(true);
        // Comprime para no máximo 1024px e qualidade 0.72 (~70-100KB)
        const compressed = await compressImage(file, 1024, 1024, 0.72);
        setPhotoPreview(compressed);
      } catch (err) {
        console.warn('[ZeladorDashboard] Erro ao otimizar foto:', err);
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  return (
    <div className="w-full max-w-full sm:max-w-xl mx-auto space-y-4 pb-12 overflow-x-hidden">
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180 text-slate-500" />
            <span>Voltar ao Painel</span>
          </button>
        </div>
      )}

      {/* Top Greeting Header (Section 13) */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
          Painel do Zelador
        </span>
        <h2 className="text-2xl font-extrabold mt-1 tracking-tight">
          Bom dia, {user?.name.split(' ')[0]}!
        </h2>
        <p className="text-sm text-blue-100 mt-1 font-medium">
          {tasksToday.length === 0 
            ? 'Tudo em ordem! Você não possui tarefas pendentes para hoje.' 
            : `Você possui ${tasksToday.length} tarefa(s) para hoje.`
          }
        </p>

        {/* Quick mobile status chips */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/15">
          <button
            onClick={() => setActiveTab('hoje')}
            className={`p-2 rounded-xl text-center transition ${
              activeTab === 'hoje' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'bg-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-lg font-black">{tasksToday.length}</div>
            <div className="text-[10px] uppercase font-semibold">Hoje</div>
          </button>

          <button
            onClick={() => setActiveTab('pendentes')}
            className={`p-2 rounded-xl text-center transition ${
              activeTab === 'pendentes' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'bg-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-lg font-black">{tasksPending.length}</div>
            <div className="text-[10px] uppercase font-semibold">A Fazer</div>
          </button>

          <button
            onClick={() => setActiveTab('em_andamento')}
            className={`p-2 rounded-xl text-center transition ${
              activeTab === 'em_andamento' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'bg-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-lg font-black">{tasksInProgress.length}</div>
            <div className="text-[10px] uppercase font-semibold">Andamento</div>
          </button>

          <button
            onClick={() => setActiveTab('concluidas')}
            className={`p-2 rounded-xl text-center transition ${
              activeTab === 'concluidas' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'bg-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-lg font-black">{tasksCompleted.length}</div>
            <div className="text-[10px] uppercase font-semibold">Feitas</div>
          </button>
        </div>
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {activeTab === 'hoje' ? 'Tarefas de Hoje' : activeTab === 'pendentes' ? 'Pendentes' : activeTab === 'em_andamento' ? 'Em Andamento' : 'Todas as Tarefas'}
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          {filteredTasks.length} encontrada(s)
        </span>
      </div>

      {/* Task Cards List (Section 13) */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-800">Nenhuma tarefa encontrada</h4>
            <p className="text-xs text-slate-500 mt-1">
              Todas as demandas deste filtro foram concluídas ou você não possui serviços atribuídos no momento.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isFinished = task.status === 'CONCLUIDA';
            const isPending = task.status === 'PENDENTE';
            const isAccepted = task.status === 'ACEITA';
            const isInProgress = task.status === 'EM_ANDAMENTO';

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`bg-white border rounded-2xl p-4 shadow-xs hover:border-blue-400 transition-all cursor-pointer ${
                  task.priority === 'URGENTE' ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {task.category || 'Serviço'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {task.title}
                </h4>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>

                {/* Meta details */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-medium text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{task.location || 'Área Comum'}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.scheduled_time}</span>
                  </div>
                </div>

                {/* Quick Action Button for Mobile Efficiency (Section 13) */}
                <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-end">
                  {isPending && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptTask(task);
                      }}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Aceitar Tarefa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isAccepted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTask(task);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Execução</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Concluir Tarefa</span>
                    </button>
                  )}

                  {isFinished && (
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Concluída com sucesso</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Execution Modal (Section 6, 7 & 12) */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          subtitle={`Local: ${selectedTask.location || 'Geral'} • Horário: ${selectedTask.scheduled_time}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Status & Priority */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <StatusBadge status={selectedTask.status} />
              <PriorityBadge priority={selectedTask.priority} />
            </div>

            {/* Description */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-800 block mb-1">O que fazer:</span>
              <p className="text-slate-600 leading-relaxed text-xs">{selectedTask.description}</p>
              {selectedTask.notes && (
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <strong>Observação:</strong> {selectedTask.notes}
                </div>
              )}
            </div>

            {/* If task is already completed, lock from editing (Section 14: Após concluída, não alterar) */}
            {selectedTask.status === 'CONCLUIDA' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Tarefa Concluída e Bloqueada
                </div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  <strong>Serviço realizado:</strong> {selectedTask.completion_description || 'Limpeza e vistoria concluídas.'}
                </p>
                {selectedTask.completed_at && (
                  <p className="text-[11px] text-emerald-700">
                    Registrado em: {new Date(selectedTask.completed_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {selectedTask.photos && selectedTask.photos.length > 0 && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-700 block mb-1">Foto da Execução:</span>
                    <img 
                      src={selectedTask.photos[0].storage_path} 
                      alt="Comprovante" 
                      className="rounded-xl w-full h-44 object-cover border border-emerald-200" 
                    />
                  </div>
                )}
              </div>
            ) : (
              /* State Machine Flow Buttons (Section 6, 7 & 31) */
              <div className="space-y-4">
                {selectedTask.status === 'PENDENTE' && (
                  <button
                    onClick={() => handleAcceptTask(selectedTask)}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition shadow-md"
                  >
                    1. Aceitar Tarefa
                  </button>
                )}

                {selectedTask.status === 'ACEITA' && (
                  <button
                    onClick={() => handleStartTask(selectedTask)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>2. Iniciar Execução Agora</span>
                  </button>
                )}

                {selectedTask.status === 'EM_ANDAMENTO' && (
                  /* Form to complete the task (Section 7) */
                  <form onSubmit={handleCompleteTask} className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900 text-xs">
                      <span className="font-bold">Finalizar Tarefa:</span> Preencha a descrição do que foi feito para registrar no histórico.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Descreva brevemente o que foi realizado *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={completionDescription}
                        onChange={(e) => setCompletionDescription(e.target.value.toUpperCase())}
                        placeholder="Ex: Realizada limpeza do salão de festas, incluindo varrição, lavagem do piso e retirada dos resíduos."
                        className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
                      />
                    </div>

                    {/* Camera / Photo Upload (Section 13) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Adicionar Fotos Comprobatórias (Opcional)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className={`flex-1 border-2 border-dashed ${isProcessingPhoto ? 'border-amber-400 bg-amber-50' : 'border-slate-300 hover:border-blue-500 bg-slate-50'} rounded-xl p-3 text-center cursor-pointer transition`}>
                          <div className="flex items-center justify-center gap-2 text-slate-600 text-xs font-semibold">
                            <Camera className={`w-4 h-4 ${isProcessingPhoto ? 'animate-spin text-amber-600' : 'text-blue-600'}`} />
                            <span>{isProcessingPhoto ? 'Otimizando foto...' : 'Tirar Foto / Anexar Imagem'}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoCapture}
                            disabled={isProcessingPhoto}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {photoPreview && (
                        <div className="mt-2 space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-slate-200">
                            <img src={photoPreview} alt="Foto tirada" className="w-full h-36 object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotoPreview(null)}
                              className="absolute top-2 right-2 px-2 py-1 bg-black/60 hover:bg-black text-white rounded-lg text-xs font-semibold"
                            >
                              Remover
                            </button>
                          </div>

                          {isDriveConnected() ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Esta foto será arquivada no seu Google Drive corporativo.</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1.5 text-[11px] text-blue-900 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200">
                              <span>Salvar no Google Drive na nuvem?</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await connectGoogleDrive();
                                  } catch {}
                                }}
                                className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer shrink-0"
                              >
                                Conectar Drive
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || isProcessingPhoto}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>{isSubmitting ? 'Gravando Conclusão...' : isProcessingPhoto ? 'Processando Foto...' : 'Concluir Tarefa'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
