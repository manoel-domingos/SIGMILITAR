'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldAlert, ShieldCheck, Edit2, Check, X, ArrowLeft,
  RefreshCw, Building2, UserPlus, Search, Trash2,
  Eye, EyeOff, Users, ChevronRight, Lock, Brain,
  Zap, Activity, Server, Database, Wifi, WifiOff,
  BarChart2, Cpu, MessageSquare, User, KeyRound,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

let _supabase: any = null;
function supabase(): any {
  return (_supabase ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
}

type AppRole = 'GESTOR' | 'COORD' | 'MONITOR' | 'admin_global';
type Tab = 'users' | 'schools' | 'profile' | 'aria' | 'status';

interface UserRow {
  id: string; name: string; email: string;
  role: AppRole; school_id: string; created_at: string;
}
interface School { id: string; name: string; }

const ROLE_LABELS: Record<AppRole, string> = {
  admin_global: 'Admin Global', GESTOR: 'Gestor', COORD: 'Coordenador', MONITOR: 'Monitor',
};
const ROLE_COLORS: Record<AppRole, string> = {
  admin_global: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  GESTOR:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COORD:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  MONITOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};
const AVATAR_COLORS = ['bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-indigo-500','bg-teal-500','bg-orange-500','bg-cyan-500'];
function getAvatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ name }: { name: string }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full ${getAvatarColor(name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  );
}

const INPUT = 'w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400';
const SELECT = INPUT + ' appearance-none cursor-pointer';

