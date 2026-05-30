'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { useTenantConfig, getDbSchoolId } from '@/lib/useTenantConfig';
import { Trophy, User as UserIcon, KeyRound, Loader2, ArrowRight, Building2 } from 'lucide-react';
import versionData from '@/lib/version.json';
import { SCHOOL_SUBTITLE } from '@/lib/school';

export default function Login() {
  const router = useRouter();
  const {
    user, isGuest, currentUserRole, currentUserSchoolId, isAuthRestored
  } = useAppContext();
  const { logoLogin, schoolName, tenantId } = useTenantConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isCentral, setIsCentral] = useState(false);

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
            router.push('/dre');
            return;
          }

          if (currentUserSchoolId && currentUserSchoolId !== 'DRE') {
            // Mapeia schoolId para o tenant slug
            const slug = currentUserSchoolId === 'joaobatista' ? 'eecmprofjoaobatista' : currentUserSchoolId === 'heliodoro' ? 'eecmheliodoro' : currentUserSchoolId;
            const targetPath = currentUserRole === 'PROFESSOR' ? `/${slug}/registro-disciplinar` : `/${slug}`;
            console.log(`[CENTRAL REDIRECT] Redirecionando para ${targetPath}...`);
            router.push(targetPath);
            return;
          }
        }
      }

      // Fallback
      const slug = currentUserSchoolId === 'joaobatista' ? 'eecmprofjoaobatista' : currentUserSchoolId === 'heliodoro' ? 'eecmheliodoro' : currentUserSchoolId;
      router.push(currentUserRole === 'admin_global' ? '/dre' : currentUserRole === 'PROFESSOR' ? `/${slug}/registro-disciplinar` : `/${slug}`);
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

    </div>
  );
}
