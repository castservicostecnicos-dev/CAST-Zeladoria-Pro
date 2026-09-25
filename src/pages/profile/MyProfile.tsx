import React, { useState } from 'react';
import { User, Phone, Mail, Shield, Building2, Lock, CheckCircle2, Camera, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleDriveButton } from '../../components/common/GoogleDriveButton';

interface MyProfileProps {
  onBack?: () => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ onBack }) => {
  const { user, company, property, role, updateCurrentUser, requestPasswordReset } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || 'SP');
  const [isSaved, setIsSaved] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentUser({
      name,
      phone,
      cpf,
      city,
      state,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePasswordReset = async () => {
    if (!user) return;
    await requestPasswordReset(user.email);
    setResetMessage(`Link seguro de alteração de senha enviado para ${user.email}.`);
    setTimeout(() => setResetMessage(''), 4000);
  };

  return (
    <div className="w-full max-w-full sm:max-w-2xl mx-auto space-y-6 overflow-x-hidden">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Voltar ao Painel</span>
        </button>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md shadow-blue-500/20">
            {user?.name ? user.name.slice(0, 2) : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Papel: {role}
              </span>
              {company && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {company.trade_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {isSaved && (
          <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dados do perfil atualizados com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail (Bloqueado)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 bg-slate-50 cursor-not-allowed lowercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value.toUpperCase())}
                placeholder="(11) 99999-9999"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value.toUpperCase())}
                placeholder="000.000.000-00"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          {/* Google Drive Integration for Photos and PDFs */}
          <div>
            <GoogleDriveButton />
          </div>

          {/* Security lock info (Section 37) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Diretrizes de Segurança RBAC
            </div>
            <p>
              Por regra de integridade do sistema, você não pode alterar seu papel ({role}) nem a empresa vinculada ({company?.trade_name || 'Global'}). Alterações cadastrais estruturais devem ser solicitadas ao administrador.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Redefinir Minha Senha</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>

          {resetMessage && (
            <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs">
              {resetMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
