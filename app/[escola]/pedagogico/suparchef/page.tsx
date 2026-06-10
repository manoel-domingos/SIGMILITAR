'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { getDbSchoolId } from '@/lib/useTenantConfig';
import { supabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import { toast } from 'sonner';
import {
  ChefHat, Plus, Trash2, Play, Loader2, CheckCircle,
  XCircle, Clock, Link as LinkIcon, MousePointerClick, User, Lock,
} from 'lucide-react';

interface Account {
  email: string;
  password: string;
}

interface SuparchefJob {
  id: string;
  label: string;
  target_url: string;
  vote_selector: string;
  accounts: Account[];
  status: 'idle' | 'running' | 'done' | 'failed';
  results: { email: string; success: boolean; message: string }[] | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

const EMPTY_JOB = {
  label: '',
  target_url: '',
  vote_selector: '',
  accounts: [{ email: '', password: '' }] as Account[],
};

export default function SuparchefPage() {
  const params = useParams();
  const schoolSlug = params.escola as string;
  const { isAuthRestored } = useAppContext();
  const schoolId = getDbSchoolId(schoolSlug);

  const [jobs, setJobs] = useState<SuparchefJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [submitting, setSubmitting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthRestored) return;
    fetchJobs();
  }, [isAuthRestored]);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from('suparchef_jobs')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data as SuparchefJob[]);
    setLoading(false);
  }

  function updateAccount(index: number, field: keyof Account, value: string) {
    setForm(f => {
      const accounts = [...f.accounts];
      accounts[index] = { ...accounts[index], [field]: value };
      return { ...f, accounts };
    });
  }

  function addAccount() {
    setForm(f => ({ ...f, accounts: [...f.accounts, { email: '', password: '' }] }));
  }

  function removeAccount(index: number) {
    setForm(f => ({ ...f, accounts: f.accounts.filter((_, i) => i !== index) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label || !form.target_url || !form.vote_selector) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (form.accounts.some(a => !a.email || !a.password)) {
      toast.error('Preencha e-mail e senha de todas as contas');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('suparchef_jobs').insert({
      school_id: schoolId,
      label: form.label,
      target_url: form.target_url,
      vote_selector: form.vote_selector,
      accounts: form.accounts,
      status: 'idle',
    });
    setSubmitting(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success('Automação criada!');
    setShowForm(false);
    setForm(EMPTY_JOB);
    fetchJobs();
  }

  async function handleRun(job: SuparchefJob) {
    setRunningId(job.id);
    toast.info('Iniciando automação…');
    try {
      const res = await fetch('/api/pedagogico/suparchef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
      toast.success('Automação concluída!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro';
      toast.error(msg);
    }
    setRunningId(null);
    fetchJobs();
  }

  async function handleDelete(id: string) {
    await supabase.from('suparchef_jobs').delete().eq('id', id);
    setJobs(j => j.filter(x => x.id !== id));
    toast.success('Removido');
  }

  function StatusBadge({ status }: { status: SuparchefJob['status'] }) {
    const map = {
      idle: { icon: <Clock className="w-3 h-3" />, label: 'Aguardando', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
      running: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Executando', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      done: { icon: <CheckCircle className="w-3 h-3" />, label: 'Concluído', cls: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      failed: { icon: <XCircle className="w-3 h-3" />, label: 'Falhou', cls: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    };
    const { icon, label, cls } = map[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {icon}{label}
      </span>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-7 h-7 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suparchef</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automação de votação via browser</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Automação
          </button>
        </div>

        {/* Aviso de ambiente */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
          <ChefHat className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-medium">Requisito de ambiente</p>
            <p>A automação usa Playwright (browser real). Funciona no servidor local (<code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">npm run dev</code>) ou em VPS com Chromium instalado. No Vercel (produção) rode via script:</p>
            <code className="block mt-1 bg-amber-100 dark:bg-amber-800 px-2 py-1 rounded font-mono">
              node scripts/suparchef-bot.js --job &lt;id&gt;
            </code>
          </div>
        </div>

        {/* Formulário de criação */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Nova automação</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Nome / rótulo</label>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Ex: Votação Suparchef Maio"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> URL do site
                </label>
                <input
                  value={form.target_url}
                  onChange={e => setForm(f => ({ ...f, target_url: e.target.value }))}
                  placeholder="https://site.com/votacao"
                  type="url"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" /> Seletor do botão de voto
              </label>
              <input
                value={form.vote_selector}
                onChange={e => setForm(f => ({ ...f, vote_selector: e.target.value }))}
                placeholder='Ex: button[data-candidato="joao-batista"], .btn-votar, #votar-candidato-3'
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-gray-400">CSS selector do elemento a clicar após o login. Use o DevTools (F12 → Inspecionar elemento) para copiar o seletor.</p>
            </div>

            {/* Contas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <User className="w-3 h-3" /> Contas Google
                </label>
                <button type="button" onClick={addAccount} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar conta
                </button>
              </div>

              {form.accounts.map((acc, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1 flex gap-2">
                    <input
                      value={acc.email}
                      onChange={e => updateAccount(i, 'email', e.target.value)}
                      placeholder="email@gmail.com"
                      type="email"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <div className="relative flex-1">
                      <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                      <input
                        value={acc.password}
                        onChange={e => updateAccount(i, 'password', e.target.value)}
                        placeholder="Senha"
                        type="password"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                  {form.accounts.length > 1 && (
                    <button type="button" onClick={() => removeAccount(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_JOB); }}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de jobs */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma automação cadastrada</p>
            <p className="text-sm mt-1">Clique em &quot;Nova Automação&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{job.label}</h3>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-gray-400 truncate">{job.target_url}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">Seletor: {job.vote_selector}</p>
                    <p className="text-xs text-gray-400">{job.accounts.length} conta{job.accounts.length !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRun(job)}
                      disabled={runningId !== null || job.status === 'running'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      {runningId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Executar
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Resultados */}
                {job.results && job.results.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Resultado por conta:</p>
                    {job.results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {r.success
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        }
                        <span className="text-gray-600 dark:text-gray-300 font-mono">{r.email}</span>
                        <span className="text-gray-400">—</span>
                        <span className={r.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{r.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {job.error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-xs text-red-700 dark:text-red-300 font-mono">
                    {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
