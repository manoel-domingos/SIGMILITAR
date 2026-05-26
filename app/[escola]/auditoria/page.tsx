'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { ShieldAlert, Search, Database } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function AuditoriaPage() {
  const { auditLogs } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">CRIAR</span>;
      case 'UPDATE': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">ATUALIZAR</span>;
      case 'DELETE': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">EXCLUIR</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">{action}</span>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Segurança</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Auditoria de Ações</h1>
          <p className="text-slate-500 text-sm">Registro completo de todas as ações realizadas no sistema.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Buscar por usuário, detalhe ou módulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
            
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas as Ações</option>
              <option value="CREATE">Criações</option>
              <option value="UPDATE">Atualizações</option>
              <option value="DELETE">Exclusões</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Data/Hora</th>
                  <th className="px-6 py-3 font-medium">Usuário</th>
                  <th className="px-6 py-3 font-medium">Ação</th>
                  <th className="px-6 py-3 font-medium">Módulo</th>
                  <th className="px-6 py-3 font-medium w-full min-w-[300px]">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Database className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Nenhum log de auditoria encontrado.</p>
                      <p className="text-xs text-slate-400 mt-1">As ações registradas aparecerão aqui.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">
                          {formatDateTime(log.date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {log.userEmail}
                      </td>
                      <td className="px-6 py-4">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {log.entityName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
