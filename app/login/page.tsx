'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { useTenantConfig, getDbSchoolId, getTenantSlugFromSchoolId } from '@/lib/useTenantConfig';
import { Trophy, User as UserIcon, KeyRound, Loader2, ArrowRight, Building2, ShieldCheck, BookOpen, ChevronDown, ChevronRight, X } from 'lucide-react';
import versionData from '@/lib/version.json';
import { SCHOOL_SUBTITLE } from '@/lib/school';

export default function Login() {
  const router = useRouter();
  const {
    user, isGuest, currentUserRole, currentUserSchoolId, isAuthRestored,
    showContextModal, setShowContextModal, contextSchools, setActivePanelModule, setActiveSchoolContext, activeSchoolContext
  } = useAppContext();
  const { logoLogin, schoolName, tenantId } = useTenantConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isCentral, setIsCentral] = useState(false);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  const handleAdminSelection = (schoolId: string, module: 'civico-militar' | 'pedagogico') => {
    const schoolExists = contextSchools.some(s => s.id === schoolId);
    if (!schoolExists) return;
    const slug = getTenantSlugFromSchoolId(schoolId);
    setActivePanelModule(module);
    setActiveSchoolContext(schoolId);
    
    // Salva sessionStorage
    const key = 'dre_context_chosen_' + new Date().toDateString();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, schoolId);
    }
    
    setShowContextModal(false);
    setExpandedSchool(null);
    router.push('/' + slug + (module === 'pedagogico' ? '/pedagogico' : ''));
  };

  const chooseContext = (schoolId: string) => {
    setActiveSchoolContext(schoolId);
    const key = 'dre_context_chosen_' + new Date().toDateString();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, schoolId);
    }
    setShowContextModal(false);
    setExpandedSchool(null);
    if (schoolId === 'DRE') {
      router.push('/dre');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      setIsCentral(hostname === 'sigmilitar.com.br' || hostname.endsWith('.sigmilitar.com.br') || hostname === 'localhost');
    }
  }, []);

  const activeLogo = isCentral ? '/LOGO SIGMILITAR.svg' : logoLogin;
  const activeSchoolName = isCentral ? 'SIGMILITAR' : schoolName;
  const activeSchoolSubtitle = isCentral ? 'Disciplina e Monitoramento Escolar' : SCHOOL_SUBTITLE;

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
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        const isCentralDomain = hostname === 'sigmilitar.com.br' || hostname.endsWith('.sigmilitar.com.br') || hostname === 'localhost';

        if (isCentralDomain) {
          // No domínio central: redireciona para a rota com slug da escola do usuário
          if (currentUserRole === 'admin_global') {
            const chosen = sessionStorage.getItem('dre_context_chosen_' + new Date().toDateString());
            if (chosen) {
              if (chosen === 'DRE') {
                router.push('/dre');
              } else {
                const slug = getTenantSlugFromSchoolId(chosen);
                router.push(`/${slug}`);
              }
              return;
            }
            setShowContextModal(true);
            return;
          }

          if (currentUserSchoolId && currentUserSchoolId !== 'DRE') {
            // Mapeia schoolId para o tenant slug
            const slug = getTenantSlugFromSchoolId(currentUserSchoolId);
            const targetPath = currentUserRole === 'PROFESSOR' ? `/${slug}/registro-disciplinar` : `/${slug}`;
            console.log(`[CENTRAL REDIRECT] Redirecionando para ${targetPath}...`);
            router.push(targetPath);
            return;
          }
        }
      }

      // Fallback
      const slug = getTenantSlugFromSchoolId(currentUserSchoolId);

      if (currentUserRole === 'admin_global') {
        const chosen = typeof window !== 'undefined' ? sessionStorage.getItem('dre_context_chosen_' + new Date().toDateString()) : null;
        if (chosen) {
          if (chosen === 'DRE') router.push('/dre');
          else router.push(`/${getTenantSlugFromSchoolId(chosen)}`);
        } else {
          setShowContextModal(true);
        }
      } else if (slug) {
        // Guard: só redireciona quando schoolId já foi carregado do banco.
        // Se slug for vazio (schoolId ainda null/undefined), o efeito re-dispara
        // quando currentUserSchoolId for populado pelo store.
        router.push(currentUserRole === 'PROFESSOR' ? `/${slug}/registro-disciplinar` : `/${slug}`);
      }
    }
  }, [user, isGuest, currentUserRole, currentUserSchoolId, isAuthRestored, router, setShowContextModal]);

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
          redirectTo: `${window.location.origin}/auth/callback`,
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

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-white text-[#2B2C33] overflow-hidden">
      
      {/* Lado Esquerdo: Formulário */}
      <div className="w-full md:w-1/3 lg:w-[480px] flex flex-col justify-between p-8 md:p-12 border-r border-[#F4F5F7] relative z-10 bg-white overflow-y-auto shadow-xl">
        <div className="w-full max-w-sm mx-auto flex flex-col pt-4">
          
          <div className="flex items-center justify-center mb-10 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLogo}
              alt="Logo"
              className="h-28 md:h-32 w-auto object-contain rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[#2B2C33]">Bem-vindo de volta</h1>
          <p className="text-[#2B2C33]/70 text-sm mb-8 font-light">Faça login na sua conta para continuar</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full flex items-center justify-center bg-white border border-[#2B2C33]/10 hover:bg-[#F4F5F7] disabled:opacity-50 text-[#2B2C33] font-medium py-3 rounded-xl transition-all shadow-sm"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continuar com o Google
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-[#2B2C33]/10" />
            <span className="px-3 text-[#2B2C33]/40 text-xs font-mono uppercase tracking-wider">ou</span>
            <div className="flex-1 border-t border-[#2B2C33]/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2B2C33]/80 mb-2">E-mail ou Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-white border border-[#2B2C33]/10 rounded-xl px-4 py-3 text-sm text-[#2B2C33] focus:outline-none focus:ring-1 focus:ring-[#0052CC]/50 focus:border-[#0052CC]/50 transition-colors placeholder-[#2B2C33]/30"
                placeholder="exemplo@escola.com.br"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#2B2C33]/80">Senha</label>
                <a href="#" className="text-xs text-[#0052CC] hover:text-[#0052CC]/80 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white border border-[#2B2C33]/10 rounded-xl px-4 py-3 text-sm text-[#2B2C33] focus:outline-none focus:ring-1 focus:ring-[#0052CC]/50 focus:border-[#0052CC]/50 transition-colors placeholder-[#2B2C33]/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#0052CC] hover:bg-[#0052CC]/90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Processando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-sm text-center text-[#2B2C33]/60 mt-8">
            Não tem uma conta? <a href="/#cta" className="text-[#0052CC] font-medium hover:underline">Solicitar Implantação</a>
          </p>
        </div>


      </div>

      {/* Lado Direito: Testemunho / Divulgação com Background do LandingPage */}
      <div className="hidden md:flex flex-1 flex-col justify-center p-12 lg:p-24 relative overflow-hidden bg-white">
        {/* Background dots exactly like LandingPage.tsx hero */}
        <div className="absolute inset-0 bg-[#F4F5F7] opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2B2C33 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Background glow effects to keep it dynamic */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0052CC]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0052CC]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl relative z-10 mx-auto w-full">
          <span className="text-[#0052CC] text-8xl font-serif absolute -top-10 -left-10 opacity-10 select-none">"</span>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#2B2C33] mb-10 leading-tight">
            Centralize ocorrências, automatize atas com IA e monitore turmas em tempo real. Muito simples e rápido.
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0052CC] font-bold border border-[#2B2C33]/10 shadow-sm">
              C
            </div>
            <div>
              <div className="text-[#2B2C33] font-bold">Coordenação Disciplinar</div>
              <div className="text-[#2B2C33]/50 text-sm font-mono mt-0.5">@gestao_escolar</div>
            </div>
          </div>
        </div>

        {/* Canto superior direito: Link para site / docs */}
        <div className="absolute top-10 right-10 z-10">
          <a href="/" className="flex items-center gap-2 bg-white border border-[#2B2C33]/10 px-4 py-2 rounded-lg text-sm text-[#2B2C33]/70 hover:text-[#0052CC] hover:bg-[#F4F5F7] transition-colors shadow-sm font-medium">
            <Building2 className="w-4 h-4" />
            Conhecer Plataforma
          </a>
        </div>
      </div>

      {/* Modal de seleção de contexto para Admin Global no Login */}
      {showContextModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowContextModal(false); setExpandedSchool(null); } }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 fade-in duration-200">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Qual painel deseja ver?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Selecione uma escola e a gestão correspondente ou visualize o painel consolidado da DRE.</p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => chooseContext('DRE')}
                className="w-full py-3 rounded-xl bg-[#0052cc] hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                <Building2 className="w-4 h-4" /> Painel DRE — Visão Consolidada
              </button>

              {contextSchools.map(s => {
                const isExpanded = expandedSchool === s.id;
                return (
                  <div key={s.id} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => setExpandedSchool(prev => prev === s.id ? null : s.id)}
                      className="w-full py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-left">{s.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="bg-slate-50 dark:bg-slate-950/40 px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1 animate-in slide-in-from-top-1 fade-in duration-150">
                        <button
                          onClick={() => handleAdminSelection(s.id, 'civico-militar')}
                          className="w-full py-2.5 px-4 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Gestão Cívico Militar
                        </button>
                        <button
                          onClick={() => handleAdminSelection(s.id, 'pedagogico')}
                          className="w-full py-2.5 px-4 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Gestão Pedagógica
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
