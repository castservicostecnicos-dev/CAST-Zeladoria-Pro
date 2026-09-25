import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Company, Property, Profile, Task } from '../types';

export interface DailyReportData {
  date: string; // YYYY-MM-DD
  company?: Company | null;
  property?: Property | null;
  tasksDone: Task[];
  tasksNotDone: Task[];
  zeladores: Profile[];
  generatedByName?: string;
  notes?: string;
}

export function generateDailyReportPDF(data: DailyReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Format date helper
  const [year, month, day] = data.date.split('-');
  const formattedDate = `${day}/${month}/${year}`;
  const now = new Date();
  const generatedAt = now.toLocaleString('pt-BR');

  // Colors
  const primaryNavy = [15, 23, 42]; // #0F172A
  const textDark = [30, 41, 59];    // #1E293B
  const textMuted = [100, 116, 139];// #64748B
  const greenHeader = [16, 185, 129]; // #10B981
  const redHeader = [239, 68, 68];    // #EF4444

  let currentY = 14;

  // 1. TOP HEADER BANNER
  doc.setFillColor(15, 23, 42); // Navy 900
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 26, 3, 3, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RELATÓRIO DIÁRIO DE ZELADORIA E MANUTENÇÃO', margin + 6, currentY + 10);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    `Demonstrativo diário de execução e pendências • Data de Referência: ${formattedDate}`,
    margin + 6,
    currentY + 18
  );

  // Status Badge in Header
  const totalTasks = data.tasksDone.length + data.tasksNotDone.length;
  const completionPct = totalTasks > 0 ? Math.round((data.tasksDone.length / totalTasks) * 100) : 0;
  
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 46, currentY + 5, 40, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('CONCLUSAO', pageWidth - margin - 26, currentY + 10, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153); // Emerald 400
  doc.text(`${completionPct}%`, pageWidth - margin - 26, currentY + 17, { align: 'center' });

  currentY += 32;

  // 2. METADATA & CONTEXT BOX
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'FD');

  const colWidth = (pageWidth - margin * 2 - 12) / 3;
  const col1X = margin + 5;
  const col2X = col1X + colWidth + 2;
  const col3X = col2X + colWidth + 2;

  // Column 1: Condomínio / Local
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CONDOMINIO / LOCAL:', col1X, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const propName = data.property?.name || 'Todos os Condomínios / Geral';
  doc.text(propName.slice(0, 32), col1X, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text((data.property?.address || '').slice(0, 35), col1X, currentY + 17);

  // Column 2: Empresa Prestadora
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('EMPRESA PRESTADORA:', col2X, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const compName = data.company?.trade_name || data.company?.legal_name || 'Empresa Prestadora';
  doc.text(compName.slice(0, 32), col2X, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`CNPJ: ${data.company?.cnpj || 'N/A'}`, col2X, currentY + 17);

  // Column 3: Emissão e Usuário
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DADOS DA EMISSAO:', col3X, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Gerado em: ${generatedAt}`, col3X, currentY + 12);
  doc.text(`Por: ${data.generatedByName || 'Sistema'}`, col3X, currentY + 17);

  currentY += 27;

  // 3. SUMMARY KPI CARDS
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const kpis = [
    { label: 'TOTAL PROGRAMADO', val: `${totalTasks}`, sub: 'Tarefas no dia', color: [15, 23, 42] },
    { label: 'O QUE FOI FEITO', val: `${data.tasksDone.length}`, sub: 'Concluídas com sucesso', color: [16, 185, 129] },
    { label: 'O QUE NAO FOI FEITO', val: `${data.tasksNotDone.length}`, sub: 'Pendentes ou atrasadas', color: [239, 68, 68] },
    { label: 'TAXA DE SUCESSO', val: `${completionPct}%`, sub: 'Índice de resolução', color: [59, 130, 246] },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (cardWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kpiX, currentY, cardWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX + 3, currentY + 5);

    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, kpiX + 3, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, kpiX + 3, currentY + 14.5);
  });

  currentY += 22;

  // Helper to find zelador name
  const getZeladorName = (id?: string) => {
    if (!id) return 'Não atribuído';
    const found = data.zeladores.find(z => z.id === id);
    return found ? found.name : 'Zelador';
  };

  // 4. SECTION 1: O QUE FOI FEITO (TAREFAS CONCLUÍDAS)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(`1. O QUE FOI FEITO (CONCLUÍDO NO DIA) - ${data.tasksDone.length} SERVIÇO(S)`, margin, currentY);
  currentY += 4;

  const doneTableRows = data.tasksDone.map((t, index) => {
    const completionTime = t.completed_at 
      ? new Date(t.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : (t.scheduled_time || '--:--');
    
    const photosNote = t.photos && t.photos.length > 0 ? ` [${t.photos.length} foto(s) comprovatória(s)]` : '';
    const executionDetails = (t.completion_description || t.description || 'Serviço concluído conforme rotina operacional.') + photosNote;

    return [
      String(index + 1),
      completionTime,
      `${t.title.toUpperCase()}\nCat: ${t.category || 'Geral'}`,
      t.location || 'Área comum',
      getZeladorName(t.assigned_to),
      executionDetails
    ];
  });

  if (doneTableRows.length === 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Horário', 'Tarefa / Categoria', 'Local', 'Zelador', 'Comprovante / Descrição da Execução']],
      body: [['-', '-', 'NENHUMA TAREFA CONCLUÍDA NESTA DATA', '-', '-', 'Não houve registros de tarefas finalizadas para esta data de referência.']],
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [51, 65, 85],
      },
      margin: { left: margin, right: margin },
    });
  } else {
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Horário', 'Tarefa / Categoria', 'Local', 'Zelador', 'Comprovante / Descrição da Execução']],
      body: doneTableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [5, 150, 105], // Green
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 42 },
        3: { cellWidth: 32 },
        4: { cellWidth: 26 },
        5: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Calculate position after first table
  const afterFirstTableY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || (currentY + 30);
  currentY = afterFirstTableY + 8;

  // Check if we need page break before Section 2
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // 5. SECTION 2: O QUE NÃO FOI FEITO (PENDENTES / ATRASADAS / EM ANDAMENTO)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38); // Red 600
  doc.text(`2. O QUE NÃO FOI FEITO (PENDÊNCIAS E EM ANDAMENTO) - ${data.tasksNotDone.length} SERVIÇO(S)`, margin, currentY);
  currentY += 4;

  const notDoneTableRows = data.tasksNotDone.map((t, index) => {
    let statusLabel: string = t.status;
    if (t.status === 'PENDENTE') statusLabel = 'PENDENTE';
    else if (t.status === 'EM_ANDAMENTO') statusLabel = 'EM ANDAMENTO';
    else if (t.status === 'ACEITA') statusLabel = 'ACEITA / AGUARDANDO';
    else if (t.status === 'ATRASADA') statusLabel = 'ATRASADA';
    else if (t.status === 'CANCELADA') statusLabel = 'CANCELADA';

    return [
      String(index + 1),
      t.scheduled_time || '--:--',
      statusLabel,
      `${t.title.toUpperCase()}\nPrioridade: ${t.priority}`,
      t.location || 'Área comum',
      getZeladorName(t.assigned_to),
      t.description || t.notes || 'Aguardando execução operacional do zelador.'
    ];
  });

  if (notDoneTableRows.length === 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Previsto', 'Situação', 'Tarefa / Prioridade', 'Local', 'Zelador', 'Motivo / Instruções']],
      body: [['-', '-', '100% EXECUTADO', 'PARABÉNS: TODAS AS TAREFAS FORAM CONCLUÍDAS!', '-', '-', 'Não há serviços pendentes ou atrasados registrados para este dia.']],
      theme: 'grid',
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [51, 65, 85],
      },
      margin: { left: margin, right: margin },
    });
  } else {
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Previsto', 'Situação', 'Tarefa / Prioridade', 'Local', 'Zelador', 'Motivo / Instruções']],
      body: notDoneTableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [220, 38, 38], // Red
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 26, fontStyle: 'bold' },
        3: { cellWidth: 38 },
        4: { cellWidth: 28 },
        5: { cellWidth: 24 },
        6: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // 6. SIGNATURE & OBSERVATIONS BLOCK
  const afterSecondTableY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || (currentY + 30);
  currentY = afterSecondTableY + 10;

  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
  }

  // Notes Box if available
  if (data.notes) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('OBSERVACOES GERAIS DO PLANTÃO:', margin + 3, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(data.notes.slice(0, 140), margin + 3, currentY + 10);
    currentY += 18;
  }

  // Signature lines
  const sigWidth = 75;
  const sigY = currentY + 16;

  // Left Signature: Zeladoria
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, sigY, margin + 10 + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Visto da Zeladoria / Responsável Operacional', margin + 10 + sigWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Declaro a exatidão das tarefas reportadas', margin + 10 + sigWidth / 2, sigY + 8, { align: 'center' });

  // Right Signature: Síndico
  const rightSigX = pageWidth - margin - 10 - sigWidth;
  doc.line(rightSigX, sigY, rightSigX + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Ciente do Síndico / ADM Predial', rightSigX + sigWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Acompanhamento e validação dos serviços', rightSigX + sigWidth / 2, sigY + 8, { align: 'center' });

  // 7. FOOTERS ACROSS ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Zeladoria Pro • Sistema de Gestão Operacional Predial • Documento Válido para Fiscalização Contratual',
      margin,
      pageHeight - 6
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  return doc;
}

export function downloadDailyReportPDF(data: DailyReportData) {
  const doc = generateDailyReportPDF(data);
  const sanitizedDate = data.date.replace(/-/g, '');
  const condName = (data.property?.name || 'condominio').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `relatorio_diario_${condName}_${sanitizedDate}.pdf`;
  doc.save(filename);
}
