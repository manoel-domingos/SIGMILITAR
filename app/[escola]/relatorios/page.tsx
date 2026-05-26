'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { FileText, Printer, Download, Brain, X, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { formatDate } from '@/lib/utils';
import { streamAI } from '@/components/AIChat';
import { useRouter } from 'next/navigation';

export default function Relatorios() {
  const { students, occurrences, rules, currentUserRole } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (currentUserRole === 'PROFESSOR') {
      router.push('/configuracoes?tab=reports_prof');
    }
  }, [currentUserRole, router]);

  const [activeTab, setActiveTab] = useState('gerencial');
  const [selectedMonth, setSelectedMonth] = useState('Todos os meses');
  const [selectedClass, setSelectedClass] = useState('Todas as turmas');
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showAiReport, setShowAiReport] = useState(false);

  if (currentUserRole === 'PROFESSOR') {
    return null;
  }

  // Determina a severity de uma ocorrência pelo primeiro ruleCode válido
  const getOccurrenceSeverity = (o: { ruleCode?: number; ruleCodes?: number[] }): string => {
    const codes = (o.ruleCodes && o.ruleCodes.length > 0) ? o.ruleCodes : (o.ruleCode ? [o.ruleCode] : []);
    for (const code of codes) {
      const rule = rules.find(r => r.code === code);
      if (rule?.severity) return rule.severity;
    }
    return '';
  };

  const leves  = occurrences.filter(o => getOccurrenceSeverity(o) === 'Leve').length;
  const medias = occurrences.filter(o => getOccurrenceSeverity(o) === 'Media').length;
  const graves = occurrences.filter(o => getOccurrenceSeverity(o) === 'Grave').length;

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const classes = Array.from(new Set(students.map(s => s.class))).sort();

  const handleGenerateAiReport = async () => {
    setIsGeneratingReport(true);
    setShowAiReport(true);
    setAiReport('');
    try {
      // Distribuição de gravidade — usa variáveis já computadas no componente

      // Infrações mais comuns
      const ruleCount: Record<number, number> = {};
      occurrences.forEach(o => { ruleCount[o.ruleCode] = (ruleCount[o.ruleCode] || 0) + 1; });
      const topInfractions = Object.entries(ruleCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([code, count]) => {
          const rule = rules.find(r => r.code === parseInt(code));
          return 'Art. ' + code + ': ' + (rule?.description?.substring(0, 50) || 'Desconhecida') + ' (' + count + 'x)';
        }).join('\n');

      // Turmas com mais ocorrencias
      const classCount: Record<string, number> = {};
      occurrences.forEach(o => {
        const student = students.find(s => s.id === o.studentId);
        if (student?.class) classCount[student.class] = (classCount[student.class] || 0) + 1;
      });
      const topClasses = Object.entries(classCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([cls, count]) => cls + ': ' + count + ' ocorr\u00eancia(s)').join(', ');

      const studentsWithOccurrences = new Set(occurrences.map(o => o.studentId)).size;

      await streamAI(
        'relatorio',
        {
          period: selectedMonth !== 'Todos os meses' ? selectedMonth : 'Geral',
          totalOccurrences: occurrences.length,
          studentsWithOccurrences,
          topInfractions,
          topClasses: topClasses || 'Sem dados',
          severityDistribution: 'Leves: ' + leves + ', M\u00e9dias: ' + medias + ', Graves: ' + graves,
        },
        (delta) => setAiReport(prev => prev + delta)
      );
    } catch {
      setAiReport('Não foi possível gerar o relatório no momento. Tente novamente.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <AppShell>
      {/* Cabeçalho e rodapé visíveis apenas na impressão */}
      <style>{`
        @media print {
          .print-header { display: block !important; }
          .print-footer { display: block !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="print-header hidden border-y-2 border-black py-2 mb-5 text-center leading-6">
        <p className="text-[10pt] uppercase tracking-wide">GOVERNO DO ESTADO DE MATO GROSSO</p>
        <p className="text-[10pt] uppercase tracking-wide">SECRETARIA DE ESTADO DE EDUCAÇÃO</p>
        <p className="text-[13pt] font-bold uppercase tracking-widest">ESCOLA ESTADUAL CÍVICO-MILITAR</p>
        <p className="text-[13pt] font-bold uppercase tracking-widest">PROF. JOÃO BATISTA</p>
      </div>

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
        <div className="flex gap-6 border-b border-slate-200 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide">
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
        <div className="flex flex-wrap gap-4">
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
          
          {/* Header Image */}
          <div className="mb-12 w-[160%] -ml-[30%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/CABEÇALHO JB.svg" alt="Cabeçalho Oficial" className="w-full h-auto" />
          </div>

          <div className="border border-slate-900 rounded p-4 mb-8 text-center bg-slate-50 print:bg-white">
            <h1 className="font-bold text-lg uppercase tracking-wider mb-1">
              {activeTab === 'gerencial' ? 'Relatório de Gestão Disciplinar' : 
               activeTab === 'registro' ? 'Relatório de Registros Disciplinares' : 
               'Ficha Individual do Aluno'}
            </h1>
            <p className="text-sm">Período: Abril de 2026 - Turno: Todos os turnos - Turma: Todas as turmas</p>
          </div>

          {activeTab === 'gerencial' || activeTab === 'registro' ? (
            <div className="space-y-6">
              <h4 className="font-bold italic underline mb-4">1. RESUMO ANALÍTICO</h4>
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-900 text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Total de Ocorrências</td>
                      <td className="border border-slate-900 p-2 text-center w-32 font-bold">{occurrences.length}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Leves</td>
                      <td className="border border-slate-900 p-2 text-center w-32">{leves}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Médias</td>
                      <td className="border border-slate-900 p-2 text-center w-32">{medias}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Graves</td>
                      <td className="border border-slate-900 p-2 text-center w-32">{graves}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-medium">Alunos em Acompanhamento (Nota &lt; 5.0)</td>
                      <td className="border border-slate-900 p-2 text-center w-32">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="font-bold italic underline mt-8 mb-4">2. DETALHAMENTO DE OCORRÊNCIAS</h4>
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-900 text-sm whitespace-nowrap sm:whitespace-normal">
                <thead>
                  <tr className="bg-slate-200 print:bg-slate-100">
                    <th className="border border-slate-900 p-2 text-left">Data</th>
                    <th className="border border-slate-900 p-2 text-left">Aluno</th>
                    <th className="border border-slate-900 p-2 text-left">Turma</th>
                    <th className="border border-slate-900 p-2 text-left">Infração</th>
                  </tr>
                </thead>
                <tbody>
                  {occurrences.slice(0,10).map((o, i) => {
                    const student = students.find(s => s.id === o.studentId);
                    return (
                      <tr key={i}>
                        <td className="border border-slate-900 p-2 w-24">{formatDate(o.date)}</td>
                        <td className="border border-slate-900 p-2">{student?.name}</td>
                        <td className="border border-slate-900 p-2 w-20">{student?.class}</td>
                        <td className="border border-slate-900 p-2 truncate max-w-[200px]">Cód. {o.ruleCode}</td>
                      </tr>
                    );
                  })}
                  {occurrences.length === 0 && (
                    <tr>
                      <td colSpan={4} className="border border-slate-900 p-4 text-center">Sem dados no período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
              <div className="pt-20 text-center flex flex-col items-center">
                <div className="w-64 border-b border-slate-900 mb-2"></div>
                <p className="text-sm font-bold">Gestor Escolar Responsável</p>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500 italic">
              Esta aba exibe a ficha individual completa de um aluno específico, incluindo todos os registros comportamentais e ocorrências listadas cronologicamente. Selecione um aluno no filtro acima.
            </div>
          )}

        </div>
      </div>

      <div className="print-footer hidden border-t border-gray-400 pt-2 mt-6 text-center text-[8.5pt] text-gray-500 leading-6">
        <p>E.E Cívico-Militar Heliodoro Capistrano</p>
        <p>(65) 3329-1021 | (65) 99944-6304</p>
        <p>Av. Ismael José do Nascimento nº 892-N Jardim Europa — CEP 78.300-152 – TANGARÁ DA SERRA/MT</p>
        <p>escola.16020@edu.mt.gov.br</p>
      </div>
    </AppShell>
  );
}
