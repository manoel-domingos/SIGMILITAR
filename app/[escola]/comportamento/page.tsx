'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { Search, Activity, Trophy, AlertTriangle, Users, Shield, Star } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { useSearchParams } from 'next/navigation';

function ComportamentoContent() {
  const { students, getStudentPoints, getStudentOccurrences, occurrences, rules, praises } = useAppContext();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Todos os meses');
  const [selectedClass, setSelectedClass] = useState('Todas as turmas');
  const [filterType, setFilterType] = useState('melhores'); // para o ranking

  useEffect(() => {
    // Carregar filtros url
    const paramMonth = searchParams.get('month');
    const paramClass = searchParams.get('class');
    if (paramMonth && paramMonth !== 'Selecionar...') setTimeout(() => setSelectedMonth(paramMonth), 0);
    if (paramClass && paramClass !== 'Todas as turmas') setTimeout(() => setSelectedClass(paramClass), 0);
  }, [searchParams]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const classes = Array.from(new Set(students.map(s => s.class))).sort();

  const enrichedStudents = students.map(student => {
    const points = getStudentPoints(student.id);
    const studentOccurrences = getStudentOccurrences(student.id).filter(o => {
      const defaultDate = new Date(o.date);
      const monthIndex = parseInt(o.date.split('-')[1]) - 1; 
      const month = months[monthIndex] || months[defaultDate.getMonth()];
      return selectedMonth === 'Todos os meses' || selectedMonth === '' || month.toLowerCase() === selectedMonth.toLowerCase();
    });

    // Skip student if they don't match the selected class filter
    const matchClass = selectedClass === 'Todas as turmas' || selectedClass === '' || student.class.toLowerCase() === selectedClass.toLowerCase();
    
    let deductions = 0;
    studentOccurrences.forEach(o => {
      const rule = rules.find(r => r.code === o.ruleCode);
      if (rule) deductions += Math.abs(rule.points);
    });

    const studentPraises = praises.filter(p => p.studentId === student.id).length; // Could filter praises by month too if needed

    let classification = '';
    let classColor = '';
    if (points >= 7.5) {
      classification = 'Bom/Ótimo';
      classColor = 'text-emerald-700 bg-emerald-100';
    } else if (points >= 5.0) {
      classification = 'Regular';
      classColor = 'text-amber-700 bg-amber-100';
    } else {
      classification = 'Irregular';
      classColor = 'text-rose-700 bg-rose-100';
    }

    return {
      ...student,
      points,
      occurrencesCount: studentOccurrences.length,
      deductions,
      praisesCount: studentPraises,
      classification,
      classColor,
      matchClass
    };
  }).filter(s => s.matchClass);

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredStudents = enrichedStudents
    .filter(s => norm(s.name).includes(norm(searchTerm)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const stats = {
    bom: enrichedStudents.filter(s => s.points >= 7.5).length,
    regular: enrichedStudents.filter(s => s.points >= 5.0 && s.points < 7.5).length,
    irregular: enrichedStudents.filter(s => s.points < 5.0).length,
  };

  // --- Rankings Data ---
  // Sort students based on filter
  const sortedStudents = [...enrichedStudents].sort((a, b) => {
    if (filterType === 'melhores') return b.points - a.points;
    if (filterType === 'piores') return a.points - b.points;
    if (filterType === 'ocorrencias') return b.occurrencesCount - a.occurrencesCount;
    return 0;
  });

  // Calculate Top 10 Ocorrencias (filtradas)
  const filteredOccurrencesForRanking = occurrences.filter(o => {
      const defaultDate = new Date(o.date);
      const monthIndex = parseInt(o.date.split('-')[1]) - 1; 
      const month = months[monthIndex] || months[defaultDate.getMonth()];
      const student = students.find(s => s.id === o.studentId);
      const matchMonth = selectedMonth === 'Todos os meses' || selectedMonth === '' || month.toLowerCase() === selectedMonth.toLowerCase();
      const matchClass = selectedClass === 'Todas as turmas' || selectedClass === '' || (student && student.class.toLowerCase() === selectedClass.toLowerCase());
      return matchMonth && matchClass;
  });

  const ruleCounts = rules.map(rule => {
    return {
      ...rule,
      count: filteredOccurrencesForRanking.filter(o => o.ruleCode === rule.code).length
    };
  }).filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 10);

  // Calculate Top Turmas
  const classesCounts: Record<string, number> = {};
  filteredOccurrencesForRanking.forEach(o => {
    const student = students.find(s => s.id === o.studentId);
    if (student) {
      classesCounts[student.class] = (classesCounts[student.class] || 0) + 1;
    }
  });
  
  const topClasses = Object.entries(classesCounts)
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top Staff (Professores que mais registram ocorrências)
  const staffCounts: Record<string, number> = {};
  filteredOccurrencesForRanking.forEach(o => {
    if (o.registeredBy) {
      staffCounts[o.registeredBy] = (staffCounts[o.registeredBy] || 0) + 1;
    }
  });
  
  const topStaff = Object.entries(staffCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Turmas Mais Elogiadas
  const filteredPraisesForRanking = praises.filter(p => {
    if (p.archived) return false;
    const defaultDate = new Date(p.date);
    const monthIndex = parseInt(p.date.split('-')[1]) - 1; 
    const month = months[monthIndex] || months[defaultDate.getMonth()];
    const student = students.find(s => s.id === p.studentId);
    const matchMonth = selectedMonth === 'Todos os meses' || selectedMonth === '' || month.toLowerCase() === selectedMonth.toLowerCase();
    const matchClass = selectedClass === 'Todas as turmas' || selectedClass === '' || (student && student.class.toLowerCase() === selectedClass.toLowerCase());
    return matchMonth && matchClass;
  });

  const praisedClassesCounts: Record<string, number> = {};
  filteredPraisesForRanking.forEach(p => {
    const student = students.find(s => s.id === p.studentId);
    if (student) {
      praisedClassesCounts[student.class] = (praisedClassesCounts[student.class] || 0) + 1;
    }
  });
  
  const topPraisedClasses = Object.entries(praisedClassesCounts)
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#5e6ad2]">Painel de Comportamento</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Comportamento & Rankings</h1>
            <p className="text-slate-500 text-sm mt-1">Visão integrada de notas comportamentais e listas de destaque</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <div className="relative flex-1 md:flex-none w-full md:w-48">
              <SearchableSelect
                options={[
                  { value: 'Todas as turmas', label: 'Todas as turmas' },
                  ...classes.map(c => ({ value: c, label: c }))
                ]}
                value={selectedClass}
                onChange={setSelectedClass}
                placeholder="Pesquisar Turma..."
                heightClass="py-2 text-sm"
              />
            </div>
            
            <div className="relative flex-1 md:flex-none w-full md:w-48">
              <SearchableSelect
                options={[
                  { value: 'Todos os meses', label: 'Todos os meses' },
                  ...months.map(m => ({ value: m, label: m }))
                ]}
                value={selectedMonth}
                onChange={setSelectedMonth}
                placeholder="Pesquisar Mês..."
                heightClass="py-2 text-sm"
              />
            </div>

            <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 md:flex-none h-[38px]">
              <option>2026</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a1f2e] border border-emerald-200 dark:border-[#12281e] shadow-sm border-t-4 border-t-emerald-500 dark:border-t-emerald-600 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.bom}</p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Bom/Ótimo (≥ 7.5)</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#1a1f2e] border border-amber-200 dark:border-[#2e2612] shadow-sm border-t-4 border-t-amber-500 dark:border-t-amber-600 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.regular}</p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Regular (5.0 a 7.4)</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1f2e] border border-rose-200 dark:border-[#2b1616] shadow-sm border-t-4 border-t-rose-500 dark:border-t-rose-600 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.irregular}</p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Irregular (&lt; 5.0)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          
          {/* Main Comportamento Area (Span 2) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
             <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Activity className="text-blue-500 w-5 h-5"/>
                  <h3 className="font-bold text-slate-800">Comportamento Geral</h3>
                </div>
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>
              
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold z-10">
                    <tr>
                      <th className="px-6 py-3 font-medium w-12">#</th>
                      <th className="px-6 py-3 font-medium">Aluno</th>
                      <th className="px-6 py-3 font-medium">Turma</th>
                      <th className="px-6 py-3 font-medium text-center">Descontos</th>
                      <th className="px-6 py-3 font-medium text-center">Nota Final</th>
                      <th className="px-6 py-3 font-medium text-right">Classificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          Nenhum aluno encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, index) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 text-slate-500 w-10">{index + 1}</td>
                          <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                              {s.name.charAt(0)}
                            </div>
                            {s.name}
                          </td>
                          <td className="px-6 py-4">{s.class}</td>
                          <td className="px-6 py-4 text-center">
                            {s.deductions > 0 ? <span className="text-red-500 font-medium">-{s.deductions.toFixed(1)}</span> : '-'}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800">
                            {s.points.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={'inline-flex items-center px-2 py-1 rounded text-xs font-semibold ' + s.classColor}>
                              <div className={'w-1.5 h-1.5 rounded-full mr-1.5 ' + (s.points >= 7.5 ? 'bg-emerald-500' : s.points >= 5.0 ? 'bg-amber-500' : 'bg-rose-500')}></div>
                              {s.classification}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 10 Alunos */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Trophy className="text-blue-500 w-5 h-5"/>
                  <h3 className="font-bold text-slate-800">Desempenho (Rankings)</h3>
                </div>
                <div className="relative w-full sm:w-auto text-sm">
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full appearance-none"
                  >
                    <option value="melhores">Maiores Notas</option>
                    <option value="piores">Menores Notas</option>
                    <option value="ocorrencias">Mais Ocorrências</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold z-10">
                    <tr>
                      <th className="px-6 py-3 font-medium w-12">Rank</th>
                      <th className="px-6 py-3 font-medium">Aluno</th>
                      <th className="px-6 py-3 font-medium">Turma</th>
                      <th className="px-6 py-3 font-medium w-32">
                        {filterType === 'ocorrencias' ? 'Ocorrências' : 'Nota'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {sortedStudents.slice(0, 10).map((s, index) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{s.name}</td>
                        <td className="px-6 py-4 text-slate-500">{s.class}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 text-lg">
                          {filterType === 'ocorrencias' ? s.occurrencesCount : s.points.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Side Info Area */}
          <div className="flex flex-col gap-6">
            
            {/* Top 10 Ocurrences */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-slate-800 font-bold flex-1">Infrações Recorrentes</h3>
              </div>
              
              <div className="space-y-4 mt-6">
                {ruleCounts.map((r, i) => (
                  <div key={r.code} className="flex gap-4 items-start border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <span className="text-slate-400 font-bold text-sm w-4 mt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-slate-800 text-sm font-medium mb-1 line-clamp-2">{r.description}</p>
                      <span className={'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ' + (r.severity === 'Leve' ? 'bg-slate-100 text-slate-700' : r.severity === 'Media' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}>
                        {r.severity}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800">{r.count}x</span>
                    </div>
                  </div>
                ))}
                {ruleCounts.length === 0 && (
                  <p className="text-slate-500 text-sm italic">Nenhuma ocorrência registrada no período.</p>
                )}
              </div>
            </div>

            {/* Top Turmas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="text-slate-800 font-bold flex-1">Ocorrências por Turma</h3>
              </div>
              
              <div className="space-y-5">
                {topClasses.map((t, i) => {
                  const maxCount = topClasses[0]?.count || 1;
                  const percentage = (t.count / maxCount) * 100;
                  return (
                    <div key={t.className} className="flex gap-4 items-center">
                      <span className="text-slate-400 font-bold text-sm w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-slate-800 font-medium text-sm">{t.className}</span>
                          <span className="text-xs text-slate-500 font-bold">{t.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {topClasses.length === 0 && (
                  <p className="text-slate-500 text-sm italic">Nenhuma turma com ocorrências.</p>
                )}
              </div>
            </div>

            {/* Top 10 Professores */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-indigo-500" />
                <h3 className="text-slate-800 font-bold flex-1">Agentes Disciplinares (Top 10)</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">Professores que mais registraram ocorrências</p>
              
              <div className="space-y-4">
                {topStaff.map((s, i) => (
                  <div key={s.name} className="flex gap-4 items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-slate-400 font-bold text-sm w-4">{i + 1}</span>
                    <div className="flex-1">
                      <span className="text-slate-800 font-medium text-sm">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800">{s.count}x</span>
                    </div>
                  </div>
                ))}
                {topStaff.length === 0 && (
                  <p className="text-slate-500 text-sm italic">Nenhum registro de equipe.</p>
                )}
              </div>
            </div>

            {/* Turmas Mais Elogiadas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-amber-500" />
                <h3 className="text-slate-800 font-bold flex-1">Turmas Exemplares (Elogios)</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">Turmas com maior quantidade de elogios</p>
              
              <div className="space-y-4">
                {topPraisedClasses.map((t, i) => (
                  <div key={t.className} className="flex gap-4 items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-slate-400 font-bold text-sm w-4">{i + 1}</span>
                    <div className="flex-1">
                      <span className="text-slate-800 font-medium text-sm">{t.className}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-500 mr-1">+</span>
                      <span className="text-sm font-bold text-slate-800">{t.count}</span>
                    </div>
                  </div>
                ))}
                {topPraisedClasses.length === 0 && (
                  <p className="text-slate-500 text-sm italic">Nenhum elogio registrado para turmas.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function Comportamento() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div></AppShell>}>
      <ComportamentoContent />
    </Suspense>
  );
}
