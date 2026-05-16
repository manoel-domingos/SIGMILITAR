'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldAlert, ShieldCheck, Edit2, Check, X,
  ArrowLeft, Info, RefreshCw, Building2, User
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

interface School {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin_global: 'Admin Global / DRE',
  GESTOR: 'Gestor',
  COORD: 'Coordenador',
  MONITOR: 'Monitor',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin_global: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  GESTOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COORD: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  MONITOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function ConfiguracoesPage() {
  const { currentUserRole } = useAppContext();
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ role: AppRole; school_id: string }>({
    role: 'COORD',
    school_id: 'joaobatista',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
    if (error) { showToast('Erro ao salvar: ' + error.message); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...editValues } : u));
    setEditingId(null);
    showToast('Usuário atualizado.');
  };

  // Apenas admin_global pode acessar esta página
  if (currentUserRole !== 'admin_global' && currentUserRole !== 'GESTOR') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 min-h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-rose-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Acesso Negado</h2>
        <p className="mt-2 text-sm max-w-md">Esta área é restrita ao Admin Global.</p>
        <button onClick={() => router.back()} className="mt-6 text-blue-600 hover:underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-4 py-2 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-500 transition shadow-sm"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" /> Configuração do Sistema
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie usuários, papéis e escolas do sistema multi-tenant.</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm"
          >
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex gap-3 text-sm border border-blue-100 dark:border-blue-800/50">
        <Info className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
        <div className="space-y-1">
          <p><strong>Admin Global / DRE:</strong> acesso a todas as escolas, pode alterar papéis e escola de qualquer usuário.</p>
          <p><strong>Gestor:</strong> acesso total à escola vinculada.</p>
          <p><strong>Coordenador / Monitor:</strong> acesso de escrita sem gerenciar papéis.</p>
        </div>
      </div>

      {/* Escolas cadastradas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" /> Escolas Cadastradas
        </h2>
        <div className="flex flex-wrap gap-2">
          {schools.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{s.id}</span>
              <span>{s.name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-300">Usuários do Sistema</h2>
          <span className="ml-auto text-xs text-slate-400">{users.length} usuário{users.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">E-mail / Usuário</th>
                <th className="px-6 py-3 font-medium">Papel</th>
                <th className="px-6 py-3 font-medium">Escola</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Carregando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">{user.name || '—'}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{user.email}</td>

                  {/* Papel — editável */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === user.id ? (
                      <select
                        value={editValues.role}
                        onChange={e => setEditValues(v => ({ ...v, role: e.target.value as AppRole }))}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin_global">Admin Global / DRE</option>
                        <option value="GESTOR">Gestor</option>
                        <option value="COORD">Coordenador</option>
                        <option value="MONITOR">Monitor</option>
                      </select>
                    ) : (
                      <span className={'px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ' + ROLE_COLORS[user.role]}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    )}
                  </td>

                  {/* Escola — editável */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === user.id ? (
                      <select
                        value={editValues.school_id}
                        onChange={e => setEditValues(v => ({ ...v, school_id: e.target.value }))}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{user.school_id}</span>
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {editingId === user.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveEdit(user.id)}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition"
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
