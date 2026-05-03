'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { FileText, Printer, Search, Plus, X, Edit2, Archive } from 'lucide-react';
import { ConductTerm } from '@/lib/data';
import { getLocalDateString, formatDate } from '@/lib/utils';
import { SCHOOL_HEADER_HTML, SCHOOL_FOOTER_HTML, SCHOOL_HEADER_CSS } from '@/lib/print-header';

export default function TermoDeConduta() {
  const { students, conductTerms, addConductTerm, updateConductTerm, archiveConductTerm, currentUserRole } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<string | null>(null);

  // Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [guardianName, setGuardianName] = useState('');
  const [commitments, setCommitments] = useState('');

  const filteredTerms = conductTerms.filter(t => {
    if (t.archived) return false;
    const student = students.find(st => st.id === t.studentId);
    return student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  const openAddModal = () => {
    setEditingTerm(null);
    setSelectedStudent('');
    setDate(getLocalDateString());
    setGuardianName('');
    setCommitments('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: ConductTerm) => {
    setEditingTerm(t.id);
    setSelectedStudent(t.studentId);
    setDate(t.date);
    setGuardianName(t.guardianName);
    setCommitments(t.commitments);
    setIsModalOpen(true);
  };

  const handleArchive = (id: string) => {
    if (confirm('Deseja realmente arquivar este termo?')) {
      archiveConductTerm(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const payload = {
      studentId: selectedStudent,
      date,
      guardianName,
      commitments,
      registeredBy: 'Gestor Escolar'
    };

    if (editingTerm) {
      updateConductTerm(editingTerm, payload);
    } else {
      addConductTerm(payload);
    }

    setIsModalOpen(false);
  };

  const handlePrint = (t: ConductTerm) => {
    const student = students.find(st => st.id === t.studentId);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <h${""}tml lang="pt-BR">
        <head>
          <title>Termo de Conduta - ${student?.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; padding: 18mm 20mm 15mm 20mm; line-height: 1.6; color: #111; }
            ${SCHOOL_HEADER_CSS}
            .doc-titulo { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
            .content { margin-bottom: 40px; text-align: justify; font-size: 11pt; }
            .commitments { background: #f9fafb; padding: 16px; border: 1px solid #ddd; margin-bottom: 30px; }
            .footer { display: flex; flex-direction: column; gap: 36px; margin-top: 60px; }
            .sig-block { display: flex; justify-content: space-between; gap: 24px; }
            .sig-line { border-top: 1px solid #000; flex: 1; padding-top: 6px; font-size: 9pt; text-align: center; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          ${SCHOOL_HEADER_HTML}
          <div class="doc-titulo">TERMO DE ADEQUAÇÃO DE CONDUTA (TAC)</div>
          <div class="content">
            <p>Pelo presente termo, o(a) aluno(a) <strong>${student?.name}</strong>, regularmente matriculado no <strong>${student?.class}</strong>, e seu responsável legal, Sr(a). <strong>${t.guardianName}</strong>, declaram estar cientes das faltas disciplinares cometidas e assumem o compromisso de adequação de conduta conforme as normas do Regimento Escolar.</p>
            <p><strong>Compromissos Assumidos:</strong></p>
            <div class="commitments">${t.commitments}</div>
            <p>O descumprimento deste termo poderá acarretar em medidas disciplinares mais severas, conforme previsto na legislação vigente.</p>
          </div>
          <div class="footer">
            <div class="sig-block">
              <div class="sig-line">Assinatura do Aluno</div>
              <div class="sig-line">Assinatura do Responsável</div>
            </div>
            <div class="sig-block" style="justify-content: center;">
              <div class="sig-line">Gestão Escolar/Militar</div>
            </div>
          </div>
          ${SCHOOL_FOOTER_HTML}
        </body>
      </h${""}tml>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Anexo III</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Termo de Adequação de Conduta</h1>
            <p className="text-slate-500 text-sm">Gerenciamento de termos de conduta (TAC).</p>
          </div>
          {currentUserRole !== 'GUEST' && (
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" /> Novo TAC
            </button>
          )}
        </div>

        {/* List Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Buscar por aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Responsável</th>
                  <th className="px-6 py-3 font-medium">Situação</th>
                  <th className="px-6 py-3 font-medium w-24 text-center"><Printer className="w-4 h-4 mx-auto text-slate-400" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredTerms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                      Nenhum TAC registrado.
                    </td>
                  </tr>
                ) : (
                  filteredTerms.map((t) => {
                    const student = students.find(st => st.id === t.studentId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">{formatDate(t.date)}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{student?.name}</td>
                        <td className="px-6 py-4">{t.guardianName}</td>
                        <td className="px-6 py-4">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">Assinado</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                               onClick={() => handlePrint(t)}
                               className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                               title="Imprimir"
                            >
                               <Printer className="w-4 h-4" />
                            </button>
                            {currentUserRole !== 'GUEST' && (
                              <button 
                                onClick={() => openEditModal(t)}
                                className="p-1.5 text-slate-400 hover:text-blue-500 transition"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-modal max-w-lg w-full flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTerm ? 'Editar TAC' : 'Novo Termo de Conduta (TAC)'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Aluno *</label>
                <select 
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o aluno</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.name} - {st.class}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Data *</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Nome do Responsável *</label>
                  <input 
                    type="text" 
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Compromissos assumidos *</label>
                <textarea 
                  required
                  rows={4}
                  value={commitments}
                  onChange={(e) => {
                    setCommitments(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Liste os compromissos do aluno e responsáveis..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[120px] overflow-hidden"
                />
              </div>

              <div className="pt-4 flex items-center justify-between sticky bottom-0 border-t border-slate-200 p-5 -mx-5 -mb-5 mt-5 bg-white">
                <div>
                   {editingTerm && (
                     <button 
                       type="button" 
                       onClick={() => { setIsModalOpen(false); handleArchive(editingTerm); }}
                       className="px-4 py-2 rounded-lg text-orange-600 hover:bg-orange-50 transition font-medium flex items-center gap-2"
                     >
                       <Archive className="w-4 h-4" /> Arquivar
                     </button>
                   )}
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-white transition font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    {editingTerm ? 'Salvar Alterações' : 'Salvar e Gerar TAC'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
