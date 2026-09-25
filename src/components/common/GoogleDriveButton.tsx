import React, { useState } from 'react';
import { Check, CloudUpload, HardDrive, LogOut, Loader2 } from 'lucide-react';
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  isDriveConnected, 
  getCachedGoogleUser 
} from '../../services/googleDriveService';

interface GoogleDriveButtonProps {
  compact?: boolean;
  onConnected?: () => void;
}

export const GoogleDriveButton: React.FC<GoogleDriveButtonProps> = ({ compact = false, onConnected }) => {
  const [connected, setConnected] = useState(isDriveConnected());
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState(getCachedGoogleUser());

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await connectGoogleDrive();
      setConnected(true);
      setGoogleUser(res.user);
      if (onConnected) onConnected();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Não foi possível conectar ao Google Drive: ' + (err?.message || 'Verifique as permissões.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleDrive();
    setConnected(false);
    setGoogleUser(null);
  };

  if (compact) {
    if (connected) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
          <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Drive Ativo</span>
          <button
            onClick={handleDisconnect}
            title="Desconectar Google Drive"
            className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        title="Conectar ao Google Drive para salvar fotos e relatórios na nuvem"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.25z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        )}
        <span>{loading ? 'Conectando...' : 'Drive'}</span>
      </button>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950">Google Drive Conectado</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[9px] font-extrabold uppercase">Ativo</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {googleUser?.email ? `Conta: ${googleUser.email}` : 'Fotos e PDFs são salvos diretamente na nuvem.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          title="Desconectar do Google Drive"
          className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-white transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-blue-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.25z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-950">Conectar Google Drive</h4>
            <p className="text-[11px] text-blue-800 leading-snug mt-0.5">
              Salve fotos comprobatórias e relatórios em PDF automaticamente fora do código e do ambiente local.
            </p>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4" />
              <span>Conectar Drive</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
