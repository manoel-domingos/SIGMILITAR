'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { Star, Plus, Search, X, Edit2, Archive, Printer } from 'lucide-react';
import { getLocalDateString, formatDate } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import SearchableSelect from '@/components/SearchableSelect';

function ElogiosContent() {
  const { students, praises, addPraise, updatePraise, archivePraise, currentUserRole } = useAppContext();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Todos os meses');
  const [selectedClass, setSelectedClass] = useState('Todas as turmas');

  useEffect(() => {
    const paramMonth = searchParams.get('month');
    const paramClass = searchParams.get('class');
    if (paramMonth && paramMonth !== 'Selecionar...') setTimeout(() => setSelectedMonth(paramMonth), 0);
    if (paramClass && paramClass !== 'Todas') setTimeout(() => setSelectedClass(paramClass), 0);
  }, [searchParams]);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const classes = Array.from(new Set(students.map(s => s.class))).sort();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPraise, setEditingPraise] = useState<string | null>(null);

  // Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [type, setType] = useState<any>('Individual');
  const [description, setDescription] = useState('');
  const [registeredBy, setRegisteredBy] = useState('Gestor Escolar');

  const filteredPraises = praises.filter(p => {
    if (p.archived) return false;
    const student = students.find(s => s.id === p.studentId);
    
    // Month filter
    const defaultDate = new Date(p.date);
    const monthIndex = parseInt(p.date.split('-')[1]) - 1; 
    const month = months[monthIndex] || months[defaultDate.getMonth()];
    if (selectedMonth !== 'Todos os meses' && selectedMonth !== '' && month.toLowerCase() !== selectedMonth.toLowerCase()) {
      return false;
    }

    // Class filter
    if (selectedClass !== 'Todas as turmas' && selectedClass !== '') {
      if (!student || student.class.toLowerCase() !== selectedClass.toLowerCase()) {
        return false;
      }
    }

    if (!searchTerm) return true;
    return student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  const openAddModal = () => {
    setEditingPraise(null);
    setSelectedStudent('');
    setDate(getLocalDateString());
    setType('Individual');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPraise(p.id);
    setSelectedStudent(p.studentId);
    setDate(p.date);
    setType(p.type);
    setDescription(p.description);
    setIsModalOpen(true);
  };

  const handleArchive = (id: string) => {
    if (confirm('Deseja realmente arquivar este elogio?')) {
      archivePraise(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !description) return;

    try {
      if (editingPraise) {
        await updatePraise(editingPraise, {
          studentId: selectedStudent,
          date,
          type,
          description,
          registeredBy
        });
      } else {
        await addPraise({
          studentId: selectedStudent,
          date,
          type,
          description,
          registeredBy
        });
      }

      setIsModalOpen(false);
      setSelectedStudent('');
      setDescription('');
      setEditingPraise(null);
    } catch (err) {
      console.error("Erro ao salvar elogio:", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Ocorrências Positivas</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Elogios e Bonificações</h1>
            <p className="text-slate-500 text-sm">O registros somam pontos à nota de comportamento.</p>
          </div>
          {currentUserRole !== 'GUEST' && (
            <button 
              onClick={openAddModal}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" /> Registrar Elogio
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-slate-200">
            <p className="text-2xl font-bold text-yellow-600">{filteredPraises.length}</p>
            <p className="text-slate-500 text-sm mt-1">Total de Elogios</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-slate-200">
            <p className="text-2xl font-bold text-emerald-400">{new Set(filteredPraises.map(p => p.studentId)).size}</p>
            <p className="text-slate-500 text-sm mt-1">Alunos Elogiados</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-slate-200">
            <p className="text-2xl font-bold text-blue-400">{filteredPraises.filter(p => p.type === 'Art. 50').length}</p>
            <p className="text-slate-500 text-sm mt-1">Destaques (Art. 50)</p>
          </div>
        </div>

        {/* List Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex flex-wrap gap-4 w-full md:w-auto">
               <button 
                 onClick={openAddModal}
                 className="bg-yellow-600/20 text-yellow-600 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shrink-0"
               >
                 <Star className="w-4 h-4" /> Registrar Elogio
               </button>
               <button className="text-slate-500 hover:text-slate-800 px-3 py-1.5 text-sm font-medium transition whitespace-nowrap hidden sm:block">
                 Art. 50 - Em Lote
               </button>
               <button className="text-slate-500 hover:text-slate-800 px-3 py-1.5 text-sm font-medium transition whitespace-nowrap hidden sm:block">
                 Art. 51 - Ação
               </button>
             </div>
             
             <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
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
             </div>
          </div>
          <div className="p-4 border-b border-slate-200">
            <div className="relative w-full">
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
              <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Turma</th>
                  <th className="px-6 py-3 font-medium">Elogio / Bonificação</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Responsável</th>
                  <th className="px-6 py-3 font-medium w-24 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredPraises.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Nenhum elogio registrado ainda.
                    </td>
                  </tr>
                ) : (
                  filteredPraises.map((p) => {
                    const student = students.find(s => s.id === p.studentId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">{formatDate(p.date)}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{student?.name}</td>
                        <td className="px-6 py-4">{student?.class}</td>
                        <td className="px-6 py-4 truncate max-w-[300px]" title={p.description}>{p.description}</td>
                        <td className="px-6 py-4">
                           <span className="bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                             {p.type}
                           </span>
                        </td>
                        <td className="px-6 py-4">{p.registeredBy}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <button 
                               onClick={() => window.print()}
                               className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                               title="Imprimir"
                             >
                                <Printer className="w-4 h-4" />
                             </button>
                             {currentUserRole !== 'GUEST' && (
                               <button 
                                 onClick={() => openEditModal(p)}
                                 className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
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

       {/* Modal Nova/Editar Bonificação */}
       {isModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="glass-modal max-w-lg w-full flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingPraise ? 'Editar Elogio' : 'Registrar Elogio'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Aluno *</label>
                <select 
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Selecione o aluno</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.class} ({s.shift})</option>
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Reconhecimento *</label>
                  <select 
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="Individual">Elogio Individual (+0.50)</option>
                    <option value="Coletivo">Elogio Coletivo (+0.30)</option>
                    <option value="Art. 50">Art. 50 (Destaque Bimestral +0.50)</option>
                    <option value="Art. 51">Art. 51 (Ação Meritória)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Motivo / Descrição *</label>
                <textarea 
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-y min-h-[100px] overflow-hidden"
                  placeholder="Descreva o motivo do elogio..."
                />
              </div>

              <div className="pt-4 flex items-center justify-between sticky bottom-0 border-t border-slate-200 p-5 -mx-5 -mb-5 mt-5 bg-white">
                <div>
                   {editingPraise && (
                     <button 
                       type="button" 
                       onClick={() => { setIsModalOpen(false); handleArchive(editingPraise); }}
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
                    disabled={!selectedStudent || !description}
                    className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingPraise ? 'Salvar Alterações' : 'Confirmar Elogio'}
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

export default function Elogios() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div></AppShell>}>
      <ElogiosContent />
    </Suspense>
  );
}
