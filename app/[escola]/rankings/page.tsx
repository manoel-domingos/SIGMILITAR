'use client';

import React, { useState, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import StudentSheet from '@/components/StudentSheet';
import {
  Trophy, AlertTriangle, Users, Search, Filter,
  AlertCircle, ChevronDown, FileText,
} from 'lucide-react';

/* ── helpers ── */
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const COL_CONFIG = [
  {
    key: 'Grave',
    label: 'Ocorrencias Graves',
    badgeClass: 'bg-rose-500 text-white',
    headerClass: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
    labelClass: 'text-rose-700 dark:text-rose-400',
    dotClass: 'bg-rose-500',
    iconClass: 'text-rose-500',
  },
  {
    key: 'Media',
    label: 'Ocorrencias Medias',
    badgeClass: 'bg-amber-400 text-white',
    headerClass: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
    labelClass: 'text-amber-700 dark:text-amber-400',
    dotClass: 'bg-amber-400',
    iconClass: 'text-amber-500',
  },
  {
    key: 'Leve',
    label: 'Ocorrencias Leves',
    badgeClass: 'bg-blue-500 text-white',
    headerClass: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',
    labelClass: 'text-blue-700 dark:text-blue-400',
    dotClass: 'bg-blue-500',
    iconClass: 'text-blue-500',
  },
] as const;

type ColKey = (typeof COL_CONFIG)[number]['key'];

/* ── Card do aluno ── */
function StudentCard({
  student,
  occs,
  rules,
  schoolName,
  colKey,
  onClick,
}: {
  student: any;
  occs: any[];
  rules: any[];
  schoolName: string;
  colKey: ColKey;
  onClick: () => void;
}) {
  const graveCnt = occs.filter(o => {
    const r = rules.find((r: any) => r.code === o.ruleCode);
    return r?.severity === 'Grave';
  }).length;
  const mediaCnt = occs.filter(o => {
    const r = rules.find((r: any) => r.code === o.ruleCode);
    return r?.severity === 'Media' || r?.severity === 'Média';
  }).length;
  const leveCnt = occs.filter(o => {
    const r = rules.find((r: any) => r.code === o.ruleCode);
    return r?.severity === 'Leve';
  }).length;

  const docCount = occs.reduce((acc, o) =>
    acc + (o.videoUrls?.length || 0) + (o.signedDocUrls?.length || 0), 0);

  const shiftShort: Record<string, string> = { Matutino: 'M', Vespertino: 'V', Noturno: 'N' };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 active:scale-[0.98] transition-all duration-150 group"
    >
      {/* Topo: avatar + nome */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 relative">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
              {initials(student.name)}
            </div>
          )}
          {/* dot de gravidade */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
            colKey === 'Grave' ? 'bg-rose-500' : colKey === 'Media' ? 'bg-amber-400' : 'bg-blue-500'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {student.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {schoolName || 'Escola nao informada'}
          </p>
        </div>
      </div>

      {/* Meta: série + período */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {student.class}
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
          {student.shift}
        </span>
      </div>

      {/* Rodapé: badges gravidade + docs */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          {graveCnt > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {graveCnt}G
            </span>
          )}
          {mediaCnt > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              {mediaCnt}M
            </span>
          )}
          {leveCnt > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {leveCnt}L
            </span>
          )}
          {occs.length === 0 && (
            <span className="text-[10px] text-slate-400">Sem ocorrencias</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-0.5 text-[10px]">
            <AlertCircle className="w-3 h-3" />
            {occs.length}
          </span>
          {docCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <FileText className="w-3 h-3" />
              {docCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Página principal ── */
export default function Rankings() {
  const { students, getStudentOccurrences, occurrences, rules, contextSchools } = useAppContext();

  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('Todos');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  /* Enriquece cada aluno com dados de ocorrências */
  const enriched = useMemo(() => students.filter(s => !s.archived).map(s => {
    const occs = getStudentOccurrences(s.id);
    const graveCnt = occs.filter(o => {
      const r = rules.find((r: any) => r.code === o.ruleCode);
      return r?.severity === 'Grave';
    }).length;
    const mediaCnt = occs.filter(o => {
      const r = rules.find((r: any) => r.code === o.ruleCode);
      return r?.severity === 'Media';
    }).length;
    const leveCnt = occs.filter(o => {
      const r = rules.find((r: any) => r.code === o.ruleCode);
      return r?.severity === 'Leve';
    }).length;
    const dominantKey: ColKey =
      graveCnt > 0 ? 'Grave' : mediaCnt > 0 ? 'Media' : 'Leve';
    const school = contextSchools.find(sc => sc.id === (s as any).school_id);
    return { ...s, occs, graveCnt, mediaCnt, leveCnt, dominantKey, schoolName: school?.name || '' };
  }), [students, occurrences, rules, contextSchools]);

  /* Filtro de busca + turno */
  const filtered = useMemo(() => enriched.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase());
    const matchShift = shiftFilter === 'Todos' || s.shift === shiftFilter;
    return matchSearch && matchShift;
  }), [enriched, search, shiftFilter]);

  /* Alunos sem ocorrência ficam na coluna Leve */
  const cols: Record<ColKey, typeof filtered> = {
    Grave: filtered.filter(s => s.dominantKey === 'Grave').sort((a, b) => b.graveCnt - a.graveCnt),
    Media: filtered.filter(s => s.dominantKey === 'Media').sort((a, b) => b.mediaCnt - a.mediaCnt),
    Leve: filtered.filter(s => s.dominantKey === 'Leve').sort((a, b) => b.occs.length - a.occs.length),
  };

  /* Totais para stats gerais */
  const totalOccs = occurrences.length;
  const graveTotal = enriched.reduce((a, s) => a + s.graveCnt, 0);
  const mediaTotal = enriched.reduce((a, s) => a + s.mediaCnt, 0);

  return (
    <AppShell>
      <div className="space-y-5">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Desempenho</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Rankings de Alunos</h1>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar aluno ou turma..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <select
                value={shiftFilter}
                onChange={e => setShiftFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option>Todos</option>
                <option>Matutino</option>
                <option>Vespertino</option>
                <option>Noturno</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Alunos</p>
              <p className="text-xl font-black text-slate-800 dark:text-white leading-none mt-0.5">{filtered.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-500/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Graves</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none mt-0.5">{graveTotal}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Medias</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none mt-0.5">{mediaTotal}</p>
            </div>
          </div>
        </div>

        {/* Board Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COL_CONFIG.map(col => {
            const students = cols[col.key];
            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* Cabeçalho da coluna */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${col.headerClass}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${col.labelClass}`}>
                    {col.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeClass}`}>
                    {students.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2.5">
                  {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl border-dashed">
                      <span className="text-xs">Nenhum aluno aqui</span>
                    </div>
                  ) : (
                    students.map(s => (
                      <StudentCard
                        key={s.id}
                        student={s}
                        occs={s.occs}
                        rules={rules}
                        schoolName={s.schoolName}
                        colKey={col.key}
                        onClick={() => setSelectedStudentId(s.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ficha do aluno */}
      {selectedStudentId && (
        <StudentSheet
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </AppShell>
  );
}
