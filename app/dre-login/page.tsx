'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, UserIcon, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import versionData from '@/lib/version.json';

export default function DreLogin() {
  const router = useRouter();
  const { user, currentUserRole, isAuthRestored } = useAppContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // Aguarda isAuthRestored para garantir que appUsers já carregou
  useEffect(() => {
    if (!isAuthRestored) return;
    if (!user) return;

    if (currentUserRole === 'admin_global') {
      router.replace('/dre');
    } else if (currentUserRole !== 'GUEST') {
      // Logou com sucesso mas sem permissão DRE
      setChecking(false);
      setLoading(false);
      setError('Acesso negado. Este portal é restrito a gestores da DRE.');
    }
  }, [user, currentUserRole, isAuthRestored, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setChecking(true);
    setError('');

    const emailToUse = username.toLowerCase().trim().includes('@')
      ? username.trim()
      : `${username.toLowerCase().trim()}@eecm.local`;

    if (supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (authError) {
          setError(authError.message === 'Invalid login credentials' ? 'Usuário ou senha inválidos.' : authError.message);
          setLoading(false);
          setChecking(false);
        }
      } catch (err: any) {
        setError(err.message || 'Erro de conexão com o servidor.');
        setLoading(false);
        setChecking(false);
      }
    } else {
      setError('Supabase não inicializado.');
      setLoading(false);
      setChecking(false);
    }
  };

  // Se já autenticado como admin_global, não renderiza o login
  if (isAuthRestored && user && currentUserRole === 'admin_global') return null;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-white text-[#2B2C33] overflow-hidden">
      
      {/* Lado Esquerdo: Formulário */}
      <div className="w-full md:w-1/3 lg:w-[480px] flex flex-col justify-between p-8 md:p-12 border-r border-[#F4F5F7] relative z-10 bg-white overflow-y-auto shadow-xl">
        <div className="w-full max-w-sm mx-auto flex flex-col pt-4">
          
          <div className="flex items-center justify-center mb-10 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_dre_color.svg"
              alt="Logo DRE"
              className="h-28 md:h-32 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[#2B2C33] text-center">Painel DRE</h1>
          <p className="text-[#2B2C33]/70 text-sm mb-8 font-light text-center">Gestão Regional de Educação</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {checking && !error && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 text-sm text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando permissões...
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2B2C33]/80 mb-2">Usuário DRE</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Ex: gestor"
                  className="w-full bg-white border border-[#2B2C33]/10 rounded-xl pl-10 pr-4 py-3 text-sm text-[#2B2C33] focus:outline-none focus:ring-1 focus:ring-[#0052CC]/50 focus:border-[#0052CC]/50 transition-colors placeholder-[#2B2C33]/30"
                />
                <UserIcon className="w-4 h-4 text-[#2B2C33]/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#2B2C33]/80">Senha de Acesso</label>
                <a href="#" tabIndex={-1} className="text-xs text-[#0052CC] hover:text-[#0052CC]/80 transition-colors">
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
                  className="w-full bg-white border border-[#2B2C33]/10 rounded-xl pl-10 pr-4 py-3 text-sm text-[#2B2C33] focus:outline-none focus:ring-1 focus:ring-[#0052CC]/50 focus:border-[#0052CC]/50 transition-colors placeholder-[#2B2C33]/30"
                />
                <KeyRound className="w-4 h-4 text-[#2B2C33]/40 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || checking}
              className="w-full mt-2 bg-[#0052CC] hover:bg-[#0052CC]/90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading || checking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar no Sistema <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="w-full max-w-sm mx-auto mt-12 pt-6 border-t border-[#2B2C33]/5 text-center">
          <div className="flex items-center justify-center gap-2 text-[#2B2C33]/50 text-xs font-medium mb-2">
            <ShieldCheck className="w-4 h-4 text-[#0052CC]" />
            <span>Acesso restrito — gestores DRE</span>
          </div>
        </div>
      </div>

      {/* Lado Direito: Divulgação DRE */}
      <div className="hidden md:flex flex-1 flex-col justify-center p-12 lg:p-24 relative overflow-hidden bg-white">
        {/* Background dots exactly like LandingPage.tsx hero */}
        <div className="absolute inset-0 bg-[#F4F5F7] opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2B2C33 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Background glow effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0052CC]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0052CC]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl relative z-10 mx-auto w-full">
          <span className="text-[#0052CC] text-8xl font-serif absolute -top-10 -left-10 opacity-10 select-none">"</span>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#2B2C33] mb-10 leading-tight">
            Acompanhe todas as escolas cívico-militares da região em um único painel consolidado.
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0052CC] font-bold border border-[#2B2C33]/10 shadow-sm">
              D
            </div>
            <div>
              <div className="text-[#2B2C33] font-bold">Direção Regional</div>
              <div className="text-[#2B2C33]/50 text-sm font-mono mt-0.5">Visão Estratégica</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
