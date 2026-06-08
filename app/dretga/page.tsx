'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  Mail,
  FolderOpen,
  BookOpen,
  Users,
  Calendar,
  ExternalLink,
  Building2,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseReady } from '@/lib/supabase';
import { type ProvisionStep } from '@/lib/supabase-provision';

// ── Tipos ──────────────────────────────────────────────────────────────────

type AuthMethod = 'google' | 'email' | null;

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  authMethod: AuthMethod;
  email: string;
  password: string;
  schoolName: string;
  slug: string;
  dreId: string;
  gestor: string;
  phone: string;
  driveFolder: string;
  driveFolderName: string;
  driveFolderValid: boolean;
  provisionStep: ProvisionStep | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DRE_OPTIONS = [
  { id: 'DRETGA', label: 'DRE Tangará da Serra (DRETGA)' },
];

const PROVISION_STEPS: { key: ProvisionStep; label: string }[] = [
  { key: 'sending', label: 'Enviando informações' },
  { key: 'database', label: 'Construindo banco de dados seguro' },
  { key: 'tables', label: 'Criando tabelas e estrutura' },
  { key: 'drive', label: 'Configurando Google Drive' },
  { key: 'interface', label: 'Preparando sua interface' },
  { key: 'done', label: 'Tudo pronto!' },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractFolderId(input: string): string {
  // Aceita URL do Drive ou ID direto
  const match = input.match(/[-\w]{25,}/);
  return match ? match[0] : input.trim();
}

function normalizeTenantSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^eecm/, '');
}

// ── Componente Principal ───────────────────────────────────────────────────

const INITIAL_STATE: WizardState = {
  step: 1,
  authMethod: null,
  email: '',
  password: '',
  schoolName: '',
  slug: '',
  dreId: 'DRETGA',
  gestor: '',
  phone: '',
  driveFolder: '',
  driveFolderName: '',
  driveFolderValid: false,
  provisionStep: null,
};

