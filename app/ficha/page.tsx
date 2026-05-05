'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { FileBadge, Search, Printer, Brain, X, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { streamAI } from '@/components/AIChat';
import SearchableSelect from '@/components/SearchableSelect';
import { getSchoolHeaderHTML, getSchoolFooterHTML, SCHOOL_HEADER_CSS } from '@/lib/print-header';

export default function FichaDisciplinar() {
  const { students, getStudentPoints, getStudentOccurrences, rules } = useAppContext();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const student = students.find(s => s.id === selectedStudent);
  const occurrences = student ? getStudentOccurrences(student.id) : [];

  const handlePrintFicha = () => {
    if (!student) return;

    const occurrencesRows = occurrences.length === 0
      ? '<tr><td colspan="5" style="border: 1px solid #000; padding: 12px; text-align: center; font-style: italic;">Nenhuma ocorrência registrada no histórico deste aluno.</td></tr>'
      : occurrences.map(o => {
          const rule = rules.find(r => r.code === o.ruleCode);
          return `<tr>
            <td style="border: 1px solid #000; padding: 6px;">${formatDate(o.date)}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${o.ruleCode}</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 8pt;">${rule?.description || '-'}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; white-space: nowrap;">${rule?.severity || '-'} (${rule?.points || 0})</td>
            <td style="border: 1px solid #000; padding: 6px; font-size: 8pt;">${o.registeredBy || '-'}</td>
          </tr>`;
        }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Ficha Disciplinar - ${student.name}</title>
  <style>
    ${SCHOOL_HEADER_CSS}

    body {
      border-left: none !important;
      padding-left: 0 !important;
    }

    .ficha-titulo {
      text-align: center;
      margin: 16px 0 24px 0;
    }
    .ficha-titulo h2 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      color: #1a237e;
    }
    .ficha-titulo h3 {
      font-size: 11pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 0;
    }

    .dados-aluno {
      border: 2px solid #000;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      font-size: 10pt;
      text-transform: uppercase;
      font-weight: 600;
    }
    .dados-aluno .nota {
      font-size: 16pt;
      font-weight: bold;
      color: #1a237e;
    }

    .secao-titulo {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    th {
      background: #e2e8f0;
      border: 1px solid #000;
      padding: 8px 6px;
      text-align: left;
      text-transform: uppercase;
      font-size: 8pt;
      font-weight: bold;
    }
    th.center { text-align: center; }

    .assinaturas {
      display: flex;
      justify-content: space-around;
      margin-top: 60px;
      padding-top: 40px;
    }
    .assinatura-box {
      text-align: center;
    }
    .assinatura-linha {
      width: 200px;
      border-bottom: 1px solid #000;
      margin-bottom: 6px;
    }
    .assinatura-label {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  ${getSchoolHeaderHTML()}

  <div class="ficha-titulo">
    <h2>Ficha Disciplinar Individual</h2>
    <h3>ANEXO II</h3>
  </div>

  <div class="dados-aluno">
    <div>NOME: ${student.name}</div>
    <div>TURMA: ${student.class}</div>
    <div>TURNO: ${student.shift}</div>
    <div>NOTA ATUAL: <span class="nota">${getStudentPoints(student.id).toFixed(1)}</span></div>
  </div>

  <div class="secao-titulo">Histórico de Ocorrências</div>

  <table>
    <thead>
      <tr>
        <th style="width: 70px;">Data</th>
        <th style="width: 50px;" class="center">Art.</th>
        <th>Falta/Infração</th>
        <th style="width: 90px;" class="center">Grav./Pontos</th>
        <th style="width: 120px;">Registrado Por</th>
      </tr>
    </thead>
    <tbody>
      ${occurrencesRows}
    </tbody>
  </table>

  <div class="assinaturas">
    <div class="assinatura-box">
      <div class="assinatura-linha"></div>
      <div class="assinatura-label">Assinatura do Aluno</div>
    </div>
    <div class="assinatura-box">
      <div class="assinatura-linha"></div>
      <div class="assinatura-label">Assinatura do Gestor</div>
    </div>
  </div>

  ${getSchoolFooterHTML()}
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  const handleAnalyzeStudent = async () => {
    if (!student || occurrences.length === 0) return;
    setIsAnalyzing(true);
    setShowAnalysis(true);
    setAnalysisResult('');
    try {
      const occurrencesSummary = occurrences.map(o => {
        const rule = rules.find(r => r.code === o.ruleCode);
        return '- ' + formatDate(o.date) + ': Art. ' + o.ruleCode + ' - ' + (rule?.description || 'Desconhecida') + ' (' + (rule?.severity || '-') + ')';
      }).join('\n');

      await streamAI(
        'analise',
        {
          studentName: student.name,
          class: student.class,
          totalOccurrences: occurrences.length,
          currentPoints: getStudentPoints(student.id).toFixed(1),
          occurrences: occurrencesSummary,
        },
        (delta) => setAnalysisResult(prev => prev + delta)
      );
    } catch (error) {
      setAnalysisResult('Não foi possível gerar a análise no momento. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <FileBadge className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Anexo II</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Ficha Disciplinar do Aluno</h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <label className="block text-sm font-medium text-slate-600 mb-2">Selecione o Aluno</label>
          <SearchableSelect
            options={students.map(s => ({ value: s.id, label: s.name + ' - ' + s.class + ' (' + s.shift + ')' }))}
            value={selectedStudent}
            onChange={(val) => {
              if (val) {
                setSelectedStudent(val);
                setShowAnalysis(false);
                setAnalysisResult('');
              }
            }}
            placeholder="Buscar aluno..."
          />
        </div>

        {student && (
          <>
            {/* Botao de Analise IA */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAnalyzeStudent}
                disabled={isAnalyzing || occurrences.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition print:hidden"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {isAnalyzing ? 'Analisando...' : 'Analisar Comportamento com IA'}
              </button>
              {occurrences.length === 0 && (
                <span className="text-xs text-slate-400">Aluno sem ocorrências para analisar</span>
              )}
            </div>

            {/* Resultado da Analise */}
            {showAnalysis && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 relative print:hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-violet-700">
                    <Brain className="w-4 h-4" />
                    <span className="font-semibold text-sm">Análise Comportamental — IA</span>
                  </div>
                  <button onClick={() => setShowAnalysis(false)} className="text-violet-400 hover:text-violet-600 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {isAnalyzing ? (
                  <div className="flex items-center gap-3 text-violet-600 text-sm py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando análise comportamental com DeepSeek...
                  </div>
                ) : (
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{analysisResult}</p>
                )}
              </div>
            )}

            {/* Preview da Ficha */}
            <div className="bg-slate-50 text-slate-900 rounded-xl p-8 max-w-4xl shadow-2xl relative">
              <button
                className="absolute top-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition text-sm"
                onClick={handlePrintFicha}
              >
                <Printer className="w-4 h-4" /> Imprimir Ficha
              </button>

              <div className="text-center mb-8 pr-32">
                <h2 className="font-bold text-lg uppercase text-blue-900">Ficha Disciplinar Individual</h2>
                <h3 className="font-semibold text-md mt-2 underline">ANEXO II</h3>
              </div>

              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4 border-2 border-slate-900 p-4 font-semibold uppercase">
                  <div>NOME: {student.name}</div>
                  <div>TURMA: {student.class}</div>
                  <div>TURNO: {student.shift}</div>
                  <div>NOTA ATUAL: <span className="text-xl text-blue-900 font-bold">{getStudentPoints(student.id).toFixed(1)}</span></div>
                </div>

                <h4 className="font-bold uppercase border-b-2 border-slate-900 pb-1 mt-6">Histórico de Ocorrências</h4>

                <table className="w-full border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-200 uppercase text-xs">
                      <th className="border border-slate-900 p-2 text-left w-24">Data</th>
                      <th className="border border-slate-900 p-2 text-center w-16">Art.</th>
                      <th className="border border-slate-900 p-2 text-left">Falta/Infração</th>
                      <th className="border border-slate-900 p-2 text-center w-24">Grav./Pontos</th>
                      <th className="border border-slate-900 p-2 text-left">Registrado Por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occurrences.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border border-slate-900 p-4 text-center italic">
                          Nenhuma ocorrência registrada no histórico deste aluno.
                        </td>
                      </tr>
                    ) : (
                      occurrences.map(o => {
                        const rule = rules.find(r => r.code === o.ruleCode);
                        return (
                          <tr key={o.id}>
                            <td className="border border-slate-900 p-2">{formatDate(o.date)}</td>
                            <td className="border border-slate-900 p-2 text-center">{o.ruleCode}</td>
                            <td className="border border-slate-900 p-2 text-xs">{rule?.description}</td>
                            <td className="border border-slate-900 p-2 text-center whitespace-nowrap">
                              {rule?.severity} ({rule?.points})
                            </td>
                            <td className="border border-slate-900 p-2 text-xs">{o.registeredBy}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="mt-16 pt-8 flex justify-around text-center">
                  <div>
                    <div className="w-52 border-b border-slate-900 mb-2"></div>
                    <p className="font-bold uppercase text-xs">Assinatura do Aluno</p>
                  </div>
                  <div>
                    <div className="w-52 border-b border-slate-900 mb-2"></div>
                    <p className="font-bold uppercase text-xs">Assinatura do Gestor</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
