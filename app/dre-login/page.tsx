'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, UserIcon, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import versionData from '@/lib/version.json';

export default function DreLogin() {
  const router = useRouter();
  const { user, currentUserRole } = useAppContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Já logado como admin_global → vai direto para /dre
  useEffect(() => {
    if (user && currentUserRole === 'admin_global') {
      router.replace('/dre');
    }
  }, [user, currentUserRole, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!supabase) {
      setError('Serviço indisponível. Tente novamente.');
      setLoading(false);
      return;
    }

    try {
      const emailToUse = username.includes('@')
        ? username
        : `${username.toLowerCase()}@eecm.local`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (authError || !data.user) {
        setError('Credenciais inválidas. Verifique e tente novamente.');
        setLoading(false);
        return;
      }

      localStorage.setItem('eecm_session', JSON.stringify({
        type: 'real',
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      }));
      // useEffect cuida do redirect após o store resolver o role
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  if (user && currentUserRole === 'admin_global') return null;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 relative overflow-hidden">

      {/* Decorativo blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Card principal */}
      <div className="w-full max-w-md p-6 sm:p-7 bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl relative z-10 mx-4 mb-4">

        {/* Logo colorida — sem fundo azul pois a logo já tem */}
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <div className="w-[6.5rem] h-[6.5rem] sm:w-[9rem] sm:h-[9rem] flex items-center justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_dre_color.svg"
              alt="Logo DRE"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight text-center">
            Painel DRE
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 text-center">
            Gestao Regional de Educacao
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Formulário — idêntico ao login da escola */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Ex: gestor"
                className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Senha de Acesso</label>
              <a href="#" tabIndex={-1} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors outline-none">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-700/30"
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

        {/* Rodapé */}
        <div className="mt-4 pt-4 border-t border-slate-200/60 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Acesso restrito — gestores DRE autorizados</span>
          </div>
          <p className="mt-4 text-[11px] text-slate-400 italic">
            Versão: {versionData.version}
          </p>
        </div>
      </div>

      {/* Rodapé institucional */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/base_dre.png"
        alt="Diretoria Regional de Educação — Tangará da Serra"
        className="w-full max-w-3xl mx-auto opacity-90 relative z-10 pointer-events-none select-none mt-2"
      />
    </div>
  );
}
