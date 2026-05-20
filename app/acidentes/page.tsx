'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { AlertTriangle, Plus, Search, X, Edit2, Archive, Printer } from 'lucide-react';
import { getLocalDateString, formatDate } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import SearchableSelect from '@/components/SearchableSelect';

function AcidentesContent() {
  const { students, accidents, addAccident, updateAccident, archiveAccident, currentUserRole } = useAppContext();
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
  const [editingAccident, setEditingAccident] = useState<string | null>(null);

  // Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [location, setLocation] = useState('Pátio');
  const [type, setType] = useState('Individual');
  const [description, setDescription] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [firstAid, setFirstAid] = useState('');
  const [parentsNotified, setParentsNotified] = useState(false);
  const [medicForwarded, setMedicForwarded] = useState(false);
  const [observations, setObservations] = useState('');
  const [registeredBy, setRegisteredBy] = useState('Gestor Escolar');

  const filteredAccidents = accidents.filter(a => {
    if (a.archived) return false;
    const student = students.find(s => s.id === a.studentId);
    
    // Month filter
    const defaultDate = new Date(a.date);
    const monthIndex = parseInt(a.date.split('-')[1]) - 1; 
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
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return norm(student?.name ?? '').includes(norm(searchTerm));
  });

  const openAddModal = () => {
    setEditingAccident(null);
    setSelectedStudent('');
    setDate(getLocalDateString());
    setLocation('Pátio');
    setType('Individual');
    setDescription('');
    setBodyPart('');
    setFirstAid('');
    setParentsNotified(false);
    setMedicForwarded(false);
    setObservations('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: any) => {
    setEditingAccident(a.id);
    setSelectedStudent(a.studentId);
    setDate(a.date);
    setLocation(a.location);
    setType(a.type);
    setDescription(a.description);
    setBodyPart(a.bodyPart);
    setFirstAid(a.firstAid || '');
    setParentsNotified(a.parentsNotified);
    setMedicForwarded(a.medicForwarded);
    setObservations(a.observations || '');
    setIsModalOpen(true);
  };

  const handleArchive = (id: string) => {
    if (confirm('Deseja realmente arquivar este registro de acidente?')) {
      archiveAccident(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !description || !bodyPart) return;

    try {
      if (editingAccident) {
        await updateAccident(editingAccident, {
          studentId: selectedStudent,
          date,
          location,
          type,
          description,
          bodyPart,
          registeredBy,
          parentsNotified,
          medicForwarded,
          observations
        });
      } else {
        await addAccident({
          studentId: selectedStudent,
          date,
          location,
          type,
          description,
          bodyPart,
          registeredBy,
          parentsNotified,
          medicForwarded,
          observations
        });
      }

      setIsModalOpen(false);
      setEditingAccident(null);
    } catch (err) {
      console.error("Erro ao salvar acidente:", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Atenção Especial</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Registro de Acidentes</h1>
            <p className="text-slate-500 text-sm">Controle e rastreabilidade de incidentes físicos com os alunos.</p>
          </div>
          {currentUserRole !== 'GUEST' && (
            <button 
              onClick={openAddModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" /> Registrar Acidente
            </button>
          )}
        </div>

        {/* List Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Buscar por aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-48">
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
              <div className="relative w-full md:w-48">
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
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Local</th>
                  <th className="px-6 py-3 font-medium">Parte do Corpo</th>
                  <th className="px-6 py-3 font-medium text-center">Pais Notif.</th>
                  <th className="px-6 py-3 font-medium text-center">Encam. Médico</th>
                  <th className="px-6 py-3 font-medium w-24 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredAccidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Nenhum acidente registrado até o momento.
                    </td>
                  </tr>
                ) : (
                  filteredAccidents.map((a) => {
                    const student = students.find(s => s.id === a.studentId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition">
                         <td className="px-6 py-4">{formatDate(a.date)}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{student?.name}</td>
                        <td className="px-6 py-4">{a.location}</td>
                        <td className="px-6 py-4">{a.bodyPart}</td>
                        <td className="px-6 py-4 text-center">
                          {a.parentsNotified ? <span className="text-emerald-400 font-bold">Sim</span> : <span className="text-slate-500">Não</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {a.medicForwarded ? <span className="text-blue-400 font-bold">Sim</span> : <span className="text-slate-500">Não</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                             {currentUserRole !== 'GUEST' && (
                               <button 
                                 onClick={() => openEditModal(a)}
                                 className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                 title="Editar"
                               >
                                  <Edit2 className="w-4 h-4" />
                               </button>
                             )}
                             <button 
                               onClick={() => window.print()}
                               className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                               title="Imprimir"
                             >
                                <Printer className="w-4 h-4" />
                             </button>
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

       {/* Modal Novo/Editar Acidente */}
       {isModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="glass-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAccident ? 'Editar Registro de Acidente' : 'Registrar Acidente'}
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Selecione o aluno</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.class}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Data *</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Local do Acidente *</label>
                  <select 
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Pátio">Pátio</option>
                    <option value="Quadra">Quadra</option>
                    <option value="Sala de Aula">Sala de Aula</option>
                    <option value="Banheiro">Banheiro</option>
                    <option value="Corredor">Corredor</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Tipo *</label>
                  <select 
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Entre Colegas">Entre Colegas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Parte do Corpo Atingida *</label>
                  <input 
                    type="text" 
                    required
                    value={bodyPart}
                    onChange={(e) => setBodyPart(e.target.value)}
                    placeholder="Ex: Tornozelo Esquerdo, Cabeça..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Registrado por</label>
                   <input 
                     type="text" 
                     value={registeredBy}
                     onChange={(e) => setRegisteredBy(e.target.value)}
                     className="w-full bg-slate-50 border-b border-slate-200 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Descrição do Acidente *</label>
                <textarea 
                  required
                  rows={2}
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
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-y min-h-[80px] overflow-hidden"
                  placeholder="Descreva o que ocorreu com o máximo de detalhes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Primeiros Socorros Prestados</label>
                <input 
                  type="text" 
                  value={firstAid}
                  onChange={(e) => setFirstAid(e.target.value)}
                  placeholder="Ex: Curativo, gelo, imobilização..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={parentsNotified}
                    onChange={(e) => setParentsNotified(e.target.checked)}
                    className="w-4 h-4 rounded bg-white border-slate-200 text-red-500 focus:ring-red-500"
                  />
                  Responsável Notificado
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={medicForwarded}
                    onChange={(e) => setMedicForwarded(e.target.checked)}
                    className="w-4 h-4 rounded bg-white border-slate-200 text-red-500 focus:ring-red-500"
                  />
                  Encaminhado ao Médico
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Observações adicionais</label>
                <textarea 
                  rows={2}
                  value={observations}
                  onChange={(e) => {
                    setObservations(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-y min-h-[80px] overflow-hidden"
                />
              </div>

              <div className="pt-4 flex items-center justify-between sticky bottom-0 border-t border-slate-200 p-5 -mx-5 -mb-5 mt-5 bg-white">
                <div>
                   {editingAccident && (
                     <button 
                       type="button" 
                       onClick={() => { setIsModalOpen(false); handleArchive(editingAccident); }}
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
                    disabled={!selectedStudent || !description || !bodyPart}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingAccident ? 'Salvar Registro' : 'Registrar Acidente'}
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

export default function Acidentes() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div></AppShell>}>
      <AcidentesContent />
    </Suspense>
  );
}
