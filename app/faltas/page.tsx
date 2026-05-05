'use client';

import React, { useState, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { DisciplineRule } from '@/lib/data';
import { BookOpen, Search, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';

const SEVERITY_CONFIG = {
  Leve: {
    label: 'Leve',
    badge: 'bg-sky-50 text-sky-600 border border-sky-200',
    header: 'bg-sky-50 border-sky-200 text-sky-700',
    dot: 'bg-sky-400',
    points: '-0,10 pts',
    measure: 'Advertência Oral',
  },
  Media: {
    label: 'Média',
    badge: 'bg-amber-50 text-amber-600 border border-amber-200',
    header: 'bg-amber-50 border-amber-200 text-amber-700',
    dot: 'bg-amber-400',
    points: '-0,30 pts',
    measure: 'Advertência Escrita',
  },
  Grave: {
    label: 'Grave',
    badge: 'bg-rose-50 text-rose-600 border border-rose-200',
    header: 'bg-rose-50 border-rose-200 text-rose-700',
    dot: 'bg-rose-400',
    points: '-0,50 pts',
    measure: 'Suspensão',
  },
} as const;

type SeverityKey = keyof typeof SEVERITY_CONFIG;

// Remove acentos para busca insensível a acentuação
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export default function FaltasDisciplinares() {
  const { rules, updateRule, currentUserRole } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRule, setEditingRule] = useState<DisciplineRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Form state
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityKey>('Leve');
  const [points, setPoints] = useState(0);
  const [measure, setMeasure] = useState('');

  const filteredRules = useMemo(() =>
    rules.filter(r =>
      normalizeText(r.description).includes(normalizeText(searchTerm)) ||
      r.code.toString().includes(searchTerm)
    ),
    [rules, searchTerm]
  );

  // Group by severity in logical order: Leve → Media → Grave, sorted by code asc
  const grouped = useMemo(() => {
    const order: SeverityKey[] = ['Leve', 'Media', 'Grave'];
    return order.map(sev => ({
      severity: sev,
      items: filteredRules
        .filter(r => r.severity === sev || r.severity === (sev === 'Media' ? 'Média' : sev))
        .sort((a, b) => a.code - b.code),
    })).filter(g => g.items.length > 0);
  }, [filteredRules]);

  const openEditModal = (r: DisciplineRule) => {
    setEditingRule(r);
    setDescription(r.description);
    setSeverity(r.severity as SeverityKey);
    setPoints(r.points);
    setMeasure(r.measure);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingRule(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    updateRule(editingRule.code, { description, severity, points, measure });
    closeModal();
  };

  const toggleGroup = (sev: string) =>
    setCollapsed(prev => ({ ...prev, [sev]: !prev[sev] }));

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Base de Dados</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Faltas Disciplinares</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Regulamento com {rules.length} infrações organizadas por gravidade.
            </p>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SEVERITY_CONFIG) as [SeverityKey, typeof SEVERITY_CONFIG[SeverityKey]][]).map(([key, cfg]) => (
              <div key={key} className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ' + cfg.badge}>
                <span className={'w-2 h-2 rounded-full ' + cfg.dot} />
                <span>{cfg.label}</span>
                <span className="opacity-60">·</span>
                <span>{cfg.points}</span>
                <span className="opacity-60">·</span>
                <span>{cfg.measure}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar por código ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Groups */}
        {grouped.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-16 text-center text-slate-400 text-sm">
            Nenhuma infração encontrada para &ldquo;{searchTerm}&rdquo;.
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ severity: sev, items }) => {
              const cfg = SEVERITY_CONFIG[sev];
              const isCollapsed = collapsed[sev];
              return (
                <div key={sev} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(sev)}
                    className={'w-full flex items-center justify-between px-5 py-3 border-b text-left transition ' + cfg.header}
                  >
                    <div className="flex items-center gap-3">
                      <span className={'w-2.5 h-2.5 rounded-full ' + cfg.dot} />
                      <span className="font-bold text-sm uppercase tracking-wide">
                        Natureza {cfg.label}
                      </span>
                      <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + cfg.badge}>
                        {items.length} {items.length === 1 ? 'artigo' : 'artigos'}
                      </span>
                      <span className="text-xs opacity-60">· {cfg.points} · {cfg.measure}</span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown className="w-4 h-4 opacity-60" />
                      : <ChevronUp className="w-4 h-4 opacity-60" />}
                  </button>

                  {/* Table */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="px-5 py-2.5 w-16 text-center">Art.</th>
                            <th className="px-5 py-2.5">Descrição da Infração</th>
                            <th className="px-5 py-2.5 text-center w-24">Pontos</th>
                            <th className="px-5 py-2.5 w-44">Medida Administrativa</th>
                            {currentUserRole !== 'GUEST' && (
                              <th className="px-5 py-2.5 w-12 text-center">Editar</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {items.map(r => (
                            <tr key={r.code} className="hover:bg-slate-50/70 transition group">
                              <td className="px-5 py-3 text-center">
                                <span className={'inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ' + cfg.badge}>
                                  {r.code}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-700 whitespace-normal leading-relaxed">
                                {r.description}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className="font-mono font-bold text-rose-500 text-xs">
                                  {r.points.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className={'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ' + cfg.badge}>
                                  {r.measure}
                                </span>
                              </td>
                              {currentUserRole !== 'GUEST' && (
                                <td className="px-5 py-3 text-center">
                                  <button
                                    onClick={() => openEditModal(r)}
                                    className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                    title="Editar artigo"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {isModalOpen && editingRule && (
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-modal max-w-lg w-full flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className={'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ' + (SEVERITY_CONFIG[editingRule.severity as SeverityKey]?.badge ?? '')}>
                  {editingRule.code}
                </span>
                Editar Artigo {editingRule.code}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                  onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gravidade</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as SeverityKey)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Leve">Leve</option>
                    <option value="Media">Média</option>
                    <option value="Grave">Grave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pontuação</label>
                  <input
                    type="number"
                    step="0.05"
                    value={points}
                    onChange={e => setPoints(parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Medida Administrativa</label>
                <input
                  type="text"
                  value={measure}
                  onChange={e => setMeasure(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white transition font-semibold shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
