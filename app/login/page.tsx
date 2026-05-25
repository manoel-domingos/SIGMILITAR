'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { useTenantConfig, getDbSchoolId } from '@/lib/useTenantConfig';
import { Trophy, User as UserIcon, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import versionData from '@/lib/version.json';
import { SCHOOL_SUBTITLE } from '@/lib/school';

export default function Login() {
  const router = useRouter();
  const { user, isGuest, currentUserRole, currentUserSchoolId, isAuthRestored } = useAppContext();
  const { logoLogin, schoolName, tenantId } = useTenantConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Sincroniza erros de Whitelist da URL ou LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlError = searchParams.get('error');
      const localError = localStorage.getItem('eecm_login_error');
      
      if (urlError === 'whitelist' || localError) {
        setError(localError || 'Acesso Negado: Seu e-mail não está cadastrado nesta escola. Solicite acesso ao administrador.');
        localStorage.removeItem('eecm_login_error');
        
        // Limpa a query string sem recarregar a página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Redirecionamento automático após autenticação confirmada
  useEffect(() => {
    if ((user || isGuest) && isAuthRestored) {
      if (typeof window !== 'undefined' && currentUserSchoolId && currentUserSchoolId !== 'DRE') {
        const hostname = window.location.hostname.toLowerCase();
        if (!hostname.includes('localhost')) {
          const canonicalHost = currentUserSchoolId === 'heliodoro' 
            ? 'eecmheliodoro.kallyteros.com.br' 
            : 'eecmprofjoaobatista.kallyteros.com.br';
            
          if (hostname !== canonicalHost) {
            console.log(`[REDIRECT] Usuário pertence à escola ${currentUserSchoolId}. Redirecionando para ${canonicalHost}...`);
            window.location.href = `https://${canonicalHost}/`;
            return;
          }
        }
      }
      router.push(currentUserRole === 'admin_global' ? '/dre' : currentUserRole === 'PROFESSOR' ? '/registro-disciplinar' : '/');
    }
  }, [user, isGuest, currentUserRole, currentUserSchoolId, isAuthRestored, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const usernameNorm = username.trim().toLowerCase().replace('ç', 'c').replace('ã', 'a');

    if (isSupabaseReady()) {
      const emailCandidates: string[] = [];

      if (username.includes('@')) {
        emailCandidates.push(username.trim());
      } else {
        const dbSchoolId = getDbSchoolId(tenantId);
        if (dbSchoolId !== 'joaobatista') {
          emailCandidates.push(`${usernameNorm}@${dbSchoolId}.eecm.local`);
        }
        emailCandidates.push(`${usernameNorm}@eecm.local`);
      }

      for (const emailToUse of emailCandidates) {
        try {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password,
          });

          if (!authError && data?.user) {
            return; // redirect via useEffect
          }
        } catch (_err) {
          // tenta o próximo candidato ou exibe erro de conexão
        }
      }

      setError('Usuário ou senha inválidos.');
      setLoading(false);
    } else {
      setError('Serviço de autenticação não disponível no momento.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseReady()) {
      setError('Serviço de autenticação do Google não disponível no momento.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao Google.');
      setLoading(false);
    }
  };

  const [processingOAuth, setProcessingOAuth] = useState(false);

  // Detecta se é um callback do Google/OAuth e mostra tela de carregamento premium
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('code')) {
        setProcessingOAuth(true);
      }
    }
  }, []);

  // Timeout para impedir loop infinito em falhas do OAuth
  useEffect(() => {
    if (processingOAuth) {
      const timer = setTimeout(() => {
        setProcessingOAuth(false);
        setError('O tempo limite de login foi excedido. Por favor, tente novamente.');
      }, 12000); // 12 segundos de tolerância
      
      return () => clearTimeout(timer);
    }
  }, [processingOAuth]);

  if (processingOAuth && !error) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
        <h2 className="text-xl font-bold tracking-wide">Validando acesso...</h2>
        <p className="text-slate-400 text-sm mt-1 text-center px-4">Aguarde enquanto confirmamos sua sessão com o Google.</p>
      </div>
    );
  }

  if (user || isGuest) return null;

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 relative overflow-hidden">
      {/* Background — logo desfocada */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoLogin}
        alt=""
        className="absolute -right-32 md:-right-24 top-[40%] md:top-[45%] -translate-y-1/2 w-[102vw] md:w-[60vw] max-w-[780px] pointer-events-none object-contain select-none"
        style={{ opacity: 0.15, mixBlendMode: 'screen' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-md p-6 sm:p-7 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl relative z-10 mx-4 transition-all duration-300">
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoLogin}
              alt="Logo School"
              className="w-full h-full object-contain drop-shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            {/* Fallback se a logo falhar */}
            <div style={{ display: 'none' }} className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-600/30">
              <Trophy className="text-white w-8 h-8" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight text-center">{schoolName}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 text-center">{SCHOOL_SUBTITLE}</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <style>{`
          .password-container {
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: max-height 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-out;
          }
          .password-container.expanded {
            max-height: 120px;
            opacity: 1;
          }
          .submit-container {
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: max-height 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-out;
          }
          .submit-container.expanded {
            max-height: 60px;
            opacity: 1;
            margin-top: 1rem;
          }
          @media (prefers-reduced-motion: reduce) {
            .password-container, .submit-container {
              transition: none !important;
            }
          }
        `}</style>

        {/* Botão Google Login Premium - Acima do e-mail */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold py-2.5 rounded-xl transition-all duration-250 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Conta do Google (Gmail)
        </button>

        {/* Divisor de métodos de Login */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-slate-200" />
          <span className="px-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">ou</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail ou Usuário</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setShowPasswordSection(true)}
                onClick={() => setShowPasswordSection(true)}
                required
                autoComplete="username"
                className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ex: seu.nome@escola.com"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className={`password-container ${showPasswordSection ? 'expanded' : ''}`}>
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Senha de Acesso</label>
                <a href="#" tabIndex={-1} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors outline-none cursor-pointer">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={showPasswordSection}
                  autoComplete="current-password"
                  className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          <div className={`submit-container ${showPasswordSection ? 'expanded' : ''}`}>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl transition-all duration-250 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar com E-mail <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200/60 text-center">
          <p className="text-[11px] text-slate-400 italic">
            Versão: {versionData.version}
          </p>
        </div>
      </div>
    </div>
  );
}
