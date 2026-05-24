'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { useTenantConfig } from '@/lib/useTenantConfig';
import { Trophy, ShieldCheck, User as UserIcon, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import versionData from '@/lib/version.json';
import { SCHOOL_SUBTITLE } from '@/lib/school';

// Usuários de fallback (mock) — apenas para desenvolvimento/demo
// Quando o Supabase está ativo, estes são ignorados para usuários reais
const MOCK_USERS: Record<string, { role: string; name: string }> = {
  gestor:    { role: 'GESTOR',  name: 'Gestor' },
  maykon:    { role: 'GESTOR',  name: 'Maykon' },
  manoel:    { role: 'GESTOR',  name: 'Manoel' },
  djeovani:  { role: 'MONITOR', name: 'Djeovani' },
  joana:     { role: 'MONITOR', name: 'Joana' },
  edma:      { role: 'MONITOR', name: 'Edma' },
  murillo:   { role: 'MONITOR', name: 'Murillo' },
  george:    { role: 'MONITOR', name: 'George' },
  proenca:   { role: 'MONITOR', name: 'Proença' },
};

export default function Login() {
  const router = useRouter();
  const { user, isGuest, setGuestMode, setMockUser, currentUserRole } = useAppContext();
  const { logoLogin, schoolName } = useTenantConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto redirect após login bem-sucedido
  useEffect(() => {
    if (user || isGuest) {
      router.push(currentUserRole === 'admin_global' ? '/dre' : '/');
    }
  }, [user, isGuest, currentUserRole, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const usernameNorm = username.trim().toLowerCase().replace('ç', 'c').replace('ã', 'a');

    // ── 1. Tentativa via Supabase Auth ──────────────────────────────────────
    if (isSupabaseReady()) {
      try {
        const emailToUse = username.includes('@')
          ? username.trim()
          : `${usernameNorm}@eecm.local`;

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (!authError && data?.user) {
          // Login real — store.tsx captura via onAuthStateChange
          localStorage.setItem('eecm_session', JSON.stringify({
            type: 'real',
            user: {
              id: data.user.id,
              email: data.user.email,
              user_metadata: data.user.user_metadata,
            },
          }));
          return; // redirect acontece via useEffect acima
        }

        // Supabase retornou erro — decide se bloqueia ou cai no mock
        if (authError) {
          const msg = authError.message.toLowerCase();
          const isNotFound = msg.includes('invalid') || msg.includes('not found');
          const isMock = usernameNorm in MOCK_USERS;

          if (!isMock) {
            // Usuário não é mock e falhou no Supabase → credenciais inválidas
            setError('Usuário ou senha inválidos');
            setLoading(false);
            return;
          }
          // É um usuário mock e o Supabase não o conhece → cai no bloco 2
        }
      } catch (_err) {
        // Erro de rede/timeout → cai no bloco 2 (mock)
      }
    }

    // ── 2. Fallback mock ────────────────────────────────────────────────────
    const mockEntry = MOCK_USERS[usernameNorm];
    // Aceita senha igual ao nome de usuário (sem acentos) ou "gestor123" p/ gestor
    const mockPasswordValid =
      password.toLowerCase().replace('ç', 'c').replace('ã', 'a') === usernameNorm ||
      (usernameNorm === 'gestor' && password === 'gestor123');

    if (mockEntry && mockPasswordValid) {
      localStorage.setItem('eecm_session', JSON.stringify({
        type: 'mock',
        user: {
          id: `mock-${usernameNorm}`,
          email: `${usernameNorm}@eecm.local`,
          user_metadata: {
            name: mockEntry.name,
            role: mockEntry.role,
          },
        },
      }));
      setMockUser(usernameNorm);
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

  if (user || isGuest) return null;

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 relative overflow-hidden">

      {/* Background — logo desfocada */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoLogin}
        alt=""
        className="absolute -right-32 md:-right-24 top-[40%] md:top-[45%] -translate-y-1/2 w-[102vw] md:w-[60vw] max-w-[780px] pointer-events-none object-contain"
        style={{ opacity: 0.15, mixBlendMode: 'screen' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-md p-6 sm:p-7 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl relative z-10 mx-4">
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoLogin}
              alt="Logo EECM"
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
                placeholder="Ex: joao.silva@eecm.local"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
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