// ─── Drawer: criar usuário ───────────────────────────────────────────────────
function CreateUserDrawer({ open, onClose, schools, onCreated }: {
  open: boolean; onClose: () => void; schools: School[]; onCreated: (u: UserRow) => void;
}) {
  const firstSchool = schools[0]?.id ?? '';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'GESTOR' as AppRole, school_id: firstSchool });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza default quando schools carrega
  useEffect(() => {
    if (firstSchool && !form.school_id) setForm(v => ({ ...v, school_id: firstSchool }));
  }, [firstSchool]);

  const reset = () => { setForm({ name: '', email: '', password: '', role: 'GESTOR', school_id: firstSchool }); setError(null); setShowPass(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Nome e e-mail/usuário são obrigatórios.'); return; }
    setSaving(true); setError(null);
    const { data, error: err } = await supabase().from('user_profiles')
      .insert([{ name: form.name.trim(), email: form.email.trim(), password: form.password || null, role: form.role, school_id: form.school_id }])
      .select().single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    if (data) onCreated(data as UserRow);
    handleClose();
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={handleClose} />
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Novo Usuario</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Preencha os dados para criar a conta.</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
        </div>
        <form id="create-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/40"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nome completo <span className="text-rose-500">*</span></label>
            <input className={INPUT} placeholder="Ex: Maria Silva" value={form.name} onChange={set('name')} autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">E-mail ou usuario <span className="text-rose-500">*</span></label>
            <input className={INPUT} placeholder="Ex: maria.silva" value={form.email} onChange={set('email')} />
            <p className="text-[11px] text-slate-400">Usado para login. Pode ser e-mail ou nome simples.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Senha</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className={INPUT + ' pr-10'} placeholder="Deixe em branco para padrao do sistema" value={form.password} onChange={set('password')} />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Papel / Permissao</label>
            <select className={SELECT} value={form.role} onChange={set('role')}>
              <option value="admin_global">Admin Global</option>
              <option value="GESTOR">Gestor</option>
              <option value="COORD">Coordenador</option>
              <option value="MONITOR">Monitor</option>
            </select>
            <p className="text-[11px] text-slate-400">
              {form.role === 'admin_global' && 'Acesso total a todas as escolas e configuracoes.'}
              {form.role === 'GESTOR' && 'Acesso total a escola vinculada.'}
              {form.role === 'COORD' && 'Acesso de coordenacao sem configuracoes.'}
              {form.role === 'MONITOR' && 'Apenas leitura e registro de ocorrencias.'}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Escola</label>
            <select className={SELECT} value={form.school_id} onChange={set('school_id')}>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
            </select>
          </div>
        </form>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button form="create-user-form" type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {saving ? 'Salvando...' : 'Criar Usuario'}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Tab: Meu Perfil ─────────────────────────────────────────────────────────
function TabProfile({ user }: { user: ReturnType<typeof useAppContext>['user'] }) {
  const { currentUserRole } = useAppContext();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{t:'ok'|'err'; m: string}|null>(null);

  const saveProfile = async () => {
    if (!user?.email) return;
    await supabase().from('user_profiles').update({ name }).eq('email', user.email);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const changePwd = async () => {
    if (pwd.next !== pwd.confirm) { setPwdMsg({t:'err', m:'As senhas não coincidem.'}); return; }
    if (pwd.next.length < 4) { setPwdMsg({t:'err', m:'Senha deve ter ao menos 4 caracteres.'}); return; }
    if (!user?.email) return;
    const { error } = await supabase().from('user_profiles').update({ password: pwd.next }).eq('email', user.email);
    if (error) { setPwdMsg({t:'err', m: error.message}); return; }
    setPwd({ current: '', next: '', confirm: '' });
    setPwdMsg({t:'ok', m:'Senha alterada com sucesso.'});
    setTimeout(() => setPwdMsg(null), 3000);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Dados pessoais */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Dados Pessoais</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Informacoes exibidas nos registros.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nome</label>
          <input className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Login / E-mail</label>
          <input className={INPUT + ' opacity-60 cursor-not-allowed'} value={user?.email || ''} readOnly />
          <p className="text-[11px] text-slate-400">Login nao pode ser alterado aqui.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Papel</label>
          <div className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${ROLE_COLORS[currentUserRole as AppRole] ?? 'bg-slate-100 text-slate-600'}`}>
            {ROLE_LABELS[currentUserRole as AppRole] ?? currentUserRole}
          </div>
        </div>
        <button onClick={saveProfile} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
          {saved ? <><Check className="w-4 h-4" /> Salvo!</> : 'Salvar alteracoes'}
        </button>
      </div>

      {/* Alterar senha */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Alterar Senha</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Defina uma nova senha de acesso.</p>
          </div>
        </div>
        {pwdMsg && (
          <div className={`text-sm px-3 py-2.5 rounded-xl flex items-center gap-2 ${pwdMsg.t === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'}`}>
            {pwdMsg.t === 'ok' ? <Check className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />} {pwdMsg.m}
          </div>
        )}
        {(['current','next','confirm'] as const).map((k, i) => (
          <div key={k} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {k === 'current' ? 'Senha atual' : k === 'next' ? 'Nova senha' : 'Confirmar nova senha'}
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className={INPUT + ' pr-10'}
                value={pwd[k]}
                onChange={e => setPwd(v => ({ ...v, [k]: e.target.value }))}
                placeholder={k === 'current' ? 'Senha atual' : k === 'next' ? 'Minimo 4 caracteres' : 'Repita a nova senha'}
              />
              {i === 0 && <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
            </div>
          </div>
        ))}
        <button onClick={changePwd} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition">Alterar Senha</button>
      </div>
    </div>
  );
}

// ─── Tab: Status das Integrações ─────────────────────────────────────────────
function TabStatus() {
  const [ping, setPing] = useState<'idle'|'ok'|'err'>('idle');
  const [pingMs, setPingMs] = useState<number|null>(null);

  const testSupabase = async () => {
    setPing('idle'); setPingMs(null);
    const t0 = Date.now();
    try {
      const { error } = await supabase().from('schools').select('id').limit(1);
      if (error) throw error;
      setPingMs(Date.now() - t0); setPing('ok');
    } catch { setPing('err'); }
  };

  const integrations = [
    { name: 'Supabase (banco de dados)', icon: Database, status: 'online', desc: 'PostgreSQL via API REST' },
    { name: 'Vercel (hospedagem)',        icon: Server,   status: 'online', desc: 'Next.js App Router' },
    { name: 'ARIA (IA assistente)',       icon: Brain,    status: 'online', desc: 'Vercel AI Gateway' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        {integrations.map(i => (
          <div key={i.name} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                <i.icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{i.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{i.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Teste de conexão */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Teste de Latencia</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Verifica a conexao com o banco de dados.</p>
            </div>
          </div>
          <button onClick={testSupabase} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 rounded-xl text-sm font-semibold transition">
            <Wifi className="w-4 h-4" /> Testar conexao
          </button>
        </div>
        {ping !== 'idle' && (
          <div className={`mt-4 flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl ${ping === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'}`}>
            {ping === 'ok' ? <><Check className="w-4 h-4" /> Supabase respondeu em {pingMs}ms</> : <><WifiOff className="w-4 h-4" /> Falha na conexao com o Supabase</>}
          </div>
        )}
      </div>

      {/* Variaveis de ambiente */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Variaveis de Ambiente</p>
        {[
          { k: 'NEXT_PUBLIC_SUPABASE_URL',      v: process.env.NEXT_PUBLIC_SUPABASE_URL },
          { k: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', v: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        ].map(({ k, v }) => (
          <div key={k} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${v ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 flex-1">{k}</span>
            <span className={`text-xs font-semibold ${v ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>{v ? 'Configurada' : 'Ausente'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Assistente ARIA ────────────────────────────────────────────────────
function TabAria() {
  const stats = [
    { label: 'Modelo ativo',       value: 'GPT-4o / Claude 3.5', icon: Brain,        color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Gateway',            value: 'Vercel AI Gateway',    icon: Zap,          color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Conversas (sessao)', value: '—',                    icon: MessageSquare, color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Latencia media',     value: '~1.2s',                icon: Activity,     color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Tokens (estimado)',  value: '—',                    icon: BarChart2,    color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: 'CPU / Memoria',      value: 'Serverless',           icon: Cpu,          color: 'text-slate-500',  bg: 'bg-slate-50 dark:bg-slate-700' },
  ];

  const capabilities = [
    { t: 'Analise de Ocorrencias',  d: 'Interpreta padrao de comportamento de alunos e sugere intervencoes.', on: true },
    { t: 'Relatorio Automatico',    d: 'Gera sumarios e relatorios disciplinares com linguagem formal.', on: true },
    { t: 'Busca Semantica',         d: 'Localiza registros por contexto, nao apenas por palavra-chave.', on: true },
    { t: 'Alertas Preditivos',      d: 'Identifica alunos com risco elevado de reincidencia.', on: false },
    { t: 'Integracao com SIGE',     d: 'Sincroniza dados com o sistema estadual de gestao escolar.', on: false },
  ];

  return (
    <div className="space-y-6">
      {/* Cards de status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Descricao */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex gap-4">
        <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center shrink-0">
          <Brain className="w-6 h-6 text-violet-500" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Sobre a ARIA</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            A ARIA (Assistente de Registros e Informacoes Academicas) e o modulo de inteligencia artificial do sistema.
            Ela utiliza o Vercel AI Gateway para rotear entre modelos de linguagem (OpenAI e Anthropic) com base
            na complexidade da tarefa, garantindo custo-beneficio e velocidade otimizados.
          </p>
        </div>
      </div>

      {/* Capacidades */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Capacidades do Sistema</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {capabilities.map(c => (
            <div key={c.t} className="flex items-center gap-4 px-6 py-4">
              <div className={`w-9 h-5 rounded-full relative transition ${c.on ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${c.on ? 'left-4' : 'left-0.5'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.t}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.d}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.on ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                {c.on ? 'Ativo' : 'Em breve'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  return (
    <Suspense>
      <ConfiguracoesInner />
    </Suspense>
  );
}

function ConfiguracoesInner() {
  const { currentUserRole, user } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers]       = useState<UserRow[]>([]);
  const [schools, setSchools]   = useState<School[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ role: AppRole; school_id: string }>({ role: 'COORD', school_id: '' });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams?.get('tab') as Tab | null;
    return (t && ['users','schools','profile','aria','status'].includes(t)) ? t : 'users';
  });

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: ud }, { data: sd }] = await Promise.all([
      supabase().from('user_profiles').select('*').order('name'),
      supabase().from('schools').select('id, name').order('id'),
    ]);
    if (ud) setUsers(ud as UserRow[]);
    if (sd) setSchools(sd as School[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sincroniza aba com query param
  useEffect(() => {
    const t = searchParams?.get('tab') as Tab | null;
    if (t && ['users','schools','profile','aria','status'].includes(t)) setActiveTab(t);
  }, [searchParams]);

  const startEdit = (u: UserRow) => { setEditingId(u.id); setEditValues({ role: u.role, school_id: u.school_id }); };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase().from('user_profiles')
      .update({ role: editValues.role, school_id: editValues.school_id, updated_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(false);
    if (error) { showToast('Erro: ' + error.message, 'err'); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...editValues } : u));
    setEditingId(null); showToast('Usuario atualizado.');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase().from('user_profiles').delete().eq('id', id);
    if (error) { showToast('Erro ao remover: ' + error.message, 'err'); return; }
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteId(null); showToast('Usuario removido.');
  };

  const handleCreated = (u: UserRow) => {
    setUsers(prev => [...prev, u].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    showToast('Usuario criado com sucesso.');
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.school_id.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUserRole !== 'admin_global' && currentUserRole !== 'GESTOR') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <div><h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Acesso Negado</h2><p className="mt-1 text-sm">Esta area e restrita ao Admin Global.</p></div>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'users',   label: 'Usuarios',        icon: Users },
    { id: 'schools', label: 'Escolas',          icon: Building2 },
    { id: 'profile', label: 'Meu Perfil',       icon: User },
    { id: 'aria',    label: 'Assistente ARIA',  icon: Brain },
    { id: 'status',  label: 'Integracoes',      icon: Activity },
  ];

  return (
    <>
      <CreateUserDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} schools={schools} onCreated={handleCreated} />

      {/* Modal de exclusao */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <div><h3 className="font-bold text-slate-800 dark:text-slate-100">Remover usuario?</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Esta acao nao pode ser desfeita.</p></div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition">Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 ${toast.type === 'err' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.type === 'ok' ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4" />} {toast.msg}
        </div>
      )}

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500" /> Configuracao do Sistema
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Usuarios, escolas, perfil e integracoes.</p>
            </div>
          </div>
          {activeTab === 'users' && (
            <div className="flex items-center gap-2">
              <button onClick={fetchData} disabled={loading} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 transition shadow-sm" title="Atualizar">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition">
                <UserPlus className="w-4 h-4" /> Novo Usuario
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'users' && <span className="ml-0.5 text-xs text-slate-400 dark:text-slate-500 font-normal">({users.length})</span>}
            </button>
          ))}
        </div>

        {/* ── TAB: Usuarios ── */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    {['Usuario','Papel','Escola','Acoes'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide ${i === 3 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {loading ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400"><RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Carregando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">{search ? 'Nenhum resultado.' : 'Nenhum usuario cadastrado.'}</td></tr>
                  ) : filtered.map(u => (
                    <tr key={u.id} className={`group transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${editingId === u.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name || u.email} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{u.name || '—'}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {editingId === u.id ? (
                          <select value={editValues.role} onChange={e => setEditValues(v => ({ ...v, role: e.target.value as AppRole }))}
                            className="bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {(['admin_global','GESTOR','COORD','MONITOR'] as AppRole[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>{ROLE_LABELS[u.role] ?? u.role}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {editingId === u.id ? (
                          <select value={editValues.school_id} onChange={e => setEditValues(v => ({ ...v, school_id: e.target.value }))}
                            className="bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {schools.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
                          </select>
                        ) : (
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{u.school_id}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {editingId === u.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => saveEdit(u.id)} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"><Check className="w-3.5 h-3.5" /> Salvar</button>
                            <button onClick={cancelEdit} className="p-1.5 border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => startEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition" title="Remover"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-400 dark:text-slate-500">
                {filtered.length} de {users.length} usuario{users.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Escolas ── */}
        {activeTab === 'schools' && (
          <div className="space-y-3">
            {schools.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{s.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{users.filter(u => u.school_id === s.id).length} usuario{users.filter(u => u.school_id === s.id).length !== 1 ? 's' : ''}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: Meu Perfil ── */}
        {activeTab === 'profile' && <TabProfile user={user} />}

        {/* ── TAB: ARIA ── */}
        {activeTab === 'aria' && <TabAria />}

        {/* ── TAB: Status ── */}
        {activeTab === 'status' && <TabStatus />}
      </div>
    </>
  );
}
