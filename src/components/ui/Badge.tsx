import React from 'react';
import { TaskStatus, TaskPriority, RequestStatus } from '../../types';

interface BadgeProps {
  status?: TaskStatus | RequestStatus | 'Ativa' | 'Inativa' | 'Ativo' | 'Inativo';
  priority?: TaskPriority;
  className?: string;
}

export const StatusBadge: React.FC<{ status: TaskStatus | RequestStatus | 'Ativa' | 'Inativa' | 'Ativo' | 'Inativo'; className?: string }> = ({ 
  status,
  className = '' 
}) => {
  switch (status) {
    case 'PENDENTE':
    case 'SOLICITADA':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pendente
        </span>
      );
    case 'ACEITA':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Aceita
        </span>
      );
    case 'ANALISANDO':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Em Análise
        </span>
      );
    case 'EM_ANDAMENTO':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          Em Andamento
        </span>
      );
    case 'CONCLUIDA':
    case 'APROVADA':
    case 'CONVERTIDA_EM_TAREFA':
    case 'Ativa':
    case 'Ativo':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {status === 'CONVERTIDA_EM_TAREFA' ? 'Convertida em Tarefa' : status === 'APROVADA' ? 'Aprovada' : status === 'CONCLUIDA' ? 'Concluída' : 'Ativo'}
        </span>
      );
    case 'CANCELADA':
    case 'RECUSADA':
    case 'Inativa':
    case 'Inativo':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {status === 'RECUSADA' ? 'Recusada' : status === 'CANCELADA' ? 'Cancelada' : 'Inativo'}
        </span>
      );
    case 'ATRASADA':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
          Atrasada
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 ${className}`}>
          {status}
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: TaskPriority; className?: string }> = ({ 
  priority, 
  className = '' 
}) => {
  switch (priority) {
    case 'BAIXA':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          Baixa
        </span>
      );
    case 'NORMAL':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          Normal
        </span>
      );
    case 'ALTA':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 ${className}`}>
          Alta
        </span>
      );
    case 'URGENTE':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse ${className}`}>
          Urgente
        </span>
      );
    default:
      return null;
  }
};
