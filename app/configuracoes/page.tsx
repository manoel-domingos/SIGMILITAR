'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldAlert, ShieldCheck, Edit2, Check, X, ArrowLeft,
  RefreshCw, Building2, UserPlus, Search, Trash2,
  Eye, EyeOff, Users, ChevronRight, Lock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AppRole = 'GESTOR' | 'COORD' | 'MONITOR' | 'admin_global';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  school_id: string;
  created_at: string;
}

interface School { id: string; name: string; }

const ROLE_LABELS: Record<AppRole, string> = {
  admin_global: 'Admin Global',
  GESTOR:  'Gestor',
  COORD:   'Coordenador',
  MONITOR: 'Monitor',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin_global: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  GESTOR:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COORD:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  MONITOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const AVATAR_COLORS = [
  'bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500',
  'bg-indigo-500','bg-teal-500','bg-orange-500','bg-cyan-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

// ---------- Drawer de criação de usuário ----------
function CreateUserDrawer({
  open,
  onClose,
  schools,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  schools: School[];
  onCreated: (u: UserRow) => void;
}) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'GESTOR' as AppRole, school_id: 'joaobatista',
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setForm({ name: '', email: '', password: '', role: 'GESTOR', school_id: 'joaobatista' });
    setError(null);
    setShowPass(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Nome e e-mail/usuário são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('user_profiles')
      .insert([{
        name:      form.name.trim(),
        email:     form.email.trim(),
        password:  form.password || null,
        role:      form.role,
        school_id: form.school_id,
      }])
      .select()
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    if (data) onCreated(data as UserRow);
    handleClose();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />
      {/* Drawer */}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Novo Usuário</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Preencha os dados para criar a conta.</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form id="create-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Nome completo <span className="text-rose-500">*</span>
            </label>
            <input
              className={INPUT}
              placeholder="Ex: Maria Silva"
              value={form.name}
              onChange={set('name')}
              autoFocus
            />
          </div>

          {/* E-mail / usuário */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              E-mail ou nome de usuário <span className="text-rose-500">*</span>
            </label>
            <input
              className={INPUT}
              placeholder="Ex: maria.silva ou maria@escola.edu"
              value={form.email}
              onChange={set('email')}
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Usado para login. Pode ser um e-mail ou nome simples.
            </p>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Senha
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className={INPUT + ' pr-10'}
                placeholder="Deixe em branco para usar o padrão do sistema"
                value={form.password}
                onChange={set('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Papel */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Papel / Permissao
            </label>
            <select className={SELECT} value={form.role} onChange={set('role')}>
              <option value="admin_global">Admin Global / DRE</option>
              <option value="GESTOR">Gestor</option>
              <option value="COORD">Coordenador</option>
              <option value="MONITOR">Monitor</option>
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {form.role === 'admin_global' && 'Acesso irrestrito a todas as escolas.'}
              {form.role === 'GESTOR'       && 'Acesso total à escola vinculada.'}
              {form.role === 'COORD'        && 'Leitura e escrita, sem gerenciar usuarios.'}
              {form.role === 'MONITOR'      && 'Apenas leitura e registro de ocorrencias.'}
            </p>
          </div>

          {/* Escola */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Escola
            </label>
            <select className={SELECT} value={form.school_id} onChange={set('school_id')}>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form=""
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('create-user-form');
              if (el) (el as HTMLFormElement).requestSubmit();
            }}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </aside>
    </>
  );
}

// ---------- Página principal ----------
export default function ConfiguracoesPage() {
  const { currentUserRole } = useAppContext();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ role: AppRole; school_id: string }>({ role: 'COORD', school_id: 'joaobatista' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'schools'>('users');

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: usersData }, { data: schoolsData }] = await Promise.all([
      supabase.from('user_profiles').select('*').order('name'),
      supabase.from('schools').select('id, name').order('id'),
    ]);
    if (usersData) setUsers(usersData as UserRow[]);
    if (schoolsData) setSchools(schoolsData as School[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditValues({ role: user.role, school_id: user.school_id });
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: editValues.role, school_id: editValues.school_id, updated_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(false);
    if (error) { showToast('Erro: ' + error.message, 'err'); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...editValues } : u));
    setEditingId(null);
    showToast('Usuário atualizado com sucesso.');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('user_profiles').delete().eq('id', id);
    if (error) { showToast('Erro ao remover: ' + error.message, 'err'); return; }
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteId(null);
    showToast('Usuário removido.');
  };

  const handleCreated = (u: UserRow) => {
    setUsers(prev => [...prev, u].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    showToast('Usuário criado com sucesso.');
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
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Acesso Negado</h2>
          <p className="mt-1 text-sm">Esta area e restrita ao Admin Global.</p>
        </div>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  return (
    <>
      <CreateUserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        schools={schools}
        onCreated={handleCreated}
      />

      {/* Modal de confirmação de exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Remover usuário?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition ${toast.type === 'err' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
          {toast.type === 'ok' ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
                Configuracao do Sistema
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Usuarios, papeis e escolas do sistema multi-tenant.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuario
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {(['users', 'schools'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {tab === 'users' ? <><Users className="w-4 h-4" /> Usuarios <span className="ml-1 text-xs text-slate-400 dark:text-slate-500 font-normal">({users.length})</span></> : <><Building2 className="w-4 h-4" /> Escolas</>}
            </button>
          ))}
        </div>

        {/* TAB: Usuarios */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Barra de busca */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Usuario</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Papel</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Escola</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Carregando...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                        {search ? 'Nenhum resultado para a busca.' : 'Nenhum usuário cadastrado.'}
                      </td>
                    </tr>
                  ) : filtered.map(user => (
                    <tr key={user.id} className={`group transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${editingId === user.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      {/* Usuario */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name || user.email} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name || '—'}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Papel */}
                      <td className="px-5 py-3.5">
                        {editingId === user.id ? (
                          <select
                            value={editValues.role}
                            onChange={e => setEditValues(v => ({ ...v, role: e.target.value as AppRole }))}
                            className="bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="admin_global">Admin Global</option>
                            <option value="GESTOR">Gestor</option>
                            <option value="COORD">Coordenador</option>
                            <option value="MONITOR">Monitor</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        )}
                      </td>

                      {/* Escola */}
                      <td className="px-5 py-3.5">
                        {editingId === user.id ? (
                          <select
                            value={editValues.school_id}
                            onChange={e => setEditValues(v => ({ ...v, school_id: e.target.value }))}
                            className="bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {schools.map(s => (
                              <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                              {user.school_id}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Acoes */}
                      <td className="px-5 py-3.5 text-right">
                        {editingId === user.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => saveEdit(user.id)}
                              disabled={saving}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Salvar
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => startEdit(user)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(user.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* TAB: Escolas */}
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
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {users.filter(u => u.school_id === s.id).length} usuario{users.filter(u => u.school_id === s.id).length !== 1 ? 's' : ''}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