export default function DretgaOnboarding() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [provisionDone, setProvisionDone] = useState(false);
  const [authError, setAuthError] = useState('');
  const [provisionError, setProvisionError] = useState('');

  // Detecta retorno do OAuth do Google (step=3 na URL)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam !== '3') return;

    async function restoreGoogleSession() {
      setLoading(true);
      setAuthError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const googleEmail = session?.user?.email?.toLowerCase().trim();
        if (!googleEmail) {
          const message = 'Não foi possível obter o e-mail da conta Google. Faça login novamente.';
          setAuthError(message);
          toast.error(message);
          setState((s) => ({ ...s, step: 2, authMethod: 'google', email: '' }));
          return;
        }

        setState((s) => ({ ...s, step: 3, authMethod: 'google', email: googleEmail }));
      } finally {
        setLoading(false);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    restoreGoogleSession();
  }, []);

  // Inicia provisionamento ao entrar no step 6
  useEffect(() => {
    if (state.step !== 6 || provisionDone) return;

    async function runProvision() {
      // Animação local dos steps
      const stepOrder: ProvisionStep[] = ['sending', 'database', 'tables', 'drive', 'interface', 'done'];
      const delays = [1200, 2000, 1800, 1000, 1500, 0];

      setProvisionError('');
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          schoolName: state.schoolName,
          slug: state.slug,
          dreId: state.dreId,
          gestor: { email: state.email, name: state.gestor },
          driveFolder: state.driveFolder,
        }),
      });
      const provisionData = await res.json().catch(() => null);

      if (!res.ok || !provisionData?.ok) {
        const message = provisionData?.error || 'Falha ao provisionar escola.';
        setProvisionError(message);
        toast.error(message);
        return;
      }

      // Animação passo a passo
      for (let i = 0; i < stepOrder.length; i++) {
        setState((s) => ({ ...s, provisionStep: stepOrder[i] }));
        if (delays[i] > 0) await new Promise((r) => setTimeout(r, delays[i]));
      }

      setProvisionDone(true);
    }

    runProvision();
  }, [state.step, provisionDone, state.schoolName, state.slug, state.dreId, state.email, state.gestor, state.driveFolder]);

  const progress = (state.step / 6) * 100;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGoogleAuth = async () => {
    if (!isSupabaseReady()) {
      toast.error('Serviço de autenticação não disponível.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setState((s) => ({ ...s, authMethod: 'google' }));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dretga?step=3` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!state.email || !state.password) return;
    if (!isSupabaseReady()) {
      toast.error('Serviço de autenticação não disponível.');
      return;
    }
    setLoading(true);
    setAuthError('');
    setState((s) => ({ ...s, authMethod: 'email' }));
    const { error } = await supabase.auth.signUp({
      email: state.email,
      password: state.password,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      setState((s) => ({ ...s, step: 3 }));
      setLoading(false);
    }
  };

  const handleValidateDrive = async () => {
    const folderId = extractFolderId(state.driveFolder);
    if (!folderId) return;
    setDriveLoading(true);
    setDriveError('');
    try {
      const res = await fetch('/api/onboarding/validate-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      if (data.ok) {
        setState((s) => ({ ...s, driveFolderValid: true, driveFolderName: data.name || folderId }));
        toast.success(`Pasta "${data.name}" verificada com sucesso!`);
      } else {
        setDriveError(data.error || 'Pasta não encontrada ou sem permissão.');
        setState((s) => ({ ...s, driveFolderValid: false }));
      }
    } catch {
      setDriveError('Erro ao verificar pasta.');
    } finally {
      setDriveLoading(false);
    }
  };

  const goTo = (step: WizardState['step']) => setState((s) => ({ ...s, step }));

  const handleSchoolDataNext = () => {
    if (state.authMethod === 'google' && !state.email.trim()) {
      const message = 'E-mail Google ausente. Faça login novamente para continuar.';
      setAuthError(message);
      toast.error(message);
      return;
    }
    goTo(4);
  };

  const handleProvisionNext = () => {
    if (!state.email.trim()) {
      const message = 'E-mail do gestor ausente. Faça login novamente para continuar.';
      setAuthError(message);
      toast.error(message);
      return;
    }
    goTo(6);
  };

  // ── Slides de animação ────────────────────────────────────────────────────

  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  // ── Render steps ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100">
          <motion.div
            className="h-full bg-blue-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>

        <div className="p-8">
          {/* Back button */}
          {state.step > 1 && state.step < 6 && (
            <button
              onClick={() => goTo((state.step - 1) as WizardState['step'])}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          )}

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Boas-vindas ── */}
            {state.step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" size={28} />
                  <span className="text-2xl font-bold text-blue-600">SIGMILITAR</span>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-800">
                    Cadastre sua escola no SIGMILITAR
                  </h1>
                  <p className="text-slate-500 text-sm">
                    Configure tudo em menos de 5 minutos. Sem cartão de crédito.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 py-2">
                  {[
                    { icon: <ShieldCheck size={18} className="text-blue-600" />, label: 'Disciplina cívico-militar' },
                    { icon: <BookOpen size={18} className="text-emerald-600" />, label: 'Gestão pedagógica' },
                    { icon: <Users size={18} className="text-purple-600" />, label: 'Multi-usuário' },
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl text-center">
                      {f.icon}
                      <span className="text-xs text-slate-600 font-medium">{f.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => goTo(2)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md"
                >
                  Começar cadastro <ArrowRight size={18} />
                </button>

                <p className="text-center text-sm text-slate-400">
                  Já tem conta?{' '}
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Fazer login
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: Autenticação ── */}
            {state.step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Como deseja entrar?</h2>
                  <p className="text-slate-500 text-sm mt-1">Escolha o método de autenticação</p>
                </div>

                {authError && (
                  <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm">
                    {authError}
                  </div>
                )}

                {/* Google */}
                <button
                  onClick={() => { setState((s) => ({ ...s, authMethod: 'google' })); handleGoogleAuth(); }}
                  disabled={loading}
                  className="w-full flex items-center gap-3 border-2 border-slate-200 hover:border-blue-600 rounded-xl p-4 transition-all group"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-slate-700 group-hover:text-blue-700">Entrar com Google</div>
                    <div className="text-xs text-slate-400">Recomendado — mais rápido e seguro</div>
                  </div>
                  {loading && state.authMethod === 'google' && (
                    <Loader2 className="ml-auto animate-spin text-blue-600" size={18} />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-slate-100" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">ou</span>
                  <div className="flex-1 border-t border-slate-100" />
                </div>

                {/* Email */}
                {state.authMethod !== 'email' ? (
                  <button
                    onClick={() => setState((s) => ({ ...s, authMethod: 'email' }))}
                    className="w-full flex items-center gap-3 border-2 border-slate-200 hover:border-blue-600 rounded-xl p-4 transition-all group"
                  >
                    <Mail size={20} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-700 group-hover:text-blue-700">Email e senha</div>
                      <div className="text-xs text-slate-400">Crie uma conta com seu e-mail</div>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={state.email}
                      onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Senha (mínimo 8 caracteres)"
                      value={state.password}
                      onChange={(e) => setState((s) => ({ ...s, password: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    <button
                      onClick={handleEmailSignup}
                      disabled={loading || !state.email || state.password.length < 8}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <>Criar conta <ArrowRight size={16} /></>}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: Dados da escola ── */}
            {state.step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Dados da escola</h2>
                  <p className="text-slate-500 text-sm mt-1">Informe os dados da sua unidade escolar</p>
                </div>

                {state.authMethod === 'google' && (
                  <div className={`border rounded-lg px-3 py-2 text-sm ${state.email ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
                    {state.email ? `E-mail Google confirmado: ${state.email}` : (authError || 'E-mail Google ausente. Faça login novamente para continuar.')}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da escola *</label>
                    <input
                      type="text"
                      placeholder="Ex: EECM Prof. João Batista"
                      value={state.schoolName}
                      onChange={(e) => setState((s) => ({ ...s, schoolName: e.target.value, slug: generateSlug(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    {state.slug && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                        <span className="text-blue-500 font-mono">sigmilitar.com.br/{state.slug}</span>
                        — seu endereço na plataforma
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Diretoria Regional de Ensino *</label>
                    <select
                      value={state.dreId}
                      onChange={(e) => setState((s) => ({ ...s, dreId: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
                    >
                      <option value="">Selecione a DRE</option>
                      {DRE_OPTIONS.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do gestor responsável *</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={state.gestor}
                      onChange={(e) => setState((s) => ({ ...s, gestor: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone de contato</label>
                    <input
                      type="tel"
                      placeholder="(65) 99999-9999"
                      value={state.phone}
                      onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSchoolDataNext}
                  disabled={!state.schoolName || state.dreId !== 'DRETGA' || !state.gestor || (state.authMethod === 'google' && !state.email)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 4: Tutorial + Planilha ── */}
            {state.step === 4 && (
              <motion.div
                key="step4"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Prepare sua escola</h2>
                  <p className="text-slate-500 text-sm mt-1">Dicas para começar rapidamente após o cadastro</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      icon: <Users className="text-blue-600" size={20} />,
                      title: '📋 Importe seus alunos',
                      desc: 'Use a planilha modelo para importar todos os alunos de uma vez',
                      bg: 'bg-blue-50',
                    },
                    {
                      icon: <Users className="text-purple-600" size={20} />,
                      title: '👤 Adicione professores',
                      desc: 'Convide sua equipe pelo painel de configurações',
                      bg: 'bg-purple-50',
                    },
                    {
                      icon: <Calendar className="text-emerald-600" size={20} />,
                      title: '📅 Crie a grade horária',
                      desc: 'Configure turmas e turnos após o primeiro login',
                      bg: 'bg-emerald-50',
                    },
                  ].map((card, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 ${card.bg} rounded-xl`}>
                      <div className="shrink-0 mt-0.5">{card.icon}</div>
                      <div>
                        <div className="font-semibold text-slate-700 text-sm">{card.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{card.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Planilha modelo */}
                <div className="flex flex-col gap-2">
                  <a
                    href="SEU_LINK_GOOGLE_SHEETS_AQUI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 font-medium transition-all"
                  >
                    <ExternalLink size={14} /> Abrir planilha modelo no Google Drive
                  </a>
                  <button
                    type="button"
                    onClick={() => goTo(5)}
                    className="text-sm text-slate-400 underline underline-offset-2 hover:text-slate-600 transition-colors"
                  >
                    Fazer depois
                  </button>
                </div>

                <button
                  onClick={() => goTo(5)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 5: Google Drive (opcional) ── */}
            {state.step === 5 && (
              <motion.div
                key="step5"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="text-amber-500" size={22} />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Pasta do Google Drive</h2>
                    <p className="text-slate-500 text-sm">Opcional — pode configurar depois</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">Compartilhe a pasta com nossa conta:</p>
                  <code className="text-xs bg-amber-100 px-2 py-1 rounded font-mono select-all">
                    sigmilitar@eecm-494223.iam.gserviceaccount.com
                  </code>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">URL ou ID da pasta compartilhada</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Cole o link ou ID da pasta"
                      value={state.driveFolder}
                      onChange={(e) => setState((s) => ({ ...s, driveFolder: e.target.value, driveFolderValid: false, driveFolderName: '' }))}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    <button
                      onClick={handleValidateDrive}
                      disabled={driveLoading || !state.driveFolder.trim()}
                      className="flex items-center gap-1.5 px-4 py-3 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-all shrink-0"
                    >
                      {driveLoading ? <Loader2 className="animate-spin" size={16} /> : 'Verificar'}
                    </button>
                  </div>

                  {state.driveFolderValid && (
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                      <CheckCircle2 size={16} />
                      <span>Pasta <strong>{state.driveFolderName}</strong> verificada</span>
                    </div>
                  )}
                  {driveError && (
                    <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm">
                      {driveError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setState((s) => ({ ...s, driveFolder: '', driveFolderValid: false, driveFolderName: '' }))}
                    className="text-sm text-slate-400 underline underline-offset-2 mt-1 hover:text-slate-600 transition-colors"
                  >
                    Configurar pasta depois
                  </button>
                </div>

                <button
                  onClick={handleProvisionNext}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {state.driveFolder && !state.driveFolderValid ? 'Pular e continuar' : 'Continuar'} <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── STEP 6: Provisionamento ── */}
            {state.step === 6 && (
              <motion.div
                key="step6"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="text-blue-600" size={28} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Configurando sua escola</h2>
                  <p className="text-slate-500 text-sm mt-1">Aguarde enquanto preparamos tudo para você</p>
                </div>

                {provisionError && (
                  <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm">
                    {provisionError}
                  </div>
                )}

                <div className="space-y-3">
                  {PROVISION_STEPS.map((s, i) => {
                    const currentIdx = PROVISION_STEPS.findIndex((p) => p.key === state.provisionStep);
                    const stepIdx = i;
                    const isDone = currentIdx > stepIdx || (state.provisionStep === 'done' && s.key === 'done');
                    const isCurrent = state.provisionStep === s.key && s.key !== 'done';

                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                          {isDone ? (
                            <CheckCircle2 className="text-emerald-500" size={22} />
                          ) : isCurrent ? (
                            <Loader2 className="text-blue-600 animate-spin" size={20} />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                          )}
                        </div>
                        <span className={`text-sm font-medium transition-colors ${isDone ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {provisionDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={28} />
                      <p className="font-semibold text-emerald-800">Escola criada com sucesso!</p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Você foi cadastrado como <strong>GESTOR</strong> — pode adicionar sua equipe agora
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/${normalizeTenantSlug(state.slug)}`)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
                    >
                      Acessar meu painel <ArrowRight size={18} />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step indicator */}
        <div className="px-8 pb-6 flex items-center justify-center gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all duration-300 ${n === state.step ? 'w-6 bg-blue-600' : n < state.step ? 'w-3 bg-blue-300' : 'w-3 bg-slate-200'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
