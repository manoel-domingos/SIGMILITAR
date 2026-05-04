'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/lib/store';
import { AppUser, AppUserRole } from '@/lib/data';
import { ShieldAlert, Plus, Trash2, Edit2, ShieldCheck, Info, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfiguracoesPage() {
  const { appUsers, addAppUser, updateAppUser, deleteAppUser, currentUserRole } = useAppContext();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{name: string, email: string, role: AppUserRole}>({
    name: '',
    email: '',
    role: 'COORD'
  });

  if (currentUserRole !== 'GESTOR') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 min-h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-rose-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Acesso Negado</h2>
        <p className="mt-2 text-sm max-w-md">Você não tem permissão para acessar as configurações do sistema. Esta área é restrita aos Gestores.</p>
        <button onClick={() => router.back()} className="mt-6 text-blue-600 hover:underline">Voltar</button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateAppUser(editingId, formData);
      setEditingId(null);
    } else {
      await addAppUser(formData);
      setIsAdding(false);
    }
    setFormData({ name: '', email: '', role: 'COORD' });
  };

  const handleEdit = (user: AppUser) => {
    setFormData({ name: user.name, email: user.email, role: user.role });
    setEditingId(user.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir as permissões deste usuário? Ele passará a ser tratado como Convidado se tentar entrar.')) {
      await deleteAppUser(id);
    }
  };

  return (
    <div className="space-y-6">
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
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerenciamento de usuários e níveis de acesso ao sistema.</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', role: 'COORD' });
              setEditingId(null);
              setIsAdding(!isAdding);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            {isAdding ? 'Cancelar' : <><Plus className="w-4 h-4" /> Novo Usuário</>}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex gap-3 text-sm border border-blue-100 dark:border-blue-800/50">
        <Info className="w-5 h-5 shrink-0 text-blue-500" />
        <div>
          <p><strong>Níveis de Acesso:</strong></p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li><strong>Gestor:</strong> Acesso total ao sistema, inclusive a esta tela de configuração.</li>
            <li><strong>Coordenador / Monitor:</strong> Acesso de gravação (adicionar, editar dados), mas não pode mudar papéis.</li>
            <li><strong>Qualquer outro e-mail:</strong> Terá permissão automática de &quot;Convidado&quot; (Somente Leitura).</li>
          </ul>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{editingId ? 'Editar Usuário' : 'Conceder Permissão a Usuário'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200"
                placeholder="Ex: Prof. Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input
                type="text"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200"
                placeholder="Ex: silva@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Papel</label>
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as AppUserRole})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200"
              >
                <option value="GESTOR">Gestor</option>
                <option value="COORD">Coordenador</option>
                <option value="MONITOR">Monitor</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              Salvar Usuário
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">E-mail / Username</th>
                <th className="px-6 py-4 font-medium">Papel</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
              {appUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold">{user.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={'px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider ' + (user.role === 'GESTOR' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : user.role === 'COORD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 transition" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-rose-600 transition" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {appUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nenhum usuário configurado. (O padrão será Somente Leitura)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
