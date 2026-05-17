'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  KeyRound, Loader2, ArrowRight, Building2, ShieldCheck,
  AlertCircle,
} from 'lucide-react';
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

      // Salva sessão
      localStorage.setItem('eecm_session', JSON.stringify({
        type: 'real',
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      }));

      // O useEffect acima cuida do redirect após o store resolver o role
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  if (user && currentUserRole === 'admin_global') return null;

  return (
    <div className="min-h-screen w-full flex bg-[#080e1a]">

      {/* Painel esquerdo — identidade DRE */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-[#0a1628] border-r border-white/5 p-12 relative overflow-hidden">

        {/* Textura de fundo sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(37,99,235,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(15,40,90,0.3),transparent_60%)]" />

        {/* Grade decorativa */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo / topo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-blue-400 uppercase">Secretaria Municipal de Educacao</p>
            </div>
          </div>
        </div>

        {/* Conteudo central */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.25em] text-blue-500 uppercase mb-3">Plataforma DRE</p>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
              Gestao Regional<br />
              <span className="text-blue-400">de Educacao</span>
            </h1>
            <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-sm">
              Painel consolidado de monitoramento disciplinar, desempenho e indicadores das escolas da rede municipal.
            </p>
          </div>

          {/* Stats decorativos */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Escolas', value: '2+' },
              { label: 'Indicadores', value: '12' },
              { label: 'Acesso', value: 'DRE' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 text-center">
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodape */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Acesso restrito — somente gestores DRE autorizados</span>
          </div>
        </div>
      </div>

      {/* Painel direito — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">

        {/* Header mobile */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">Secretaria de Educacao</p>
            <p className="text-xs text-slate-400">Plataforma DRE</p>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Titulo */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">Acesso restrito</h2>
            <p className="text-slate-400 text-sm mt-1">Insira suas credenciais de gestor DRE.</p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Usuário ou e-mail
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="gestor@eecm.local"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
                <KeyRound className="absolute right-3 top-3.5 w-4 h-4 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Acessar Painel DRE <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link voltar */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <a
              href="/login"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Acessar como usuario escolar
            </a>
          </div>

          <p className="mt-6 text-center text-[10px] text-slate-700">
            v{versionData.version} — Acesso DRE
          </p>
        </div>
      </div>
    </div>
  );
}
