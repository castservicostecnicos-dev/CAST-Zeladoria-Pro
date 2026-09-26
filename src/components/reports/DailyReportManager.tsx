import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter,
  Camera,
  ArrowRight,
  ShieldCheck,
  CloudUpload,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Task, Company, Property, Profile } from '../../types';
import { downloadDailyReportPDF, generateDailyReportPDF } from '../../services/pdfReportGenerator';
import { isDriveConnected, connectGoogleDrive, uploadPdfToDrive } from '../../services/googleDriveService';

interface DailyReportManagerProps {
  tasks: Task[];
  company?: Company | null;
  property?: Property | null;
  properties?: Property[];
  zeladores: Profile[];
  currentUserName?: string;
  isAdmPredial?: boolean;
}

export const DailyReportManager: React.FC<DailyReportManagerProps> = ({
  tasks,
  company,
  property,
  properties = [],
  zeladores,
  currentUserName = 'Administrador',
  isAdmPredial = false,
}) => {
  // Default date to today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(property?.id || 'ALL');
  const [selectedZeladorId, setSelectedZeladorId] = useState<string>('ALL');
  const [dailyNotes, setDailyNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DONE' | 'NOT_DONE'>('ALL');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [driveUploadResult, setDriveUploadResult] = useState<{ name: string; webViewLink: string } | null>(null);

  // Quick Date Selectors
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filter tasks for the selected date and criteria
  const { tasksDone, tasksNotDone, currentTargetProperty } = useMemo(() => {
    let list = tasks.filter(t => t.scheduled_date === selectedDate);

    // Property Filter
    if (selectedPropertyId !== 'ALL') {
      list = list.filter(t => t.property_id === selectedPropertyId);
    } else if (property?.id) {
      list = list.filter(t => t.property_id === property.id);
    }

    // Zelador Filter
    if (selectedZeladorId !== 'ALL') {
      list = list.filter(t => t.assigned_to === selectedZeladorId);
    }

    const done = list.filter(t => t.status === 'CONCLUIDA');
    const notDone = list.filter(t => t.status !== 'CONCLUIDA');

    const targetProp = properties.find(p => p.id === selectedPropertyId) || property || null;

    return { tasksDone: done, tasksNotDone: notDone, currentTargetProperty: targetProp };
  }, [tasks, selectedDate, selectedPropertyId, selectedZeladorId, property, properties]);

  const totalTasks = tasksDone.length + tasksNotDone.length;
  const completionRate = totalTasks > 0 ? Math.round((tasksDone.length / totalTasks) * 100) : 0;

  // Handle PDF Generation & Download
  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      downloadDailyReportPDF({
        date: selectedDate,
        company: company || null,
        property: currentTargetProperty,
        tasksDone,
        tasksNotDone,
        zeladores,
        generatedByName: currentUserName,
        notes: dailyNotes.trim() || undefined,
      });
    } catch (err) {
      console.error('Erro ao gerar relatório em PDF:', err);
      alert('Não foi possível gerar o PDF. Por favor, tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle PDF Generation & Direct Upload to Google Drive (Section: Cloud Storage outside local)
  const handleSaveToGoogleDrive = async () => {
    setIsSavingToDrive(true);
    setDriveUploadResult(null);
    try {
      if (!isDriveConnected()) {
        const conn = await connectGoogleDrive();
        if (!conn) {
          // Usuário cancelou ou fechou a janela do Google Drive
          setIsSavingToDrive(false);
          return;
        }
      }

      const doc = generateDailyReportPDF({
        date: selectedDate,
        company: company || null,
        property: currentTargetProperty,
        tasksDone,
        tasksNotDone,
        zeladores,
        generatedByName: currentUserName,
        notes: dailyNotes.trim() || undefined,
      });

      const pdfBlob = doc.output('blob');
      const sanitizedDate = selectedDate.replace(/-/g, '');
      const condName = (currentTargetProperty?.name || 'condominio').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `relatorio_diario_${condName}_${sanitizedDate}.pdf`;

      const folderName = company?.google_drive_folder_name || (company?.trade_name ? `${company.trade_name} - Relatórios` : undefined);
      const uploadRes = await uploadPdfToDrive(pdfBlob, filename, folderName);
      setDriveUploadResult(uploadRes);
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        !err?.message?.includes('popup-closed-by-user')
      ) {
        console.error('Erro ao enviar relatório para o Google Drive:', err);
        alert('Erro ao salvar no Google Drive: ' + (err?.message || 'Verifique as permissões.'));
      }
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Handle Native Print
  const handlePrint = () => {
    window.print();
  };

  const getZeladorName = (id?: string) => {
    if (!id) return 'Não atribuído';
    const found = zeladores.find(z => z.id === id);
    return found ? found.name : 'Zelador';
  };

  const [year, month, day] = selectedDate.split('-');
  const displayDate = `${day}/${month}/${year}`;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden print:p-0">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Módulo Oficial de Relatórios</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Relatório Diário de Atividades (PDF)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Emita e baixe relatórios diários completos com a separação clara de 
            <strong className="text-emerald-400 font-bold ml-1">tudo o que foi feito</strong> e 
            <strong className="text-rose-400 font-bold ml-1">o que não foi feito</strong> para validação pelo condomínio e prestadora.
          </p>
        </div>

        {/* Quick Action PDF Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isAdmPredial && (
            <button
              onClick={handleSaveToGoogleDrive}
              disabled={isSavingToDrive || isGenerating}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-700/30 transition cursor-pointer disabled:opacity-50"
              title="Salvar o arquivo PDF diretamente no Google Drive da empresa"
            >
              {isSavingToDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no Drive...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Salvar no Google Drive</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating || isSavingToDrive}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-700/30 transition cursor-pointer disabled:opacity-50"
            title="Baixar arquivo PDF formatado para impressão ou envio por e-mail/WhatsApp"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Gerando PDF...' : 'Baixar Relatório (PDF)'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 transition cursor-pointer"
            title="Imprimir visualização diária"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Google Drive Upload Success Alert */}
      {!isAdmPredial && driveUploadResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Relatório <strong>{driveUploadResult.name}</strong> salvo com sucesso na sua pasta do <strong>Google Drive</strong>!
            </span>
          </div>
          <a
            href={driveUploadResult.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition self-start sm:self-auto"
          >
            <span>Ver no Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Date & Filter Control Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtros do Relatório Diário</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Reference Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Data de Referência:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 bg-white"
            />
            {/* Quick shortcuts */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition ${
                  selectedDate === todayStr 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(-1)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition"
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(-2)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition"
              >
                Anteontem
              </button>
            </div>
          </div>

          {/* Condominium Filter (only if properties available) */}
          {!isAdmPredial && properties.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Condomínio / Imóvel:
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="ALL">Todos os Condomínios</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Zelador Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Zelador Responsável:
            </label>
            <select
              value={selectedZeladorId}
              onChange={(e) => setSelectedZeladorId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">Todos os Zeladores</option>
              {zeladores.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Optional Observation to include in PDF */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Observação no PDF (opcional):
            </label>
            <input
              type="text"
              value={dailyNotes}
              onChange={(e) => setDailyNotes(e.target.value.toUpperCase())}
              placeholder="Ex: Plantão com chuva, suspensa limpeza externa..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>
        </div>
      </div>

      {/* Metric Cards of the Day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Card */}
        <div 
          onClick={() => setActiveTab('ALL')}
          className={`bg-white border rounded-2xl p-4 shadow-xs cursor-pointer transition ${
            activeTab === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center justify-between">
            <span>Total no Dia</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{totalTasks}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Atividades cadastradas</div>
        </div>

        {/* Done Card (O que foi feito) */}
        <div 
          onClick={() => setActiveTab('DONE')}
          className={`bg-emerald-50/50 border rounded-2xl p-4 shadow-xs cursor-pointer transition ${
            activeTab === 'DONE' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-emerald-700 flex items-center justify-between">
            <span>O Que Foi Feito</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{tasksDone.length}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Concluídas com sucesso ({completionRate}%)</div>
        </div>

        {/* Not Done Card (O que não foi feito) */}
        <div 
          onClick={() => setActiveTab('NOT_DONE')}
          className={`bg-rose-50/50 border rounded-2xl p-4 shadow-xs cursor-pointer transition ${
            activeTab === 'NOT_DONE' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-rose-700 flex items-center justify-between">
            <span>O Que Não Foi Feito</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{tasksNotDone.length}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Pendentes ou em atraso</div>
        </div>

        {/* Taxa de Resolução Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-blue-600 flex items-center justify-between">
            <span>Taxa do Dia</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{completionRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Eficiência operacional</div>
        </div>
      </div>

      {/* Printable Preview Content */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Printable Report Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-900 text-white rounded-md">
                Demonstrativo Operacional Diário
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-2">
                Relatório de Zeladoria do Dia {displayDate}
              </h3>
              <p className="text-xs text-slate-500">
                Condomínio: <strong>{currentTargetProperty?.name || 'Todos'}</strong> • Empresa: <strong>{company?.trade_name || 'Zeladoria Pro'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer print:hidden"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: O QUE FOI FEITO (TAREFAS CONCLUÍDAS) */}
        {(activeTab === 'ALL' || activeTab === 'DONE') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 uppercase tracking-tight">
                    1. O Que Foi Feito (Tarefas Concluídas)
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    {tasksDone.length} serviço(s) finalizado(s) e comprovado(s) nesta data
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                {tasksDone.length} concluídas
              </span>
            </div>

            {tasksDone.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Nenhum serviço marcado como concluído para esta data de referência.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Horário</th>
                      <th className="p-3">Atividade / Categoria</th>
                      <th className="p-3">Local</th>
                      <th className="p-3">Zelador</th>
                      <th className="p-3">Comprovação da Execução</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasksDone.map((t) => {
                      const compTime = t.completed_at 
                        ? new Date(t.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : (t.scheduled_time || '--:--');

                      return (
                        <tr key={t.id} className="hover:bg-emerald-50/30 transition">
                          <td className="p-3 font-mono text-slate-700 font-bold whitespace-nowrap">
                            {compTime}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{t.title}</div>
                            <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200 mt-0.5">
                              {t.category || 'Geral'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {t.location || 'Área comum'}
                          </td>
                          <td className="p-3 text-slate-800 font-semibold">
                            {getZeladorName(t.assigned_to)}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs sm:max-w-md">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <p className="text-xs text-slate-800">
                                {t.completion_description || t.description || 'Executado conforme plano operacional.'}
                              </p>
                              {t.photos && t.photos.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                    <Camera className="w-3 h-3" />
                                    {t.photos.length} foto(s) registrada(s)
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: O QUE NÃO FOI FEITO (PENDENTES E EM ANDAMENTO) */}
        {(activeTab === 'ALL' || activeTab === 'NOT_DONE') && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-rose-950 uppercase tracking-tight">
                    2. O Que Não Foi Feito (Pendentes e em Andamento)
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    {tasksNotDone.length} serviço(s) aguardando execução ou em atraso
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                {tasksNotDone.length} pendentes
              </span>
            </div>

            {tasksNotDone.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-700 font-bold text-xs flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Excelente! Todas as tarefas programadas para esta data foram concluídas.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Horário Previsto</th>
                      <th className="p-3">Situação Atual</th>
                      <th className="p-3">Atividade / Prioridade</th>
                      <th className="p-3">Local</th>
                      <th className="p-3">Zelador</th>
                      <th className="p-3">Motivo / Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasksNotDone.map((t) => {
                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {t.status}
                        </span>
                      );
                      if (t.status === 'EM_ANDAMENTO') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            EM ANDAMENTO
                          </span>
                        );
                      } else if (t.status === 'ATRASADA') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            ATRASADA
                          </span>
                        );
                      }

                      return (
                        <tr key={t.id} className="hover:bg-rose-50/30 transition">
                          <td className="p-3 font-mono text-slate-700 font-bold whitespace-nowrap">
                            {t.scheduled_time || '--:--'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {statusBadge}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{t.title}</div>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Prioridade: {t.priority}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {t.location || 'Área comum'}
                          </td>
                          <td className="p-3 text-slate-800 font-semibold">
                            {getZeladorName(t.assigned_to)}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs sm:max-w-md">
                            <p className="text-xs text-slate-800">
                              {t.description || t.notes || 'Aguardando ação do zelador designado.'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer Signature Box for Print */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="text-center p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="h-10 border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
            <p className="text-xs font-bold text-slate-800">Assinatura da Zeladoria / Empresa</p>
            <p className="text-[10px] text-slate-400">Responsável pela execução diária</p>
          </div>

          <div className="text-center p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="h-10 border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
            <p className="text-xs font-bold text-slate-800">Visto do Síndico / ADM Predial</p>
            <p className="text-[10px] text-slate-400">Ciência e validação dos serviços</p>
          </div>
        </div>
      </div>
    </div>
  );
};
