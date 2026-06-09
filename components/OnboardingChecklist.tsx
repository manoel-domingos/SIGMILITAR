'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle2, Circle, ChevronDown, ChevronUp, Rocket, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Step {
  id: string;
  label: string;
  desc: string;
  path: string; // relativo ao tenant, ex: '/configuracoes?tab=print'
  autoDetect?: () => Promise<boolean>;
}

interface OnboardingChecklistProps {
  role: string;
  schoolId: string;
  tenantSlug: string;
  userEmail: string;
}

const STORAGE_KEY = (email: string) => `onboarding_v1_${email}`;
const DISMISSED_KEY = (email: string) => `onboarding_dismissed_${email}`;

function getSteps(role: string, schoolId: string): Step[] {
  const gestor: Step[] = [
    {
      id: 'print_header',
      label: 'Configure logo e rodapé de impressão',
      desc: 'Defina o visual dos documentos (ATAs, fichas) da sua escola.',
      path: '/configuracoes?tab=print',
    },
    {
      id: 'drive',
      label: 'Conecte o Google Drive',
      desc: 'Armazene documentos disciplinares na nuvem automaticamente.',
      path: '/configuracoes?tab=status',
    },
    {
      id: 'users',
      label: 'Cadastre a equipe da escola',
      desc: 'Adicione gestores, coordenadores, professores e monitores.',
      path: '/configuracoes?tab=users',
    },
    {
      id: 'students',
      label: 'Importe ou cadastre alunos',
      desc: 'Cadastre os alunos para vincular ocorrências e elogios.',
      path: '/alunos',
      autoDetect: async () => {
        if (!supabase) return false;
        const { count } = await supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('archived', false);
        return (count ?? 0) > 0;
      },
    },
    {
      id: 'occurrence',
      label: 'Registre sua primeira ocorrência',
      desc: 'Teste o fluxo completo de registro disciplinar.',
      path: '/registro-disciplinar',
      autoDetect: async () => {
        if (!supabase) return false;
        const { count } = await supabase
          .from('occurrences')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId);
        return (count ?? 0) > 0;
      },
    },
  ];

  const coord: Step[] = [
    {
      id: 'registro',
      label: 'Explore o Registro Disciplinar',
      desc: 'Visualize e gerencie ocorrências da escola.',
      path: '/registro-disciplinar',
    },
    {
      id: 'medidas',
      label: 'Conheça as Medidas Disciplinares',
      desc: 'Veja o regimento e as medidas aplicáveis.',
      path: '/faltas',
    },
    {
      id: 'meg',
      label: 'Acesse o módulo Pedagógico (MEG)',
      desc: 'Acompanhe evidências e eixos de qualidade.',
      path: '/pedagogico',
    },
    {
      id: 'relatorios',
      label: 'Visualize os Relatórios',
      desc: 'Analise dados consolidados da escola.',
      path: '/relatorios',
    },
  ];

  const professor: Step[] = [
    {
      id: 'registro',
      label: 'Explore o Registro Disciplinar',
      desc: 'Veja as ocorrências vinculadas à sua conta.',
      path: '/registro-disciplinar',
    },
    {
      id: 'alunos',
      label: 'Veja a lista de alunos',
      desc: 'Acesse perfis e histórico de cada aluno.',
      path: '/alunos',
    },
    {
      id: 'occurrence',
      label: 'Registre sua primeira ocorrência',
      desc: 'Abra um registro e teste o fluxo de impressão.',
      path: '/registro-disciplinar',
    },
  ];

  const monitor: Step[] = [
    {
      id: 'registro',
      label: 'Explore o Registro Disciplinar',
      desc: 'Visualize as ocorrências ativas da escola.',
      path: '/registro-disciplinar',
    },
    {
      id: 'occurrence',
      label: 'Registre sua primeira ocorrência',
      desc: 'Abra o formulário e registre uma infração.',
      path: '/registro-disciplinar',
    },
  ];

  if (role === 'GESTOR') return gestor;
  if (role === 'COORD') return coord;
  if (role === 'PROFESSOR') return professor;
  if (role === 'MONITOR') return monitor;
  return gestor;
}

export default function OnboardingChecklist({ role, schoolId, tenantSlug, userEmail }: OnboardingChecklistProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [visible, setVisible] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const steps = getSteps(role, schoolId);

  const load = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISSED_KEY(userEmail))) return;

    const stored = localStorage.getItem(STORAGE_KEY(userEmail));
    const base: Record<string, boolean> = stored ? JSON.parse(stored) : {};

    // Auto-detect onde possível
    const detected = { ...base };
    await Promise.all(
      steps
        .filter(s => s.autoDetect && !base[s.id])
        .map(async s => {
          try {
            const done = await s.autoDetect!();
            if (done) detected[s.id] = true;
          } catch { /* silencioso */ }
        })
    );

    setCompleted(detected);

    const allDone = steps.every(s => detected[s.id]);
    if (!allDone) setVisible(true);
  }, [userEmail, schoolId, role]);

  useEffect(() => {
    if (userEmail && role && role !== 'admin_global') {
      load();
    }
  }, [userEmail, role, load]);

  const toggle = (id: string) => {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    localStorage.setItem(STORAGE_KEY(userEmail), JSON.stringify(next));

    if (steps.every(s => next[s.id])) {
      setTimeout(() => setVisible(false), 1200);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY(userEmail), '1');
    setVisible(false);
  };

  const doneCount = steps.filter(s => completed[s.id]).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl print:hidden overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none bg-gradient-to-r from-blue-600 to-indigo-600"
        onClick={() => setExpanded(v => !v)}
      >
        <Rocket className="w-4 h-4 text-white shrink-0" />
        <span className="text-xs font-bold text-white flex-1">Primeiros Passos</span>
        <span className="text-[10px] font-bold text-blue-100 mr-1">{doneCount}/{steps.length}</span>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-white" /> : <ChevronUp className="w-3.5 h-3.5 text-white" />}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          className="text-white/70 hover:text-white transition ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {expanded && (
        <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
          {steps.map(step => {
            const done = !!completed[step.id];
            return (
              <div
                key={step.id}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl transition cursor-pointer group ${
                  done
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => toggle(step.id)}
              >
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  : <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold leading-snug ${done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{step.desc}</p>
                  )}
                </div>
                {!done && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/${tenantSlug}${step.path}`);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition shrink-0 mt-0.5"
                    title="Ir para esta etapa"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          {doneCount === steps.length && (
            <p className="text-center text-xs font-bold text-emerald-600 py-2">
              ✓ Configuração concluída!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
