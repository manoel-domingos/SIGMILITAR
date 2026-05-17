'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { UserPlus, Printer, Search, Plus, X, Edit2, Archive } from 'lucide-react';
import { Summons } from '@/lib/data';
import { getLocalDateString, formatDate } from '@/lib/utils';
import { getSchoolHeaderHTML, getSchoolFooterHTML, SCHOOL_HEADER_CSS } from '@/lib/print-header';

export default function ConvocacaoPais() {
  const { students, summons, addSummons, updateSummons, archiveSummons, currentUserRole } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSummons, setEditingSummons] = useState<string | null>(null);

  // Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState('08:00');
  const [reason, setReason] = useState('');
  const [department, setDepartment] = useState('Coordenação de Disciplina');

  const filteredSummons = summons.filter(s => {
    if (s.archived) return false;
    const student = students.find(st => st.id === s.studentId);
    return student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  const openAddModal = () => {
    setEditingSummons(null);
    setSelectedStudent('');
    setDate(getLocalDateString());
    setTime('08:00');
    setReason('');
    setDepartment('Coordenação de Disciplina');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Summons) => {
    setEditingSummons(s.id);
    setSelectedStudent(s.studentId);
    setDate(s.date);
    setTime(s.time);
    setReason(s.reason);
    setDepartment(s.department);
    setIsModalOpen(true);
  };

  const handleArchive = (id: string) => {
    if (confirm('Deseja realmente arquivar esta convocação?')) {
      archiveSummons(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const payload = {
      studentId: selectedStudent,
      date,
      time,
      reason,
      department,
      registeredBy: 'Gestor Escolar'
    };

    if (editingSummons) {
      updateSummons(editingSummons, payload);
    } else {
      addSummons(payload);
    }

    setIsModalOpen(false);
  };

  const handlePrint = (s: Summons) => {
    const student = students.find(st => st.id === s.studentId);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <h${""}tml lang="pt-BR">
        <head>
          <title>Convocação - ${student?.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            ${SCHOOL_HEADER_CSS}
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.7; color: #111; }
            .doc-titulo { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #1a237e; padding-bottom: 6px; color: #1a237e; }
            .date { text-align: right; margin-bottom: 24px; font-size: 10pt; color: #444; }
            .content { margin-bottom: 50px; text-align: justify; font-size: 11pt; line-height: 1.8; }
            .content p { margin-bottom: 14px; }
            .assinaturas { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 60px; }
            .sig-line { border-top: 1px solid #000; padding-top: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; text-transform: uppercase; }
            @media print { button { display: none !important; } }
          </style>
        </head>
        <body>
          ${getSchoolHeaderHTML()}
          <div class="doc-titulo">CARTA DE CONVOCAÇÃO Nº ${s.id.slice(-4).toUpperCase()}</div>
          <div class="date">Tangará da Serra, ${new Date().toLocaleDateString('pt-BR')}</div>
          <div class="content">
            <p>Ao Sr(a). Responsável pelo aluno(a) <strong>${student?.name}</strong>, da turma <strong>${student?.class}</strong>.</p>
            <p>Solicitamos o comparecimento de V.S.ª nesta Unidade Escolar no dia <strong>${formatDate(s.date)}</strong> às <strong>${s.time}</strong> horas, para tratar de assuntos de interesse do referido aluno junto ao setor <strong>${s.department}</strong>.</p>
            <p><strong>Motivo:</strong> ${s.reason}</p>
            <p>Certos de sua compreensão e compromisso com o processo educacional, agradecemos antecipadamente.</p>
          </div>
          <div class="assinaturas">
            <div class="sig-line">Assinatura do Responsável</div>
            <div class="sig-line">Diretora / Coord. Pedagógico</div>
            <div class="sig-line">Gestão Escolar / Militar</div>
          </div>
          ${getSchoolFooterHTML()}
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
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Documento Oficial</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Convocação de Pais</h1>
            <p className="text-slate-500 text-sm">Gerenciamento de convocações oficiais.</p>
          </div>
          {currentUserRole !== 'GUEST' && (
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" /> Nova Convocação
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
                  <th className="px-6 py-3 font-medium">Data/Hora</th>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Setor</th>
                  <th className="px-6 py-3 font-medium">Motivo</th>
                  <th className="px-6 py-3 font-medium w-32 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredSummons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                      Nenhuma convocação registrada.
                    </td>
                  </tr>
                ) : (
                  filteredSummons.map((s) => {
                    const student = students.find(st => st.id === s.studentId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 group">
                          <p className="font-medium text-slate-800">{formatDate(s.date)}</p>
                          <p className="text-xs text-slate-400">{s.time}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{student?.name}</p>
                          <p className="text-xs text-slate-400">{student?.class}</p>
                        </td>
                        <td className="px-6 py-4">{s.department}</td>
                        <td className="px-6 py-4 truncate max-w-[200px]">{s.reason}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                             <button 
                               onClick={() => handlePrint(s)}
                               className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                               title="Imprimir"
                             >
                               <Printer className="w-4 h-4" />
                             </button>
                             {currentUserRole !== 'GUEST' && (
                               <button 
                                 onClick={() => openEditModal(s)}
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
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="glass-modal max-w-lg w-full flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingSummons ? 'Editar Convocação' : 'Nova Convocação'}
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
                  <label className="block text-sm font-medium text-slate-600 mb-1">Hora *</label>
                  <input 
                    type="time" 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Motivo *</label>
                <textarea 
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Motivo resumido da convocação..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px] overflow-hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Setor *</label>
                <input 
                  type="text" 
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex: Coordenação de Disciplina"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-between sticky bottom-0 border-t border-slate-200 p-5 -mx-5 -mb-5 mt-5 bg-white">
                <div>
                   {editingSummons && (
                     <button 
                       type="button" 
                       onClick={() => { setIsModalOpen(false); handleArchive(editingSummons); }}
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
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white transition font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium"
                  >
                    {editingSummons ? 'Salvar Alterações' : 'Salvar Convocação'}
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
