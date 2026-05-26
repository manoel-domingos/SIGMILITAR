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
  FileText, CheckSquare, Loader2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AppShell from '@/components/AppShell';

let _supabase: any = null;
function supabase(): any {
  return (_supabase ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
}

type AppRole = 'GESTOR' | 'COORD' | 'MONITOR' | 'PROFESSOR' | 'admin_global';
type Tab = 'users' | 'schools' | 'profile' | 'aria' | 'status' | 'users_prof' | 'occurrences_prof' | 'conduct_prof' | 'reports_prof' | 'permissions';
type Severity = 'Leve' | 'Media' | 'Grave';

interface UserRow {
  id: string; name: string; email: string;
  role: AppRole; school_id: string; created_at: string;
}
interface School { id: string; name: string; }

const ROLE_LABELS: Record<AppRole, string> = {
  admin_global: 'Admin Global', GESTOR: 'Gestor', COORD: 'Coordenador', MONITOR: 'Monitor', PROFESSOR: 'Professor',
};
const ROLE_COLORS: Record<AppRole, string> = {
  admin_global: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  GESTOR:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COORD:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  MONITOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PROFESSOR: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
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
  const { currentUserRole, currentUserSchoolId } = useAppContext();
  const firstSchool = schools[0]?.id ?? '';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'GESTOR' as AppRole, school_id: firstSchool });
  const [creationMethod, setCreationMethod] = useState<'invite' | 'password'>('invite');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza default quando schools carrega ou conforme o papel do usuario
  useEffect(() => {
    if (currentUserRole === 'GESTOR' && currentUserSchoolId) {
      setForm(v => ({ ...v, school_id: currentUserSchoolId }));
    } else if (firstSchool && !form.school_id) {
      setForm(v => ({ ...v, school_id: firstSchool }));
    }
  }, [firstSchool, currentUserRole, currentUserSchoolId]);

  const reset = () => {
    setForm({ name: '', email: '', password: '', role: 'GESTOR', school_id: firstSchool });
    setCreationMethod('invite');
    setError(null);
    setShowPass(false);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Nome e e-mail/usuário são obrigatórios.'); return; }
    
    const pwdToSubmit = creationMethod === 'password' ? form.password : '';
    if (creationMethod === 'password' && pwdToSubmit.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: pwdToSubmit,
          role: form.role,
          school_id: form.school_id,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Erro ao criar usuário.'); return; }
      if (json.user) onCreated(json.user as UserRow);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={handleClose} />
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Novo Usuário</h2>
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
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">E-mail ou usuário <span className="text-rose-500">*</span></label>
            <input className={INPUT} placeholder="Ex: maria.silva" value={form.email} onChange={set('email')} />
            <p className="text-[11px] text-slate-400">Usado para login. Pode ser e-mail ou nome simples.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Método de Cadastro</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/30">
              <button
                type="button"
                onClick={() => { setCreationMethod('invite'); setForm(v => ({ ...v, password: '' })); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${creationMethod === 'invite' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Users className="w-3.5 h-3.5" /> Enviar Convite
              </button>
              <button
                type="button"
                onClick={() => setCreationMethod('password')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${creationMethod === 'password' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <KeyRound className="w-3.5 h-3.5" /> Definir Senha
              </button>
            </div>
          </div>

          {creationMethod === 'invite' ? (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 flex gap-3 text-xs text-blue-700 dark:text-blue-400 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
              <Brain className="w-5 h-5 mt-0.5 shrink-0 text-blue-500" />
              <div>
                <p className="font-semibold mb-0.5">Convite Oficial por E-mail</p>
                <p>O usuário receberá uma notificação em seu e-mail com instruções e um link seguro para cadastrar sua própria senha de acesso.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-500" /> Senha de Acesso <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={INPUT + ' pr-10'}
                  placeholder="Mínimo 4 caracteres"
                  value={form.password}
                  onChange={set('password')}
                  required={creationMethod === 'password'}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Esta senha será usada pelo usuário para seu primeiro acesso direto.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Papel / Permissão</label>
            <select className={SELECT} value={form.role} onChange={set('role')}>
              {currentUserRole === 'admin_global' && <option value="admin_global">Admin Global</option>}
              <option value="GESTOR">Gestor</option>
              <option value="COORD">Coordenador</option>
              <option value="MONITOR">Monitor</option>
              <option value="PROFESSOR">Professor</option>
            </select>
            <p className="text-[11px] text-slate-400">
              {form.role === 'admin_global' && 'Acesso total a todas as escolas e configurações.'}
              {form.role === 'GESTOR' && 'Acesso total à escola vinculada.'}
              {form.role === 'COORD' && 'Acesso de coordenação sem configurações.'}
              {form.role === 'MONITOR' && 'Apenas leitura e registro de ocorrências.'}
              {form.role === 'PROFESSOR' && 'Acesso a alunos e registro de ocorrências.'}
            </p>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Escola</label>
            {currentUserRole === 'admin_global' ? (
              <select className={SELECT} value={form.school_id} onChange={set('school_id')}>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
              </select>
            ) : (
              <input className={INPUT + ' opacity-60 cursor-not-allowed'} value={schools.find(s => s.id === currentUserSchoolId)?.name || currentUserSchoolId || ''} readOnly />
            )}
          </div>
        </form>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button
            form="create-user-form"
            type="submit"
            disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98] ${
              creationMethod === 'invite'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/10'
                : 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-blue-500/10'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : creationMethod === 'invite' ? (
              <Users className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? 'Enviando...' : creationMethod === 'invite' ? 'Enviar Convite' : 'Criar Usuário'}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Drawer: editar usuário ──────────────────────────────────────────────────
function EditUserDrawer({ user, open, onClose, schools, onUpdated }: {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
  schools: School[];
  onUpdated: (updated: UserRow) => void;
}) {
  const { currentUserRole } = useAppContext();
  const [form, setForm] = useState({ name: '', email: '', role: 'GESTOR' as AppRole, school_id: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', role: user.role, school_id: user.school_id });
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setPwdMsg(null);
      setProfileSaved(false);
    }
  }, [user]);

  const handleClose = () => { setError(null); setPwdMsg(null); onClose(); };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return; }
    setSaving(true); setError(null);
    try {
      const { error: dbErr } = await supabase()
        .from('user_profiles')
        .update({ name: form.name.trim(), email: form.email.trim(), role: form.role, school_id: form.school_id, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (dbErr) { setError(dbErr.message); return; }
      onUpdated({ ...user, name: form.name.trim(), email: form.email.trim(), role: form.role, school_id: form.school_id });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!user) return;
    if (newPassword.length < 4) { setPwdMsg({ t: 'err', m: 'Senha deve ter pelo menos 4 caracteres.' }); return; }
    if (newPassword !== confirmPassword) { setPwdMsg({ t: 'err', m: 'As senhas nao coincidem.' }); return; }
    setSavingPwd(true); setPwdMsg(null);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok) { setPwdMsg({ t: 'err', m: json.error || 'Erro ao alterar senha.' }); return; }
      setNewPassword(''); setConfirmPassword('');
      setPwdMsg({ t: 'ok', m: 'Senha alterada com sucesso!' });
      setTimeout(() => setPwdMsg(null), 3000);
    } catch (err: any) {
      setPwdMsg({ t: 'err', m: err.message || 'Erro inesperado.' });
    } finally { setSavingPwd(false); }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={handleClose} />
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {user && <Avatar name={user.name || user.email} />}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Editar Usuario</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5 text-blue-500" /></div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Dados do Perfil</p>
            </div>
            {error && <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/40"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
            <form id="edit-user-form" onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nome completo <span className="text-rose-500">*</span></label>
                <input className={INPUT} placeholder="Nome completo" value={form.name} onChange={set('name')} autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">E-mail / Login</label>
                <input className={INPUT} placeholder="email@escola.com" value={form.email} onChange={set('email')} />
                <p className="text-[11px] text-slate-400">Alterar o e-mail modifica o login de acesso do usuario.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Papel / Permissao</label>
                <select className={SELECT} value={form.role} onChange={set('role')}>
                  {currentUserRole === 'admin_global' && <option value="admin_global">Admin Global</option>}
                  <option value="GESTOR">Gestor</option>
                  <option value="COORD">Coordenador</option>
                  <option value="MONITOR">Monitor</option>
                  <option value="PROFESSOR">Professor</option>
                </select>
              </div>
              {currentUserRole === 'admin_global' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Escola</label>
                  <select className={SELECT} value={form.school_id} onChange={set('school_id')}>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                  </select>
                </div>
              )}
            </form>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center shrink-0"><KeyRound className="w-3.5 h-3.5 text-amber-500" /></div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Redefinir Senha</p>
            </div>
            {pwdMsg && (
              <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${pwdMsg.t === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'}`}>
                {pwdMsg.t === 'ok' ? <Check className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}{pwdMsg.m}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-amber-500" /> Nova Senha</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className={INPUT + ' pr-10'} placeholder="Minimo 4 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Confirmar Nova Senha</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} className={INPUT + ' pr-10'} placeholder="Repita a nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <button type="button" onClick={savePassword} disabled={savingPwd || !newPassword} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
              {savingPwd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {savingPwd ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button form="edit-user-form" type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98]">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Salvando...' : profileSaved ? 'Salvo!' : 'Salvar Perfil'}
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
    
    try {
      // 1. Atualiza a senha no Supabase Auth usando o cliente atual
      const { error: authError } = await supabase().auth.updateUser({ password: pwd.next });
      if (authError) {
        setPwdMsg({ t: 'err', m: 'Erro no Supabase Auth: ' + authError.message });
        return;
      }

      // 2. Sincroniza a tabela user_profiles para compatibilidade histórica
      const { error } = await supabase().from('user_profiles').update({ password: pwd.next }).eq('email', user.email);
      if (error) {
        console.warn('Erro ao salvar cópia no user_profiles:', error.message);
      }

      setPwd({ current: '', next: '', confirm: '' });
      setPwdMsg({ t: 'ok', m: 'Senha alterada com sucesso!' });
      setTimeout(() => setPwdMsg(null), 3000);
    } catch (err: any) {
      setPwdMsg({ t: 'err', m: err.message || 'Erro ao redefinir senha.' });
    }
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
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }>
        <ConfiguracoesInner />
      </Suspense>
    </AppShell>
  );
}


function ConfiguracoesInner() {
  const { currentUserRole, currentUserSchoolId, user } = useAppContext();
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
  const [editDrawerUser, setEditDrawerUser] = useState<UserRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams?.get('tab') as Tab | null;
    const allowed = ['users','schools','profile','aria','status','users_prof','occurrences_prof','conduct_prof','reports_prof','permissions'];
    if (t && allowed.includes(t)) return t;
    return (currentUserRole === 'PROFESSOR' || currentUserRole === 'COORD') ? 'profile' : 'users';
  });

  const [renderedTab, setRenderedTab] = useState<Tab>(activeTab);
  const [animationClass, setAnimationClass] = useState<'animate-roll-in' | 'animate-roll-out' | ''>('');

  useEffect(() => {
    if (activeTab !== renderedTab) {
      setAnimationClass('animate-roll-out');
      const timer = setTimeout(() => {
        setRenderedTab(activeTab);
        setAnimationClass('animate-roll-in');
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimationClass('animate-roll-in');
    }
  }, [activeTab, renderedTab]);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    let uQuery = supabase().from('user_profiles').select('*').order('name');
    let sQuery = supabase().from('schools').select('id, name').order('id');

    const envSchoolId = process.env.NEXT_PUBLIC_SCHOOL_ID ?? null;
    const resolvedSchoolId = envSchoolId ?? currentUserSchoolId;

    if (currentUserRole === 'GESTOR' && resolvedSchoolId) {
      uQuery = uQuery.eq('school_id', resolvedSchoolId);
      sQuery = sQuery.eq('id', resolvedSchoolId);
    }

    const [{ data: ud }, { data: sd }] = await Promise.all([
      uQuery,
      sQuery,
    ]);
    if (ud) setUsers(ud as UserRow[]);
    if (sd) setSchools(sd as School[]);
    setLoading(false);
  }, [currentUserRole, currentUserSchoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sincroniza aba com query param
  useEffect(() => {
    const t = searchParams?.get('tab') as Tab | null;
    const allowed = ['users','schools','profile','aria','status','users_prof','occurrences_prof','conduct_prof','reports_prof','permissions'];
    if (t && allowed.includes(t)) setActiveTab(t);
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

  if (currentUserRole !== 'admin_global' && currentUserRole !== 'GESTOR' && currentUserRole !== 'PROFESSOR' && currentUserRole !== 'COORD') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <div><h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Acesso Negado</h2><p className="mt-1 text-sm">Esta area e restrita ao Admin Global, Gestores, Coordenadores e Professores.</p></div>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  const TABS = (currentUserRole === 'admin_global'
    ? [
        { id: 'users',   label: 'Usuários',        icon: Users },
        { id: 'schools', label: 'Escolas',          icon: Building2 },
        { id: 'profile', label: 'Meu Perfil',       icon: User },
        { id: 'aria',    label: 'Assistente ARIA',  icon: Brain },
        { id: 'status',  label: 'Integrações',      icon: Activity },
        { id: 'permissions', label: 'Permissões',   icon: KeyRound },
      ]
    : currentUserRole === 'PROFESSOR'
    ? [
        { id: 'profile', label: 'Minha Conta',       icon: User },
        { id: 'users_prof', label: 'Alunos',        icon: Users },
        { id: 'occurrences_prof', label: 'Ocorrências', icon: FileText },
        { id: 'conduct_prof', label: 'Faltas Disciplinares', icon: CheckSquare },
        { id: 'reports_prof', label: 'Relatórios', icon: BarChart2 },
      ]
    : [
        { id: 'users',   label: 'Usuários da Escola', icon: Users },
        { id: 'profile', label: 'Meu Perfil',       icon: User },
        { id: 'permissions', label: 'Permissões',   icon: KeyRound },
      ]
  ) as { id: Tab; label: string; icon: React.ElementType }[];

  return (
    <>
      <CreateUserDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} schools={schools} onCreated={handleCreated} />
      <EditUserDrawer
        user={editDrawerUser}
        open={editDrawerUser !== null}
        onClose={() => setEditDrawerUser(null)}
        schools={schools}
        onUpdated={(updated) => {
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          showToast('Usuario atualizado com sucesso.');
          setEditDrawerUser(null);
        }}
      />

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

        <style>{`
          @keyframes rollOutUp {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-100px); opacity: 0; }
          }
          @keyframes rollInUp {
            0% { transform: translateY(100px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .animate-roll-out {
            animation: rollOutUp 300ms ease-in-out forwards;
          }
          .animate-roll-in {
            animation: rollInUp 300ms ease-in-out forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-roll-out, .animate-roll-in {
              animation: none !important;
              transform: none !important;
              opacity: 1 !important;
            }
          }
        `}</style>

        {/* Dynamic Transition Wrapper */}
        <div className="relative overflow-hidden min-h-[500px]">
          <div className={animationClass}>
            {/* ── TAB: Usuarios ── */}
            {renderedTab === 'users' && (
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
                                <p 
                                  onClick={() => setEditDrawerUser(u)}
                                  className="font-semibold text-slate-800 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                >
                                  {u.name || '—'}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {editingId === u.id ? (
                              <select value={editValues.role} onChange={e => setEditValues(v => ({ ...v, role: e.target.value as AppRole }))}
                                className="bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {(['admin_global','GESTOR','COORD','MONITOR','PROFESSOR'] as AppRole[])
                                  .filter(r => r !== 'admin_global' || currentUserRole === 'admin_global')
                                  .map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                              </select>
                            ) : (
                              <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>{ROLE_LABELS[u.role] ?? u.role}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {editingId === u.id ? (
                              currentUserRole === 'admin_global' ? (
                                <select value={editValues.school_id} onChange={e => setEditValues(v => ({ ...v, school_id: e.target.value }))}
                                  className="bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  {schools.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
                                </select>
                              ) : (
                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{editValues.school_id}</span>
                              )
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
                                <button onClick={() => setEditDrawerUser(u)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Editar usuario"><Edit2 className="w-3.5 h-3.5" /></button>
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
            {renderedTab === 'schools' && (
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
            {renderedTab === 'profile' && <TabProfile user={user} />}

            {/* ── TAB: ARIA ── */}
            {renderedTab === 'aria' && <TabAria />}

            {/* ── TAB: Status ── */}
            {renderedTab === 'status' && <TabStatus />}

            {/* ── TAB: Alunos (Professor View) ── */}
            {renderedTab === 'users_prof' && <TabUsersProf />}

            {/* ── TAB: Ocorrências (Professor View) ── */}
            {renderedTab === 'occurrences_prof' && <TabOccurrencesProf />}

            {/* ── TAB: Faltas Disciplinares (Professor View) ── */}
            {renderedTab === 'conduct_prof' && <TabConductProf />}

            {/* ── TAB: Relatórios (Professor View) ── */}
            {renderedTab === 'reports_prof' && <TabReportsProf />}

            {/* ── TAB: Permissões ── */}
            {renderedTab === 'permissions' && <TabPermissions />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── SUB-COMPONENTS: PROFESSOR VIEWS ───────────────────────────────────────── */

type BehaviorClass = 'Excepcional' | 'Ótimo' | 'Bom' | 'Regular' | 'Insuficiente' | 'Incompatível';

function TabUsersProf() {
  const { students, occurrences, user } = useAppContext();
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  // Professor has read-only access to all students in all classes
  const uniqueClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort();
  const [selectedClass, setSelectedClass] = useState(uniqueClasses[0] || '');
  const [search, setSearch] = useState('');

  const filteredStudents = students.filter(s => 
    s.class === selectedClass &&
    !s.archived &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Painel de Alunos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visualização completa de estudantes da escola (Modo Leitura).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Aluno</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Turma</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Comportamento</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">Nenhum estudante ativo cadastrado nesta turma.</td></tr>
              ) : filteredStudents.map(s => {
                const sPoints = s.points ?? 8.0;
                let behavior: BehaviorClass = 'Bom';
                if (sPoints >= 9.5) behavior = 'Excepcional';
                else if (sPoints >= 8.5) behavior = 'Ótimo';
                else if (sPoints >= 7.0) behavior = 'Bom';
                else if (sPoints >= 5.0) behavior = 'Regular';
                else if (sPoints >= 3.0) behavior = 'Insuficiente';
                else behavior = 'Incompatível';

                const behaviorColors: Record<BehaviorClass, string> = {
                  Excepcional: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50',
                  'Ótimo': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50',
                  Bom: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50',
                  Regular: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50',
                  Insuficiente: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50',
                  'Incompatível': 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50',
                };

                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 flex items-center gap-3">
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover shrink-0" onError={e => (e.target as any).style.display = 'none'} />
                      ) : (
                        <Avatar name={s.name} />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{s.id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-medium">{s.class} — {s.shift}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${behaviorColors[behavior]}`}>
                        {behavior}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-extrabold text-blue-600 dark:text-blue-400 text-sm text-right">{sPoints.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabOccurrencesProf() {
  const { occurrences, students, rules, user } = useAppContext();
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const [search, setSearch] = useState('');

  const profOccs = occurrences.filter(o => 
    (o.registeredBy && (o.registeredBy.toLowerCase() === user?.email?.toLowerCase() || o.registeredBy.toLowerCase() === userName.toLowerCase())) ||
    (o.locatedBy && (o.locatedBy.toLowerCase() === user?.email?.toLowerCase() || o.locatedBy.toLowerCase() === userName.toLowerCase()))
  );

  const filteredOccs = profOccs.filter(o => {
    const student = students.find(s => s.id === o.studentId);
    const rule = rules.find(r => r.code === o.ruleCode);
    const text = (student?.name || '') + ' ' + (rule?.description || '') + ' ' + o.location + ' ' + o.registeredBy;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Minhas Ocorrências Registradas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Histórico completo de infrações lavradas ou localizadas por você (Somente Leitura).</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por aluno ou infração..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Aluno / Turma</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Infração / Art.</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gravidade</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Relato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {filteredOccs.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Você ainda não possui ocorrências lavradas sob seu registro.</td></tr>
            ) : filteredOccs.map(o => {
              const student = students.find(s => s.id === o.studentId);
              const rule = rules.find(r => r.code === o.ruleCode);
              const dateStr = o.date ? new Date(o.date).toLocaleDateString('pt-BR') : '---';

              const severityColors: Record<Severity, string> = {
                Leve: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50',
                Media: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50',
                Grave: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50',
              };

              return (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{dateStr} {o.hour || ''}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{student?.name || 'Aluno Desconhecido'}</p>
                    <p className="text-xs text-slate-400 font-mono">{student?.class || 'Turma não informada'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 block font-bold">Artigo {o.ruleCode}</span>
                    <span className="text-xs text-slate-500 max-w-xs block truncate" title={rule?.description}>{rule?.description || '---'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${severityColors[rule?.severity || 'Leve']}`}>
                      {rule?.severity || 'Leve'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={o.observations}>{o.observations || 'Sem relato adicional.'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabConductProf() {
  const { occurrences, students, rules } = useAppContext();
  const uniqueClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort();
  const [selectedClass, setSelectedClass] = useState(uniqueClasses[0] || '');
  const [search, setSearch] = useState('');

  // Filter occurrences to show all occurrences of students in the selected class
  const classOccurrences = occurrences.filter(o => {
    const student = students.find(s => s.id === o.studentId);
    return student && student.class === selectedClass && !student.archived;
  });

  const filteredConducts = classOccurrences.filter(o => {
    const student = students.find(s => s.id === o.studentId);
    const rule = rules.find(r => r.code === o.ruleCode);
    const text = (student?.name || '') + ' ' + (rule?.description || '') + ' ' + (student?.class || '');
    return text.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Faltas Disciplinares</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visão consolidada de todas as faltas disciplinares registradas na turma selecionada (Somente Leitura).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar aluno ou falta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Aluno</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fato Gerador / Artigo</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gravidade</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Medida Aplicada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {filteredConducts.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Nenhum registro de falta disciplinar encontrado para os filtros ativos.</td></tr>
            ) : filteredConducts.map(o => {
              const student = students.find(s => s.id === o.studentId);
              const rule = rules.find(r => r.code === o.ruleCode);
              const dateStr = o.date ? new Date(o.date).toLocaleDateString('pt-BR') : '---';

              const severityColors: Record<Severity, string> = {
                Leve: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50',
                Media: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50',
                Grave: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50',
              };

              return (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{student?.name || '---'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{student?.id || '---'}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{dateStr}</td>
                  <td className="px-5 py-4 max-w-xs truncate" title={rule?.description || 'Infração'}>
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 block font-bold">Cód {o.ruleCode}</span>
                    <span className="text-slate-600 dark:text-slate-300">{rule?.description || '---'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityColors[rule?.severity || 'Leve']}`}>
                      {rule?.severity || 'Leve'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-medium">{o.measure || rule?.measure || 'Advertência Oral'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabReportsProf() {
  const { occurrences, students, praises, user } = useAppContext();
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  // Get professor's occurrences
  const profOccs = occurrences.filter(o => 
    (o.registeredBy && (o.registeredBy.toLowerCase() === user?.email?.toLowerCase() || o.registeredBy.toLowerCase() === userName.toLowerCase())) ||
    (o.locatedBy && (o.locatedBy.toLowerCase() === user?.email?.toLowerCase() || o.locatedBy.toLowerCase() === userName.toLowerCase()))
  );

  const uniqueClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort();
  const [activeReport, setActiveReport] = useState<'none' | 'summary' | 'occurrences'>('none');

  // Compute stats for all classes dynamically
  const classStats = uniqueClasses.map(cls => {
    const classStudents = students.filter(s => s.class === cls && !s.archived);
    const avgPoints = classStudents.reduce((acc, s) => acc + (s.points ?? 8.0), 0) / (classStudents.length || 1);
    const infractionsCount = occurrences.filter(o => {
      const s = students.find(st => st.id === o.studentId);
      return s && s.class === cls;
    }).length;
    const praisesCount = praises ? praises.filter(p => {
      const s = students.find(st => st.id === p.studentId);
      return s && s.class === cls;
    }).length : 0;

    return {
      class: cls,
      studentsCount: classStudents.length,
      avgPoints,
      infractionsCount,
      praisesCount,
    };
  }).filter(stat => stat.studentsCount > 0); // only show classes with students

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="space-y-6">
      {activeReport === 'none' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">Resumo Comportamental das Turmas</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Relatório consolidado com o total de alunos, médias comportamentais de pontos, total de elogios e faltas disciplinares de todas as turmas da instituição.
              </p>
            </div>
            <button
              onClick={() => setActiveReport('summary')}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              Visualizar Relatório
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">Ficha Disciplinar Consolidada</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Extrato detalhado e formal de todas as ocorrências escolares lavradas e identificadas sob seu registro para fins de arquivamento legal.
              </p>
            </div>
            <button
              onClick={() => setActiveReport('occurrences')}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
            >
              Visualizar Relatório
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6 print:p-0 print:border-0 print:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 print:hidden">
            <button
              onClick={() => setActiveReport('none')}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              Imprimir Relatório
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Escola Estadual Cívico-Militar</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">Relatório Disciplinar do Corpo Docente</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Professor(a): <span className="font-bold">{userName}</span> | E-mail: {user?.email}</p>
              <p className="text-[10px] text-slate-400 italic">Data de Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>

            {activeReport === 'summary' ? (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-2">Resumo Geral por Turma</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {classStats.map(stat => (
                    <div key={stat.class} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{stat.class}</span>
                        <span className="text-xs text-slate-400">{stat.studentsCount} alunos</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Média pts</p>
                          <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">{stat.avgPoints.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Ocorrências</p>
                          <p className="text-base font-extrabold text-rose-600 dark:text-rose-400">{stat.infractionsCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Elogios</p>
                          <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{stat.praisesCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-2">Histórico de Ocorrências Autoras</h3>
                <div className="overflow-x-auto border rounded-xl border-slate-100 dark:border-slate-700">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">Data</th>
                        <th className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">Aluno</th>
                        <th className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">Turma</th>
                        <th className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">Infração / Art.</th>
                        <th className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-400">Relato / Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profOccs.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Nenhum registro localizado sob sua autoria.</td></tr>
                      ) : profOccs.map(o => {
                        const student = students.find(s => s.id === o.studentId);
                        return (
                          <tr key={o.id}>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{o.date ? new Date(o.date).toLocaleDateString('pt-BR') : '---'}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{student?.name || '---'}</td>
                            <td className="px-4 py-3 text-slate-600">{student?.class || '---'}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">Artigo {o.ruleCode}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={o.observations}>{o.observations || '---'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabPermissions() {
  const { permissions, updatePermissions, currentUserRole } = useAppContext();
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (permissions) {
      setLocalPermissions(JSON.parse(JSON.stringify(permissions)));
    }
  }, [permissions]);

  const rolesList: { id: string; label: string; color: string }[] = [
    { id: 'GESTOR', label: 'Gestor', color: 'text-blue-500' },
    { id: 'COORD', label: 'Coordenador', color: 'text-emerald-500' },
    { id: 'MONITOR', label: 'Monitor', color: 'text-amber-500' },
    { id: 'PROFESSOR', label: 'Professor', color: 'text-indigo-500' },
  ];

  const panelsList: { key: string; label: string; category: string; description: string }[] = [
    { key: 'dashboard', label: 'Início (Dashboard)', category: 'Geral', description: 'Acesso à tela principal com gráficos e estatísticas consolidadas.' },
    { key: 'alunos_lista', label: 'Lista de Alunos', category: 'Alunos', description: 'Visualizar a listagem e fotos de alunos cadastrados.' },
    { key: 'alunos_ficha', label: 'Ficha Disciplinar', category: 'Alunos', description: 'Consultar pontuação e histórico de medidas do aluno.' },
    { key: 'alunos_xerife', label: 'Xerife', category: 'Alunos', description: 'Acesso à gestão de xerifes escolares da semana.' },
    { key: 'alunos_arquivados', label: 'Arquivados', category: 'Alunos', description: 'Acesso a alunos arquivados e históricos passados.' },
    { key: 'disciplina_registro', label: 'Registro Disciplinar', category: 'Disciplina', description: 'Lançar e gerenciar ocorrências disciplinares de alunos.' },
    { key: 'disciplina_faltas', label: 'Faltas Disciplinares', category: 'Disciplina', description: 'Visualizar e gerenciar as faltas disciplinares ativas.' },
    { key: 'disciplina_termo', label: 'Termo de Conduta (TAC)', category: 'Disciplina', description: 'Lançamento e impressão de Termos de Ajustamento de Conduta.' },
    { key: 'disciplina_convocacao', label: 'Convocação de Pais', category: 'Disciplina', description: 'Emissão e registro de convocações de pais ou responsáveis.' },
    { key: 'disciplina_documentos', label: 'Documentos', category: 'Disciplina', description: 'Acesso à pasta de documentos oficiais e portarias.' },
    { key: 'comportamento_rankings', label: 'Comportamento & Rankings', category: 'Comportamento', description: 'Visualizar o ranking de conduta e comportamento dos alunos.' },
    { key: 'comportamento_elogios', label: 'Elogios e Bonificações', category: 'Comportamento', description: 'Cadastrar elogios individuais de destaque.' },
    { key: 'comportamento_acidentes', label: 'Registro de Acidentes', category: 'Comportamento', description: 'Visualizar e cadastrar ocorrências de acidentes físicos.' },
    { key: 'relatorios', label: 'Relatórios', category: 'Documentos', description: 'Visualizar relatórios gerenciais e estatísticas disciplinares.' },
    { key: 'sistema_implantacao', label: 'Implantação', category: 'Sistema', description: 'Acesso às configurações de implantação de turmas e salas.' },
    { key: 'sistema_fechamento', label: 'Fechamento do Ano', category: 'Sistema', description: 'Executar encerramento do ano letivo e reset de notas.' },
    { key: 'sistema_auditoria', label: 'Auditoria de Ações', category: 'Sistema', description: 'Histórico auditável de ações executadas pelos usuários.' },
  ];

  const handleToggle = (role: string, panelKey: string) => {
    if (role === 'admin_global') return;
    
    setLocalPermissions(prev => {
      const updatedRole = { ...prev[role] };
      updatedRole[panelKey] = !updatedRole[panelKey];
      return { ...prev, [role]: updatedRole };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await updatePermissions(localPermissions as any);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(panelsList.map(p => p.category)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-500 animate-pulse" />
              Matriz de Permissões por Cargo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Marque quais painéis e recursos cada perfil de acesso pode visualizar ou utilizar no sistema. As alterações entram em vigor imediatamente para todos os usuários da respectiva função.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-pulse">
            <ShieldCheck className="w-5 h-5" /> Permissões salvas e propagadas com sucesso no Supabase!
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/3">Painel / Recurso</th>
                {rolesList.map(r => (
                  <th key={r.id} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-slate-500 dark:text-slate-400">
                    <span className={r.color}>{r.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {categories.map(cat => (
                <React.Fragment key={cat}>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                    <td colSpan={5} className="px-6 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {cat}
                    </td>
                  </tr>
                  {panelsList.filter(p => p.category === cat).map(panel => (
                    <tr key={panel.key} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition duration-150">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{panel.label}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{panel.description}</p>
                      </td>
                      {rolesList.map(role => {
                        const isAllowed = localPermissions[role.id]?.[panel.key] ?? false;
                        return (
                          <td key={role.id} className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggle(role.id, panel.key)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAllowed ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAllowed ? 'translate-x-5' : 'translate-x-0'}`}
                              />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

