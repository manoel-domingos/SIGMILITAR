'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { FileText, Printer, Brain, X, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { formatDate } from '@/lib/utils';
import { streamAI } from '@/components/AIChat';
import { useRouter } from 'next/navigation';
import { getSchoolHeaderHTML, getSchoolFooterHTML } from '@/lib/print-header';

export default function Relatorios() {
  const { students, occurrences, rules, currentUserRole, activeSchoolContext, getStudentPoints, getStudentOccurrences } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (currentUserRole === 'PROFESSOR') {
      router.push('/configuracoes?tab=reports_prof');
    }
  }, [currentUserRole, router]);

  const [activeTab, setActiveTab] = useState('gerencial');
  const [selectedMonth, setSelectedMonth] = useState('Todos os meses');
  const [selectedClass, setSelectedClass] = useState('Todas as turmas');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showAiReport, setShowAiReport] = useState(false);

  // Sincroniza o seletor de estudante com o filtro de turma
  useEffect(() => {
    if (selectedClass !== 'Todas as turmas' && selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student && student.class !== selectedClass) {
        setSelectedStudentId('');
      }
    }
  }, [selectedClass, selectedStudentId, students]);

  if (currentUserRole === 'PROFESSOR') {
    return null;
  }

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const classes = Array.from(new Set(students.map(s => s.class))).sort();

  // Filtragem de ocorrências por turma e mês
  const filteredOccurrences = occurrences.filter(o => {
    // Filtragem por turma
    const student = students.find(s => s.id === o.studentId);
    if (selectedClass !== 'Todas as turmas' && student?.class !== selectedClass) {
      return false;
    }

    // Filtragem por mês
    if (selectedMonth !== 'Todos os meses') {
      if (!o.date) return false;
      const dateParts = o.date.split('-');
      if (dateParts.length < 2) return false;
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const occurrenceMonth = months[monthIndex];
      if (occurrenceMonth !== selectedMonth) {
        return false;
      }
    }

    return true;
  });

  // Determina a severity de uma ocorrência pelo primeiro ruleCode válido
  const getOccurrenceSeverity = (o: { ruleCode?: number; ruleCodes?: number[] }): string => {
    const codes = (o.ruleCodes && o.ruleCodes.length > 0) ? o.ruleCodes : (o.ruleCode ? [o.ruleCode] : []);
    for (const code of codes) {
      const rule = rules.find(r => r.code === code);
      if (rule?.severity) return rule.severity;
    }
    return '';
  };

  const leves  = filteredOccurrences.filter(o => getOccurrenceSeverity(o) === 'Leve').length;
  const medias = filteredOccurrences.filter(o => getOccurrenceSeverity(o) === 'Media').length;
  const graves = filteredOccurrences.filter(o => getOccurrenceSeverity(o) === 'Grave').length;

  // Top 5 infrações no conjunto filtrado
  const ruleCount: Record<number, number> = {};
  filteredOccurrences.forEach(o => {
    if (o.ruleCode) {
      ruleCount[o.ruleCode] = (ruleCount[o.ruleCode] || 0) + 1;
    }
  });
  const topInfractions = Object.entries(ruleCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => {
      const rule = rules.find(r => r.code === parseInt(code, 10));
      return {
        code: parseInt(code, 10),
        description: rule?.description || 'Infração desconhecida',
        severity: rule?.severity || 'Leve',
        count
      };
    });

  // Top turmas no conjunto filtrado
  const classCount: Record<string, number> = {};
  filteredOccurrences.forEach(o => {
    const student = students.find(s => s.id === o.studentId);
    if (student?.class) {
      classCount[student.class] = (classCount[student.class] || 0) + 1;
    }
  });
  const topClasses = Object.entries(classCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([className, count]) => ({ className, count }));

  const handleGenerateAiReport = async () => {
    setIsGeneratingReport(true);
    setShowAiReport(true);
    setAiReport('');
    try {
      const topInfractionsStr = topInfractions
        .map(i => `Art. ${i.code}: ${i.description.substring(0, 50)} (${i.count}x)`)
        .join('\n');

      const topClassesStr = topClasses
        .map(c => `${c.className}: ${c.count} ocorrência(s)`)
        .join(', ');

      const studentsWithOccurrences = new Set(filteredOccurrences.map(o => o.studentId)).size;

      await streamAI(
        'relatorio',
        {
          period: selectedMonth !== 'Todos os meses' ? selectedMonth : 'Geral',
          totalOccurrences: filteredOccurrences.length,
          studentsWithOccurrences,
          topInfractions: topInfractionsStr || 'Sem infrações',
          topClasses: topClassesStr || 'Sem dados',
          severityDistribution: `Leves: ${leves}, Médias: ${medias}, Graves: ${graves}`,
        },
        (delta) => setAiReport(prev => prev + delta),
        undefined,
        activeSchoolContext
      );
    } catch {
      setAiReport('Não foi possível gerar o relatório no momento. Tente novamente.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Carrega informações do aluno selecionado na Ficha Individual
  const selectedStudent = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;
  const studentOccurrences = selectedStudent ? getStudentOccurrences(selectedStudent.id) : [];

  const points = selectedStudent ? getStudentPoints(selectedStudent.id) : 10;
  let behaviorClass = '';
  let behaviorColor = '';
  if (points >= 7.5) {
    behaviorClass = 'Bom/Ótimo';
    behaviorColor = 'text-emerald-700 bg-emerald-100';
  } else if (points >= 5.0) {
    behaviorClass = 'Regular';
    behaviorColor = 'text-amber-700 bg-amber-100';
  } else {
    behaviorClass = 'Irregular';
    behaviorColor = 'text-rose-700 bg-rose-100';
  }

  return (
    <AppShell>
      {/* Estilos para impressão e pré-visualização responsiva */}
      <style>{`
        /* Estilos do cabeçalho oficial dinâmico */
        .cabecalho-oficial {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #1a237e;
          font-family: 'Times New Roman', Times, serif;
          text-align: center;
        }
        @media (min-width: 640px) {
          .cabecalho-oficial {
            display: grid;
            grid-template-columns: 200px 1fr 112px;
            text-align: center;
            gap: 10px;
            padding-bottom: 6px;
          }
        }
        .cab-logo-seduc {
          height: auto;
          width: 180px;
          max-height: 60px;
          display: block;
          object-fit: contain;
        }
        @media (min-width: 640px) {
          .cab-logo-seduc {
            width: 200px;
            max-height: 72px;
            object-position: left center;
          }
        }
        .cab-logo-escola {
          height: 80px;
          width: 80px;
          object-fit: contain;
        }
        @media (min-width: 640px) {
          .cab-logo-escola {
            height: 112px;
            width: 112px;
            object-position: right center;
          }
        }
        .cab-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          line-height: 1.4;
        }
        .cab-escola {
          font-size: 8pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #000;
        }
        @media (min-width: 640px) {
          .cab-escola {
            font-size: 10pt;
          }
        }

        .rodape-oficial {
          border-top: 2px solid #1a237e;
          padding-top: 8px;
          margin-top: 40px;
          text-align: right;
          font-size: 8pt;
          color: #1a237e;
          line-height: 1.45;
          font-family: 'Times New Roman', Times, serif;
        }

        @media print {
          .print\\:hidden { display: none !important; }
          body {
            background-color: white !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Documentos Oficiais</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
            <p className="text-slate-500 text-sm">Selecione o tipo de relatório e use os filtros</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleGenerateAiReport}
              disabled={isGeneratingReport}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition text-sm print:hidden"
            >
              {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {isGeneratingReport ? 'Gerando...' : 'Relatório com IA'}
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition w-full sm:w-auto"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide print:hidden">
          <button 
            className={'pb-3 text-sm font-medium transition-colors relative ' + (activeTab === 'gerencial' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-600')}
            onClick={() => setActiveTab('gerencial')}
          >
            Gerencial Mensal
            {activeTab === 'gerencial' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
          </button>
          <button 
            className={'pb-3 text-sm font-medium transition-colors relative ' + (activeTab === 'registro' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-600')}
            onClick={() => setActiveTab('registro')}
          >
            Registro Disciplinar
            {activeTab === 'registro' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
          </button>
          <button 
            className={'pb-3 text-sm font-medium transition-colors relative ' + (activeTab === 'ficha' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-600')}
            onClick={() => setActiveTab('ficha')}
          >
            Ficha Individual
            {activeTab === 'ficha' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 print:hidden">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Turma</label>
            <SearchableSelect
               options={[
                 { value: 'Todas as turmas', label: 'Todas as turmas' },
                 ...classes.map(c => ({ value: c, label: c }))
               ]}
               value={selectedClass}
               onChange={setSelectedClass}
               placeholder="Pesquisar Turma..."
               heightClass="py-1.5 text-sm"
             />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Turno</label>
            <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Todos</option>
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Mês</label>
            <SearchableSelect
              options={[
                { value: 'Todos os meses', label: 'Todos os meses' },
                ...months.map(m => ({ value: m, label: m }))
              ]}
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="Pesquisar Mês..."
              heightClass="py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
             <label className="block text-xs font-medium text-slate-500 mb-1">Ano</label>
             <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none">
               <option>2026</option>
             </select>
          </div>
          {activeTab === 'ficha' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Aluno *</label>
              <SearchableSelect
                options={students
                  .filter(s => selectedClass === 'Todas as turmas' || s.class === selectedClass)
                  .map(s => ({ value: s.id, label: `${s.name} - ${s.class}` }))
                }
                value={selectedStudentId}
                onChange={setSelectedStudentId}
                placeholder="Selecione o Aluno..."
                heightClass="py-1.5 text-sm"
              />
            </div>
          )}
        </div>

        {/* Painel IA */}
        {showAiReport && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 print:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-violet-700">
                <Brain className="w-4 h-4" />
                <span className="font-semibold text-sm">Relatório Gerado por IA — DeepSeek</span>
              </div>
              <button onClick={() => setShowAiReport(false)} className="text-violet-400 hover:text-violet-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {isGeneratingReport ? (
              <div className="flex items-center gap-3 text-violet-600 text-sm py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analisando dados disciplinares com DeepSeek...
              </div>
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{aiReport}</p>
            )}
          </div>
        )}

        {/* Report Preview */}
        <div className="bg-[#e2e8f0] rounded-xl p-4 sm:p-8 max-w-4xl mx-auto shadow-2xl print:bg-white print:p-0 print:shadow-none min-h-[800px] text-slate-900 font-serif">
          
          {/* Header Oficial Dinâmico */}
          <div
            className="mb-8"
            dangerouslySetInnerHTML={{ __html: getSchoolHeaderHTML(activeSchoolContext ?? undefined) }}
          />

          <div className="border border-slate-900 rounded p-4 mb-8 text-center bg-slate-50 print:bg-white">
            <h1 className="font-bold text-lg uppercase tracking-wider mb-1">
              {activeTab === 'gerencial' ? 'Relatório de Gestão Disciplinar' : 
               activeTab === 'registro' ? 'Relatório de Registros Disciplinares' : 
               'Ficha Disciplinar Individual'}
            </h1>
            <p className="text-sm">
              Período: {selectedMonth !== 'Todos os meses' ? selectedMonth : 'Geral'} de 2026 - Turno: Todos os turnos - Turma: {selectedClass}
            </p>
          </div>

          {activeTab === 'gerencial' && (
            <div className="space-y-6">
              <h4 className="font-bold italic underline mb-4 uppercase">1. Resumo Analítico</h4>
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-900 text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Total de Ocorrências</td>
                      <td className="border border-slate-900 p-2 text-center w-32 font-bold">{filteredOccurrences.length}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Leves</td>
                      <td className="border border-slate-900 p-2 text-center w-32 text-slate-700">{leves}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Médias</td>
                      <td className="border border-slate-900 p-2 text-center w-32 text-slate-700">{medias}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Graves</td>
                      <td className="border border-slate-900 p-2 text-center w-32 text-slate-700">{graves}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Alunos Distintos Notificados</td>
                      <td className="border border-slate-900 p-2 text-center w-32">
                        {new Set(filteredOccurrences.map(o => o.studentId)).size}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="font-bold italic underline mt-8 mb-4 uppercase">2. Infrações Recorrentes (Top 5)</h4>
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-900 text-sm">
                  <thead>
                    <tr className="bg-slate-100 uppercase text-xs">
                      <th className="border border-slate-900 p-2 text-left w-24">Código</th>
                      <th className="border border-slate-900 p-2 text-left">Falta/Infração</th>
                      <th className="border border-slate-900 p-2 text-center w-24">Gravidade</th>
                      <th className="border border-slate-900 p-2 text-center w-20">Registros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topInfractions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="border border-slate-900 p-4 text-center italic">Nenhuma infração registrada no período.</td>
                      </tr>
                    ) : (
                      topInfractions.map((inf, i) => (
                        <tr key={i}>
                          <td className="border border-slate-900 p-2 font-bold">Art. {inf.code}</td>
                          <td className="border border-slate-900 p-2 text-xs">{inf.description}</td>
                          <td className="border border-slate-900 p-2 text-center text-xs font-semibold">{inf.severity}</td>
                          <td className="border border-slate-900 p-2 text-center font-bold">{inf.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <h4 className="font-bold italic underline mt-8 mb-4 uppercase">3. Turmas com Maior Índice de Registros</h4>
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-900 text-sm">
                  <thead>
                    <tr className="bg-slate-100 uppercase text-xs">
                      <th className="border border-slate-900 p-2 text-left w-12">#</th>
                      <th className="border border-slate-900 p-2 text-left">Turma</th>
                      <th className="border border-slate-900 p-2 text-center w-32">Total Ocorrências</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClasses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="border border-slate-900 p-4 text-center italic">Sem turmas registradas.</td>
                      </tr>
                    ) : (
                      topClasses.map((tc, i) => (
                        <tr key={i}>
                          <td className="border border-slate-900 p-2 text-slate-500">#{i + 1}</td>
                          <td className="border border-slate-900 p-2 font-medium">{tc.className}</td>
                          <td className="border border-slate-900 p-2 text-center font-bold">{tc.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-20 text-center flex flex-col items-center">
                <div className="w-64 border-b border-slate-900 mb-2"></div>
                <p className="text-sm font-bold">Gestor Escolar Responsável</p>
              </div>
            </div>
          )}

          {activeTab === 'registro' && (
            <div className="space-y-6">
              <h4 className="font-bold italic underline mb-4 uppercase">Relação de Ocorrências Disciplinares</h4>
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 uppercase text-xs">
                      <th className="border border-slate-900 p-2 text-left w-20">Data</th>
                      <th className="border border-slate-900 p-2 text-left">Aluno</th>
                      <th className="border border-slate-900 p-2 text-left w-16">Turma</th>
                      <th className="border border-slate-900 p-2 text-left">Infração/Fatos</th>
                      <th className="border border-slate-900 p-2 text-left">Medida</th>
                      <th className="border border-slate-900 p-2 text-left">Registrado Por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOccurrences.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-900 p-4 text-center italic">
                          Nenhuma ocorrência encontrada para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredOccurrences.map((o, i) => {
                        const student = students.find(s => s.id === o.studentId);
                        const rule = rules.find(r => r.code === o.ruleCode);
                        return (
                          <tr key={i}>
                            <td className="border border-slate-900 p-2 whitespace-nowrap">{formatDate(o.date)}</td>
                            <td className="border border-slate-900 p-2 font-medium">{student?.name || 'Aluno Desconhecido'}</td>
                            <td className="border border-slate-900 p-2 text-center">{student?.class || '-'}</td>
                            <td className="border border-slate-900 p-2 text-xs">
                              <span className="font-bold">Art. {o.ruleCode}</span> - {rule?.description || 'N/A'}
                            </td>
                            <td className="border border-slate-900 p-2 text-xs">{o.measure || '-'}</td>
                            <td className="border border-slate-900 p-2 text-xs whitespace-nowrap">{o.registeredBy || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-20 text-center flex flex-col items-center">
                <div className="w-64 border-b border-slate-900 mb-2"></div>
                <p className="text-sm font-bold">Responsável pelo Registro</p>
              </div>
            </div>
          )}

          {activeTab === 'ficha' && (
            <div className="space-y-6">
              {selectedStudent ? (
                <>
                  {/* Dados de identificação do aluno */}
                  <div className="grid grid-cols-2 gap-4 border-2 border-slate-900 p-4 font-semibold uppercase text-xs sm:text-sm bg-slate-50 print:bg-white mb-6">
                    <div>NOME: {selectedStudent.name}</div>
                    <div>TURMA: {selectedStudent.class}</div>
                    <div>TURNO: {selectedStudent.shift || 'Não informado'}</div>
                    <div className="flex items-center gap-2">
                      <span>NOTA ATUAL:</span>
                      <span className="text-lg text-blue-900 font-bold">{points.toFixed(1)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${behaviorColor}`}>
                        {behaviorClass}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold italic underline mb-4 uppercase">Histórico Comportamental do Aluno</h4>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full border-collapse border border-slate-900 text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-100 uppercase text-xs">
                          <th className="border border-slate-900 p-2 text-left w-24">Data</th>
                          <th className="border border-slate-900 p-2 text-center w-16">Art.</th>
                          <th className="border border-slate-900 p-2 text-left">Falta/Infração</th>
                          <th className="border border-slate-900 p-2 text-center w-24">Grav./Pontos</th>
                          <th className="border border-slate-900 p-2 text-left">Registrado Por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentOccurrences.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="border border-slate-900 p-4 text-center italic">
                              Nenhuma ocorrência registrada no histórico deste aluno.
                            </td>
                          </tr>
                        ) : (
                          studentOccurrences.map(o => {
                            const rule = rules.find(r => r.code === o.ruleCode);
                            return (
                              <tr key={o.id}>
                                <td className="border border-slate-900 p-2">{formatDate(o.date)}</td>
                                <td className="border border-slate-900 p-2 text-center">{o.ruleCode}</td>
                                <td className="border border-slate-900 p-2 text-xs">{rule?.description || 'N/A'}</td>
                                <td className="border border-slate-900 p-2 text-center whitespace-nowrap text-xs">
                                  {rule?.severity || 'Leve'} (-{rule?.points || 0})
                                </td>
                                <td className="border border-slate-900 p-2 text-xs">{o.registeredBy || '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-16 pt-8 flex justify-around text-center">
                    <div>
                      <div className="w-52 border-b border-slate-900 mb-2"></div>
                      <p className="font-bold uppercase text-[9px] sm:text-xs">Assinatura do Aluno</p>
                    </div>
                    <div>
                      <div className="w-52 border-b border-slate-900 mb-2"></div>
                      <p className="font-bold uppercase text-[9px] sm:text-xs">Assinatura do Gestor</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-center font-medium">Ficha Disciplinar Individual — ANEXO II</p>
                  <p className="text-center text-xs text-slate-400 max-w-md">
                    Selecione um aluno no filtro acima para carregar sua ficha disciplinar completa com histórico de ocorrências e nota de comportamento atualizada.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rodapé Oficial Dinâmico */}
          <div
            className="mt-8"
            dangerouslySetInnerHTML={{ __html: getSchoolFooterHTML(activeSchoolContext ?? undefined) }}
          />

        </div>
      </div>
    </AppShell>
  );
}
