'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { useAppContext } from '@/lib/store';
import { FileText, Users, AlertTriangle, Star, UserPlus, FileBadge, Trash2, ArrowUpCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type TabType = 'alunos' | 'ocorrencias' | 'acidentes' | 'elogios' | 'termos' | 'convocacoes';

export default function Arquivados() {
  const { students, occurrences, accidents, praises, conductTerms, summons, rules,
    restoreStudent, restoreOccurrence, restoreAccident, restorePraise, restoreConductTerm, restoreSummons,
    deleteStudent, deleteOccurrence, deleteAccident, deletePraise, deleteConductTerm, deleteSummons, currentUserRole } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('alunos');
  const [selectedItem, setSelectedItem] = useState<{type: string, id: string, data: any} | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const handleRestore = async () => {
    if (!selectedItem) return;
    try {
      if (selectedItem.type === 'aluno') await restoreStudent(selectedItem.id);
      if (selectedItem.type === 'ocorrencia') await restoreOccurrence(selectedItem.id);
      if (selectedItem.type === 'acidente') await restoreAccident(selectedItem.id);
      if (selectedItem.type === 'elogio') await restorePraise(selectedItem.id);
      if (selectedItem.type === 'termo') await restoreConductTerm(selectedItem.id);
      if (selectedItem.type === 'convocacao') await restoreSummons(selectedItem.id);
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao restaurar');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (deleteInput.toLowerCase() !== 'excluir') {
      alert('Por favor, digite "excluir" para confirmar.');
      return;
    }
    
    try {
      if (selectedItem.type === 'aluno') await deleteStudent(selectedItem.id);
      if (selectedItem.type === 'ocorrencia') await deleteOccurrence(selectedItem.id);
      if (selectedItem.type === 'acidente') await deleteAccident(selectedItem.id);
      if (selectedItem.type === 'elogio') await deletePraise(selectedItem.id);
      if (selectedItem.type === 'termo') await deleteConductTerm(selectedItem.id);
      if (selectedItem.type === 'convocacao') await deleteSummons(selectedItem.id);
      setShowDeleteConfirm(false);
      setDeleteInput('');
      setSelectedItem(null);
    } catch (error) {
      console.error(error);
      alert('Erro ao deletar');
    }
  };

  const archivedStudents = students.filter(s => s.archived);
  const archivedOccurrences = occurrences.filter(o => o.archived);
  const archivedAccidents = accidents.filter(a => a.archived);
  const archivedPraises = praises.filter(p => p.archived);
  const archivedTerms = conductTerms.filter(t => t.archived);
  const archivedSummons = summons.filter(s => s.archived);

  // Here we just display the archived items. For simplicity we display a list or table.
  
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lixeira / Arquivados</h1>
          <p className="text-slate-500 text-sm">Controle de registros e alunos removidos da visualização principal.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto space-x-1 border-b border-slate-200 pb-px">
          <button
            onClick={() => setActiveTab('alunos')}
            className={'flex px-4 py-2.5 items-center gap-2 text-sm font-medium border-b-2 whitespace-nowrap transition ' + (activeTab === 'alunos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}
          >
            <Users className="w-4 h-4" /> Alunos ({archivedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('ocorrencias')}
            className={'flex px-4 py-2.5 items-center gap-2 text-sm font-medium border-b-2 whitespace-nowrap transition ' + (activeTab === 'ocorrencias' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}
          >
            <FileText className="w-4 h-4" /> Reg. Disciplinar ({archivedOccurrences.length})
          </button>
          <button
            onClick={() => setActiveTab('acidentes')}
            className={'flex px-4 py-2.5 items-center gap-2 text-sm font-medium border-b-2 whitespace-nowrap transition ' + (activeTab === 'acidentes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}
          >
            <AlertTriangle className="w-4 h-4" /> Acidentes ({archivedAccidents.length})
          </button>
          <button
            onClick={() => setActiveTab('elogios')}
            className={'flex px-4 py-2.5 items-center gap-2 text-sm font-medium border-b-2 whitespace-nowrap transition ' + (activeTab === 'elogios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}
          >
            <Star className="w-4 h-4" /> Elogios ({archivedPraises.length})
          </button>
          <button
            onClick={() => setActiveTab('convocacoes')}
            className={'flex px-4 py-2.5 items-center gap-2 text-sm font-medium border-b-2 whitespace-nowrap transition ' + (activeTab === 'convocacoes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}
          >
            <UserPlus className="w-4 h-4" /> Convocações ({archivedSummons.length})
          </button>
          <button
            onClick={() => setActiveTab('termos')}
            className={'flex px-4 py-2.5 items-center gap-2 text-sm font-medium border-b-2 whitespace-nowrap transition ' + (activeTab === 'termos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}
          >
            <FileBadge className="w-4 h-4" /> Termos de Conduta ({archivedTerms.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 p-4 min-h-[400px]">
          {activeTab === 'alunos' && (
            <div className="space-y-4">
              {archivedStudents.length === 0 ? <p className="text-slate-500 text-sm p-4">Nenhum aluno arquivado.</p> : (
                <ul className="divide-y divide-slate-100">
                  {archivedStudents.map(s => (
                    <li key={s.id} onClick={() => setSelectedItem({type: 'aluno', id: s.id, data: s})} className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition">
                      <div className="text-sm">
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        <p className="text-slate-500">{s.class}</p>
                      </div>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Arquivado</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {activeTab === 'ocorrencias' && (
            <div className="space-y-4">
              {archivedOccurrences.length === 0 ? <p className="text-slate-500 text-sm p-4">Nenhum registro disciplinar arquivado.</p> : (
                <ul className="divide-y divide-slate-100">
                  {archivedOccurrences.map(o => {
                    const student = students.find(s => s.id === o.studentId);
                    const rule = rules.find(r => r.code === o.ruleCode);
                    return (
                      <li key={o.id} onClick={() => setSelectedItem({type: 'ocorrencia', id: o.id, data: o})} className="py-3 flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition">
                         <div>
                            <p className="font-semibold text-slate-800">{student?.name || 'Aluno Desconhecido'} - {formatDate(o.date)}</p>
                            <p className="text-slate-500">Art. {rule?.code} - {rule?.description}</p>
                         </div>
                         <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Arquivado</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'acidentes' && (
            <div className="space-y-4">
              {archivedAccidents.length === 0 ? <p className="text-slate-500 text-sm p-4">Nenhum acidente arquivado.</p> : (
                <ul className="divide-y divide-slate-100">
                  {archivedAccidents.map(a => {
                    const student = students.find(s => s.id === a.studentId);
                    return (
                      <li key={a.id} onClick={() => setSelectedItem({type: 'acidente', id: a.id, data: a})} className="py-3 flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition">
                         <div>
                            <p className="font-semibold text-slate-800">{student?.name || 'Aluno Desconhecido'} - {formatDate(a.date)}</p>
                            <p className="text-slate-500">Local: {a.location}</p>
                         </div>
                         <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Arquivado</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'elogios' && (
            <div className="space-y-4">
              {archivedPraises.length === 0 ? <p className="text-slate-500 text-sm p-4">Nenhum elogio arquivado.</p> : (
                <ul className="divide-y divide-slate-100">
                  {archivedPraises.map(p => {
                    const student = students.find(s => s.id === p.studentId);
                    return (
                      <li key={p.id} onClick={() => setSelectedItem({type: 'elogio', id: p.id, data: p})} className="py-3 flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition">
                         <div>
                            <p className="font-semibold text-slate-800">{student?.name || 'Aluno'} - {formatDate(p.date)}</p>
                            <p className="text-slate-500">{p.type}</p>
                         </div>
                         <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Arquivado</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'convocacoes' && (
            <div className="space-y-4">
              {archivedSummons.length === 0 ? <p className="text-slate-500 text-sm p-4">Nenhuma convocação arquivada.</p> : (
                <ul className="divide-y divide-slate-100">
                  {archivedSummons.map(s => {
                    const student = students.find(st => st.id === s.studentId);
                    return (
                      <li key={s.id} onClick={() => setSelectedItem({type: 'convocacao', id: s.id, data: s})} className="py-3 flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition">
                         <div>
                            <p className="font-semibold text-slate-800">{student?.name || 'Aluno'} - {formatDate(s.date)}</p>
                            <p className="text-slate-500">{s.reason}</p>
                         </div>
                         <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Arquivado</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'termos' && (
            <div className="space-y-4">
              {archivedTerms.length === 0 ? <p className="text-slate-500 text-sm p-4">Nenhum termo de conduta arquivado.</p> : (
                <ul className="divide-y divide-slate-100">
                  {archivedTerms.map(t => {
                    const student = students.find(st => st.id === t.studentId);
                    return (
                      <li key={t.id} onClick={() => setSelectedItem({type: 'termo', id: t.id, data: t})} className="py-3 flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 px-2 rounded-lg transition">
                         <div>
                            <p className="font-semibold text-slate-800">{student?.name || 'Aluno'} - {formatDate(t.date)}</p>
                            <p className="text-slate-500">Responsável: {t.guardianName}</p>
                         </div>
                         <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Arquivado</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalhes do Registro Arquivado">
        {selectedItem && (
          <div className="space-y-4 pt-2">
            
            {selectedItem.type === 'aluno' && (
              <div className="space-y-3 text-sm text-slate-700">
                <p><span className="font-semibold">Nome:</span> {selectedItem.data.name}</p>
                <p><span className="font-semibold">Turma:</span> {selectedItem.data.class}</p>
                <p><span className="font-semibold">Turno:</span> {selectedItem.data.shift}</p>
                <p><span className="font-semibold">RA:</span> {selectedItem.data.ra || 'N/A'}</p>
              </div>
            )}
            
            {selectedItem.type === 'ocorrencia' && (
              <div className="space-y-3 text-sm text-slate-700">
                <p><span className="font-semibold">Data:</span> {formatDate(selectedItem.data.date)}</p>
                <p><span className="font-semibold">Aluno:</span> {students.find(s => s.id === selectedItem.data.studentId)?.name || 'Desconhecido'}</p>
                <p><span className="font-semibold">Artigo:</span> {selectedItem.data.ruleCode}</p>
                <p><span className="font-semibold">Descrição do Código:</span> {rules.find(r => r.code === selectedItem.data.ruleCode)?.description}</p>
                <p><span className="font-semibold">Registrado por:</span> {selectedItem.data.registeredBy}</p>
                {selectedItem.data.observations && (
                  <div>
                    <span className="font-semibold block mb-1">Observações:</span>
                    <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedItem.data.observations}</p>
                  </div>
                )}
              </div>
            )}

            {selectedItem.type === 'acidente' && (
              <div className="space-y-3 text-sm text-slate-700">
                <p><span className="font-semibold">Data:</span> {formatDate(selectedItem.data.date)}</p>
                <p><span className="font-semibold">Aluno:</span> {students.find(s => s.id === selectedItem.data.studentId)?.name || 'Desconhecido'}</p>
                <p><span className="font-semibold">Hora:</span> {selectedItem.data.time}</p>
                <p><span className="font-semibold">Local:</span> {selectedItem.data.location}</p>
                <div>
                   <span className="font-semibold block mb-1">Descrição:</span>
                   <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedItem.data.description}</p>
                </div>
                <div>
                   <span className="font-semibold block mb-1">Ação Tomada:</span>
                   <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedItem.data.actionTaken}</p>
                </div>
              </div>
            )}

            {selectedItem.type === 'elogio' && (
              <div className="space-y-3 text-sm text-slate-700">
                <p><span className="font-semibold">Data:</span> {formatDate(selectedItem.data.date)}</p>
                <p><span className="font-semibold">Aluno:</span> {students.find(s => s.id === selectedItem.data.studentId)?.name || 'Desconhecido'}</p>
                <p><span className="font-semibold">Tipo:</span> {selectedItem.data.type}</p>
                <p><span className="font-semibold">Registrado por:</span> {selectedItem.data.registeredBy}</p>
                {selectedItem.data.observations && (
                  <div>
                    <span className="font-semibold block mb-1">Motivo/Observações:</span>
                    <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedItem.data.observations}</p>
                  </div>
                )}
              </div>
            )}

            {selectedItem.type === 'termo' && (
               <div className="space-y-3 text-sm text-slate-700">
                 <p><span className="font-semibold">Data:</span> {formatDate(selectedItem.data.date)}</p>
                 <p><span className="font-semibold">Aluno:</span> {students.find(s => s.id === selectedItem.data.studentId)?.name || 'Desconhecido'}</p>
                 <p><span className="font-semibold">Responsável Presente:</span> {selectedItem.data.guardianName}</p>
                 <p><span className="font-semibold">Contato:</span> {selectedItem.data.guardianContact}</p>
                 <div>
                    <span className="font-semibold block mb-1">Acordos Estabelecidos:</span>
                    <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedItem.data.agreements}</p>
                 </div>
               </div>
            )}

            {selectedItem.type === 'convocacao' && (
               <div className="space-y-3 text-sm text-slate-700">
                 <p><span className="font-semibold">Data de Comparecimento:</span> {formatDate(selectedItem.data.date)} às {selectedItem.data.time}</p>
                 <p><span className="font-semibold">Aluno:</span> {students.find(s => s.id === selectedItem.data.studentId)?.name || 'Desconhecido'}</p>
                 <p><span className="font-semibold">Responsável:</span> {selectedItem.data.guardianName}</p>
                 <p><span className="font-semibold">Compareceu:</span> {selectedItem.data.attended ? 'Sim' : 'Não'}</p>
                 <div>
                    <span className="font-semibold block mb-1">Motivo:</span>
                    <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedItem.data.reason}</p>
                 </div>
                 {selectedItem.data.observations && (
                    <div>
                      <span className="font-semibold block mb-1">Observações:</span>
                      <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedItem.data.observations}</p>
                    </div>
                 )}
               </div>
            )}
            
            <div className="pt-6 mt-4 border-t flex justify-between items-center gap-3 border-slate-200">
              {currentUserRole !== 'GUEST' && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Excluir permanentemente
                </button>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                {currentUserRole !== 'GUEST' && (
                  <button
                    onClick={handleRestore}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Restaurar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteInput('');
        }} 
        title="Confirmar Exclusão"
      >
        <div className="space-y-4 pt-2">
          <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
            <p className="text-red-800 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> ATENÇÃO
            </p>
            <p className="text-red-700 text-sm mt-1">
              Esta ação excluirá o registro <strong>DEFINITIVAMENTE</strong> de nossa base de dados. Esta ação não poderá ser desfeita futuramente.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              Para prosseguir, digite <strong>excluir</strong> abaixo:
            </label>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder='Digite "excluir" aqui'
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteInput('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteInput.toLowerCase() !== 'excluir'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" /> Confirmar Exclusão
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
