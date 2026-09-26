import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/ui/Modal';

export const Login: React.FC = () => {
  const { signIn, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const res = await signIn(email, password);
    if (!res.success) {
      setErrorMessage(res.message || 'Erro ao realizar login.');
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    await requestPasswordReset(resetEmail);
    setResetSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between w-full max-w-full overflow-x-hidden">
      {/* Top Bar */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-lg tracking-tight">
              Zeladoria<span className="text-blue-400">Pro</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Gestão de Zeladoria & Facilities
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SaaS Multi-Tenant • 4 Níveis de Acesso</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 py-8 w-full flex-1 flex flex-col items-center justify-center">
        {/* Login Form */}
        <div className="w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Acesse sua conta</h2>
              <p className="text-xs text-slate-400 mt-1">
                Insira suas credenciais cadastradas para acessar o painel correspondente.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="seu.email@empresa.com"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition lowercase"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetSuccess(false);
                      setShowResetModal(true);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Acessando...</span>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-xs text-slate-500 border-t border-slate-900">
        Zeladoria Pro • Conectado ao Firebase Firestore (Google Cloud) com persistência em tempo real
      </div>

      {/* Reset Password Modal (Section 16) */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Recuperação de Senha"
        subtitle="Disparo de link de redefinição seguro via Firebase Auth"
      >
        {resetSuccess ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Link enviado com sucesso!</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Enviamos as instruções para <strong>{resetEmail}</strong>. Verifique sua caixa de entrada para criar uma nova senha.
            </p>
            <button
              onClick={() => setShowResetModal(false)}
              className="mt-5 w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
            >
              Retornar ao Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Informe o e-mail cadastrado. Por diretrizes de segurança (RLS/Auth), a senha atual nunca é revelada.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value.toLowerCase())}
                placeholder="seu.email@empresa.com"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 lowercase"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
            >
              Enviar link de redefinição
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
