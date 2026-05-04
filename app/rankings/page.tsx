'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { Trophy, Filter, AlertTriangle, Users } from 'lucide-react';

export default function Rankings() {
  const { students, getStudentPoints, getStudentOccurrences, occurrences, rules } = useAppContext();
  
  const [filterType, setFilterType] = useState('melhores'); // melhores, piores, ocorrencias

  const enrichedStudents = students.map(student => {
    const points = getStudentPoints(student.id);
    const studentOccurrences = getStudentOccurrences(student.id);
    return {
      ...student,
      points,
      occurrencesCount: studentOccurrences.length,
    };
  });

  // Sort students based on filter
  const sortedStudents = [...enrichedStudents].sort((a, b) => {
    if (filterType === 'melhores') return b.points - a.points;
    if (filterType === 'piores') return a.points - b.points;
    if (filterType === 'ocorrencias') return b.occurrencesCount - a.occurrencesCount;
    return 0;
  });

  // Calculate Top 10 Ocorrencias
  const ruleCounts = rules.map(rule => {
    return {
      ...rule,
      count: occurrences.filter(o => o.ruleCode === rule.code).length
    };
  }).filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 10);

  // Calculate Top Turmas
  const classesCounts: Record<string, number> = {};
  occurrences.forEach(o => {
    const student = students.find(s => s.id === o.studentId);
    if (student) {
      classesCounts[student.class] = (classesCounts[student.class] || 0) + 1;
    }
  });
  
  const topClasses = Object.entries(classesCounts)
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Desempenho</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Rankings</h1>
          </div>
          
          <div className="flex gap-3 items-center w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="melhores">Maiores Notas (Melhores)</option>
              <option value="piores">Menores Notas (Piores)</option>
              <option value="ocorrencias">Mais Ocorrências</option>
            </select>
          </div>
        </div>

        {/* Top List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">
          <div className="overflow-auto max-h-[400px]">
             <table className="w-full text-left text-sm whitespace-nowrap">
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {sortedStudents.slice(0, 10).map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4 text-slate-500 font-medium w-12">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-slate-600">
                        {s.name.charAt(0)}
                      </div>
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{s.class}</td>
                    <td className="px-6 py-4 text-slate-500">{s.shift}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${Math.min((s.occurrencesCount / 10) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{s.occurrencesCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-lg text-slate-800">
                      {s.points.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Top 10 Ocurrences */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-blue-400" />
              <h3 className="text-slate-800 font-semibold flex-1">Top 10 - Ocorrências Recorrentes</h3>
            </div>
            
            <div className="space-y-4 mt-6">
              {ruleCounts.map((r, i) => (
                <div key={r.code} className="flex gap-4 items-start border-b border-slate-200/50 pb-4 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-medium text-sm mt-0.5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-slate-800 text-sm font-medium mb-1 line-clamp-2">{r.description}</p>
                    <span className={'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ' + (r.severity === 'Leve' ? 'bg-slate-100 text-slate-700' : r.severity === 'Media' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}>
                      {r.severity} • Cód. {r.code}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800">{r.count}x</span>
                  </div>
                </div>
              ))}
              {ruleCounts.length === 0 && (
                <p className="text-slate-500 text-sm">Nenhuma ocorrência registrada.</p>
              )}
            </div>
          </div>

          {/* Top Turmas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-slate-800 font-semibold flex-1">Turmas com Mais Ocorrências</h3>
            </div>
            
            <div className="space-y-5">
              {topClasses.map((t, i) => {
                const maxCount = topClasses[0]?.count || 1;
                const percentage = (t.count / maxCount) * 100;
                return (
                  <div key={t.className} className="flex gap-4 items-center">
                    <span className="text-slate-500 font-medium text-sm w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-800 font-medium text-sm">{t.className}</span>
                        <span className="text-xs text-slate-500">{t.count} ocorrências</span>
                      </div>
                      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {topClasses.length === 0 && (
                <p className="text-slate-500 text-sm">Nenhuma turma com ocorrências.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
