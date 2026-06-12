'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { getDbSchoolId } from '@/lib/useTenantConfig';
import { supabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import { toast } from 'sonner';
import {
  ChefHat, Plus, Trash2, Play, Loader2, CheckCircle,
  XCircle, Clock, Link as LinkIcon, MousePointerClick, User,
  Eye, EyeOff, Terminal, Wifi, WifiOff, ChevronDown, ChevronUp,
  Zap, Info,
} from 'lucide-react';

interface Account {
  email: string;
  password: string;
}

interface LogEntry {
  ts: string;
  email: string;
  step: string;
  ok: boolean;
}

interface SuparchefJob {
  id: string;
  label: string;
  target_url: string;
  vote_selector: string;
  accounts: Account[];
  status: 'idle' | 'running' | 'done' | 'failed';
  results: { email: string; success: boolean; message: string }[] | null;
  logs: LogEntry[] | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string | null;
}

const EMPTY_JOB = {
  label: '',
  target_url: '',
  vote_selector: '',
  accounts: [{ email: '', password: '' }] as Account[],
};

// Preset para Superchef SEDUC MT
const SUPERCHEF_PRESET = {
  label: 'Votação Superchef SEDUC MT',
  target_url: 'http://superchef.seduc.mt.gov.br/login/',
  vote_selector: 'button:has(svg.lucide-heart), button:has-text("Votar")',
  accounts: [{ email: '', password: '' }] as Account[],
};

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ts; }
}

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
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [vpsOnline, setVpsOnline] = useState<boolean | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Verifica heartbeat da VPS
  useEffect(() => {
    async function checkVps() {
      try {
        const { data } = await supabase
          .from('suparchef_config')
          .select('value, updated_at')
          .eq('key', 'daemon_heartbeat')
          .maybeSingle();
        if (data?.updated_at) {
          const diff = Date.now() - new Date(data.updated_at).getTime();
          setVpsOnline(diff < 90_000); // online se heartbeat < 90s
        } else {
          setVpsOnline(false);
        }
      } catch {
        setVpsOnline(false);
      }
    }
    checkVps();
    const id = setInterval(checkVps, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAuthRestored) return;
    fetchJobs();
  }, [isAuthRestored]);

  // Polling de logs para jobs em execução
  const pollRunningJobs = useCallback(async () => {
    const runningJobs = jobs.filter(j => j.status === 'running');
    if (runningJobs.length === 0) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }
    const ids = runningJobs.map(j => j.id);
    const { data } = await supabase
      .from('suparchef_jobs')
      .select('id, status, logs, results, error, finished_at, updated_at')
      .in('id', ids);
    if (data) {
      setJobs(prev => prev.map(j => {
        const updated = data.find((d: { id: string }) => d.id === j.id);
        if (!updated) return j;
        return { ...j, ...updated };
      }));
    }
  }, [jobs]);

  useEffect(() => {
    const hasRunning = jobs.some(j => j.status === 'running');
    if (hasRunning && !pollingRef.current) {
      pollingRef.current = setInterval(pollRunningJobs, 2000);
    } else if (!hasRunning && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobs, pollRunningJobs]);

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

  function togglePassword(index: number) {
    setShowPasswords(p => ({ ...p, [index]: !p[index] }));
  }

  function applyPreset() {
    setForm({ ...SUPERCHEF_PRESET, accounts: [{ email: '', password: '' }] });
    toast.success('Preset Superchef SEDUC MT aplicado!');
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
    // Expandir logs automaticamente ao executar
    setExpandedLogs(p => ({ ...p, [job.id]: true }));
    toast.info('Disparando automação…');
    try {
      const res = await fetch('/api/pedagogico/suparchef/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (res.status === 501) {
        toast.info('PAT não configurado. Tentando execução local…');
        const res2 = await fetch('/api/pedagogico/suparchef', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id }),
        });
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error || 'Erro desconhecido');
        toast.success('Automação concluída!');
      } else if (!res.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      } else {
        toast.success(vpsOnline
          ? 'Job enfileirado! A VPS vai executar em instantes.'
          : 'Job agendado. Aguardando execução no GitHub Actions ou VPS.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro';
      toast.error(msg);
    }
    setRunningId(null);
    // Atualiza jobs após 1.5s (dá tempo do status mudar)
    setTimeout(fetchJobs, 1500);
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
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ChefHat className="w-7 h-7 text-orange-500" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Suparchef</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Automação de votação via browser</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge VPS */}
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              vpsOnline === true
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : vpsOnline === false
                ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {vpsOnline === true
                ? <><Wifi className="w-3 h-3" /> VPS Ativa</>
                : <><WifiOff className="w-3 h-3" /> VPS Offline</>
              }
            </span>

            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Automação
            </button>
          </div>
        </div>

        {/* Aviso de ambiente */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5">
            <p className="font-medium">Requer Playwright instalado</p>
            <p>Funciona no servidor VPS com Chromium. Sem VPS ativa, use: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded font-mono">node scripts/suparchef-daemon.js</code></p>
          </div>
        </div>

        {/* Formulário de criação */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Nova automação</h2>
              {/* Preset button */}
              <button
                type="button"
                onClick={applyPreset}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Zap className="w-3 h-3" />
                Usar preset Superchef SEDUC
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Nome / rótulo *</label>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Ex: Votação Suparchef Junho"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> URL do site *
                </label>
                <input
                  value={form.target_url}
                  onChange={e => setForm(f => ({ ...f, target_url: e.target.value }))}
                  placeholder="https://superchef.seduc.mt.gov.br/login/"
                  type="url"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" /> Seletor do botão de voto *
                </label>
                <button
                  type="button"
                  onClick={() => setShowSelector(v => !v)}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Info className="w-3 h-3" /> Como encontrar?
                </button>
              </div>
              <input
                value={form.vote_selector}
                onChange={e => setForm(f => ({ ...f, vote_selector: e.target.value }))}
                placeholder='button:has(svg.lucide-heart) ou button:has-text("Votar")'
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {showSelector && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-medium">Como copiar o seletor CSS:</p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1">
                    <li>Abra o site no Chrome e aperte <kbd className="bg-blue-100 dark:bg-blue-800 px-1 rounded">F12</kbd></li>
                    <li>Clique no ícone de cursor (Inspecionar)</li>
                    <li>Clique no botão de votar na página</li>
                    <li>No HTML destacado: botão direito → <strong>Copiar → Copiar seletor</strong></li>
                  </ol>
                  <p className="text-blue-600 dark:text-blue-300 font-mono mt-1">
                    Superchef SEDUC: <code>button:has(svg.lucide-heart)</code>
                  </p>
                </div>
              )}
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
                  <div className="flex-1 flex gap-2 flex-wrap sm:flex-nowrap">
                    <input
                      value={acc.email}
                      onChange={e => updateAccount(i, 'email', e.target.value)}
                      placeholder="email@gmail.com ou @edu.mt.gov.br"
                      type="email"
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <div className="relative flex-1 min-w-0">
                      <input
                        value={acc.password}
                        onChange={e => updateAccount(i, 'password', e.target.value)}
                        placeholder="Senha"
                        type={showPasswords[i] ? 'text' : 'password'}
                        className="w-full pr-9 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <button
                        type="button"
                        onClick={() => togglePassword(i)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title={showPasswords[i] ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPasswords[i] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {form.accounts.length > 1 && (
                    <button type="button" onClick={() => removeAccount(i)} className="text-red-400 hover:text-red-600 min-w-[44px] flex justify-center">
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
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 text-white rounded-xl text-sm font-medium transition-all shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_JOB); }}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
            {jobs.map(job => {
              const isExpanded = expandedLogs[job.id];
              const logs: LogEntry[] = Array.isArray(job.logs) ? job.logs : [];

              return (
                <div key={job.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
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
                        className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 active:scale-95 text-white rounded-xl text-xs font-medium transition-all min-h-[44px]"
                      >
                        {runningId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Executar
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-2.5 text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Remover automação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Resultados por conta */}
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

                  {/* Erro global */}
                  {job.error && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-xs text-red-700 dark:text-red-300 font-mono">
                      {job.error}
                    </div>
                  )}

                  {/* Painel de Logs em Tempo Real */}
                  {(logs.length > 0 || job.status === 'running') && (
                    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                      <button
                        onClick={() => setExpandedLogs(p => ({ ...p, [job.id]: !p[job.id] }))}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2"
                      >
                        <Terminal className="w-3.5 h-3.5 text-orange-400" />
                        Logs de execução ({logs.length} eventos)
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {job.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-orange-400 ml-1" />}
                      </button>

                      {isExpanded && (
                        <div className="bg-gray-950 dark:bg-black rounded-xl p-3 overflow-y-auto max-h-48 space-y-0.5 font-mono text-xs">
                          {logs.length === 0 ? (
                            <p className="text-gray-500 italic">Aguardando início…</p>
                          ) : logs.map((entry, i) => (
                            <div key={i} className="flex items-start gap-2">
                              {entry.ok
                                ? <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                                : <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                              }
                              <span className="text-gray-500 shrink-0">{formatTs(entry.ts)}</span>
                              <span className="text-blue-300 shrink-0 truncate max-w-[120px]">{entry.email}</span>
                              <span className={entry.ok ? 'text-gray-300' : 'text-red-300'}>{entry.step}</span>
                            </div>
                          ))}
                          {job.status === 'running' && (
                            <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
                              <span>▶</span>
                              <span>Executando…</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
