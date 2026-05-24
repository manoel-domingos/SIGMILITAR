'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { Trophy, ShieldCheck, User as UserIcon, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import versionData from '@/lib/version.json';
import { SCHOOL_NAME, SCHOOL_SUBTITLE, SCHOOL_LOGO_LOGIN } from '@/lib/school';

export default function Login() {
  const router = useRouter();
  const { user, isGuest, setGuestMode, setMockUser, isSupabaseConnected, currentUserRole } = useAppContext();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto redirect: admin_global vai para /dre, demais para /
  useEffect(() => {
    if (user || isGuest) {
      router.push(currentUserRole === 'admin_global' ? '/dre' : '/');
    }
  }, [user, isGuest, currentUserRole, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Tentar autenticacao real via Supabase PRIMEIRO
    // Usa isSupabaseReady() em vez de `if (supabase)` — o Proxy é sempre truthy
    // mesmo quando as credenciais estão ausentes no bundle do cliente.
    console.log('[v0] login: supabase ready =', isSupabaseReady());
    if (isSupabaseReady()) {
      try {
        const emailToUse = username.includes('@') ? username : `${username.toLowerCase()}@eecm.local`;
        console.log('[v0] login: tentando Supabase com email =', emailToUse);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        console.log('[v0] login: authError =', authError?.message, '| user =', data?.user?.email);

        if (!authError && data.user) {
          localStorage.setItem('eecm_session', JSON.stringify({
            type: 'real',
            user: {
              id: data.user.id,
              email: data.user.email,
              user_metadata: data.user.user_metadata
            }
          }));
          return;
        }

        // Erro real do Supabase (credenciais erradas, usuário não encontrado, etc.)
        if (authError) {
          console.log('[v0] login: erro Supabase =', authError.message);
          // Só mostra erro de credenciais — não cai no mock para usuários reais
          if (authError.message.toLowerCase().includes('invalid') ||
              authError.message.toLowerCase().includes('not found') ||
              authError.message.toLowerCase().includes('email')) {
            setError('Usuário ou senha inválidos');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.log('[v0] login: exceção Supabase =', err);
        // Continua para fallback mock apenas em caso de erro de rede/timeout
      }
    } else {
      console.log('[v0] login: Supabase não disponível — usando fallback mock');
    }

    // 2. Fallback para mock users (caso Supabase falhe ou nao esteja configurado)
    const validUsers = ['gestor', 'maykon', 'manoel', 'djeovani', 'joana', 'edma', 'murillo', 'george', 'proença', 'proenca'];
    if (validUsers.includes(username.toLowerCase()) && password.toLowerCase() === username.toLowerCase().replace('ç', 'c')) {
      localStorage.setItem('eecm_session', JSON.stringify({
        type: 'mock',
        user: {
          id: `mock-${username.toLowerCase()}`,
          email: `${username.toLowerCase()}@eecm.local`,
          user_metadata: {
            name: username.charAt(0).toUpperCase() + username.slice(1).toLowerCase(),
            role: ['gestor', 'maykon', 'manoel'].includes(username.toLowerCase()) ? 'GESTOR' : 'MONITOR'
          }
        }
      }));
      setMockUser(username.toLowerCase());
      router.push('/');
      return;
    }
    
    // Backwards compatibility for gestor123
    if (username === 'gestor' && password === 'gestor123') {
      setMockUser('gestor');
      router.push('/');
      return;
    }

    setError('Usuário ou senha inválidos');
    setLoading(false);
  };

  const handleGuestLogin = () => {
    setGuestMode();
    router.push('/');
  };

  if (user || isGuest) return null; // Prevent flash during redirect

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 relative overflow-hidden">
      
      {/* Background Decor */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SCHOOL_LOGO_LOGIN} alt="" className="absolute -right-32 md:-right-24 top-[40%] md:top-[45%] -translate-y-1/2 w-[102vw] md:w-[60vw] max-w-[780px] pointer-events-none object-contain" style={{ opacity: 0.15, mixBlendMode: 'screen' }} />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-md p-6 sm:p-7 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl relative z-10 mx-4">
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center relative mb-3">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={SCHOOL_LOGO_LOGIN} alt="Logo EECM" className="w-full h-full object-contain drop-shadow-xl" />
             
             <div className="fallback-container hidden flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4 transform -rotate-3 hover:rotate-0 transition-transform">
                  <Trophy className="text-white w-8 h-8" />
                </div>
             </div>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight text-center">{SCHOOL_NAME}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 text-center">{SCHOOL_SUBTITLE}</p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ex: gestor"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Senha de Acesso</label>
              <a href="#" tabIndex={-1} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors outline-none cursor-pointer">Esqueceu a senha?</a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-600/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Entrar no Sistema <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200/60 text-center">
          <button 
            onClick={handleGuestLogin}
            className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            Acesso Somente Leitura
          </button>
          <p className="mt-6 text-[11px] text-slate-400 italic">
            Versão: {versionData.version}
          </p>
        </div>
      </div>
    </div>
  );
}
