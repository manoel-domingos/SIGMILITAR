'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { getSupabase } from '@/lib/supabase';
import {
  CheckCircle2, Circle, Plus, Trash2, Edit2, Check, X,
  ChevronDown, ChevronRight, Rocket, FileText, ClipboardCheck,
  RotateCcw, Loader2,
} from 'lucide-react';

function supabase() {
  return getSupabase();
}

// ---------- tipos ----------
type ItemNote = {
  question: string;
  answer: string;
  doneAt: string;
};

type CheckItem = {
  id: string;
  text: string;
  done: boolean;
  position: number;
  note?: ItemNote;
};

type Category = {
  id: string;
  title: string;
  position: number;
  items: CheckItem[];
};

// Ação reversível para undo
type UndoAction =
  | { type: 'delete_item'; catId: string; item: CheckItem; position: number }
  | { type: 'delete_cat'; cat: Category; position: number }
  | { type: 'edit_item'; catId: string; itemId: string; prevText: string }
  | { type: 'edit_cat'; catId: string; prevTitle: string }
  | { type: 'toggle_item'; catId: string; itemId: string; prevDone: boolean; prevNote?: ItemNote }
  | { type: 'add_item'; catId: string; itemId: string }
  | { type: 'add_cat'; catId: string };

// ---------- dados iniciais ----------
const INITIAL_CATEGORIES: Omit<Category, 'items'>[] = [
  { id: 'cat-1', title: 'Estrutura Administrativa', position: 0 },
  { id: 'cat-2', title: 'Documentação e Normas', position: 1 },
  { id: 'cat-3', title: 'Capacitação da Equipe', position: 2 },
  { id: 'cat-4', title: 'Infraestrutura Escolar', position: 3 },
  { id: 'cat-5', title: 'Rotinas e Rituais Cívicos', position: 4 },
  { id: 'cat-6', title: 'Tecnologia e Sistema', position: 5 },
  { id: 'cat-7', title: 'Comunicação com Família', position: 6 },
  { id: 'cat-8', title: 'Acompanhamento e Melhoria', position: 7 },
];

const INITIAL_ITEMS: { catId: string; id: string; text: string; position: number }[] = [
  { catId: 'cat-1', id: 'i-1-1', text: 'Designar Gestor Cívico Educacional (G1)', position: 0 },
  { catId: 'cat-1', id: 'i-1-2', text: 'Designar Gestor Adjunto (G2)', position: 1 },
  { catId: 'cat-1', id: 'i-1-3', text: 'Nomear Coordenadores de Turno', position: 2 },
  { catId: 'cat-1', id: 'i-1-4', text: 'Escalar equipe de Monitores por turno', position: 3 },
  { catId: 'cat-1', id: 'i-1-5', text: 'Definir organograma e linha de comando', position: 4 },
  { catId: 'cat-2', id: 'i-2-1', text: 'Elaborar Regimento Interno adaptado ao modelo cívico-militar', position: 0 },
  { catId: 'cat-2', id: 'i-2-2', text: 'Publicar normas de conduta e disciplina', position: 1 },
  { catId: 'cat-2', id: 'i-2-3', text: 'Criar formulários padrão (ATA, Termo, Convocação)', position: 2 },
  { catId: 'cat-2', id: 'i-2-4', text: 'Aprovar Regimento junto à SEDUC', position: 3 },
  { catId: 'cat-2', id: 'i-2-5', text: 'Distribuir manual do aluno e da família', position: 4 },
  { catId: 'cat-3', id: 'i-3-1', text: 'Realizar treinamento de gestão disciplinar', position: 0 },
  { catId: 'cat-3', id: 'i-3-2', text: 'Capacitar monitores em mediação de conflitos', position: 1 },
  { catId: 'cat-3', id: 'i-3-3', text: 'Treinar uso do sistema de registro disciplinar', position: 2 },
  { catId: 'cat-3', id: 'i-3-4', text: 'Realizar simulação de rotinas cívico-militares', position: 3 },
  { catId: 'cat-4', id: 'i-4-1', text: 'Instalar câmeras de segurança em áreas comuns', position: 0 },
  { catId: 'cat-4', id: 'i-4-2', text: 'Sinalizar zonas de circulação e postos de monitoramento', position: 1 },
  { catId: 'cat-4', id: 'i-4-3', text: 'Organizar fardamento e identificação visual dos alunos', position: 2 },
  { catId: 'cat-4', id: 'i-4-4', text: 'Instalar sistema de controle de entrada/saída', position: 3 },
  { catId: 'cat-4', id: 'i-4-5', text: 'Adequar sala de coordenação disciplinar', position: 4 },
  { catId: 'cat-5', id: 'i-5-1', text: 'Implementar hasteamento de bandeira diário', position: 0 },
  { catId: 'cat-5', id: 'i-5-2', text: 'Estabelecer rotina de formatura matinal', position: 1 },
  { catId: 'cat-5', id: 'i-5-3', text: 'Criar calendário de datas cívicas comemorativas', position: 2 },
  { catId: 'cat-5', id: 'i-5-4', text: 'Instituir hino nacional no início das aulas', position: 3 },
  { catId: 'cat-6', id: 'i-6-1', text: 'Implantar sistema de registro disciplinar digital', position: 0 },
  { catId: 'cat-6', id: 'i-6-2', text: 'Cadastrar todos os alunos no sistema', position: 1 },
  { catId: 'cat-6', id: 'i-6-3', text: 'Configurar usuários e permissões de acesso', position: 2 },
  { catId: 'cat-6', id: 'i-6-4', text: 'Integrar sistema com banco de dados na nuvem', position: 3 },
  { catId: 'cat-6', id: 'i-6-5', text: 'Treinar equipe no uso do sistema de ocorrências', position: 4 },
  { catId: 'cat-6', id: 'i-6-6', text: 'Habilitar módulo de relatórios e dashboards', position: 5 },
  { catId: 'cat-7', id: 'i-7-1', text: 'Realizar reunião de apresentação do modelo às famílias', position: 0 },
  { catId: 'cat-7', id: 'i-7-2', text: 'Coletar assinatura do Termo de Ciência das Normas', position: 1 },
  { catId: 'cat-7', id: 'i-7-3', text: 'Estabelecer canal de comunicação escola-família', position: 2 },
  { catId: 'cat-7', id: 'i-7-4', text: 'Divulgar calendário de convocações e reuniões', position: 3 },
  { catId: 'cat-8', id: 'i-8-1', text: 'Realizar reuniões quinzenais de avaliação disciplinar', position: 0 },
  { catId: 'cat-8', id: 'i-8-2', text: 'Revisar indicadores de ocorrências mensalmente', position: 1 },
  { catId: 'cat-8', id: 'i-8-3', text: 'Aplicar pesquisa de clima escolar semestralmente', position: 2 },
  { catId: 'cat-8', id: 'i-8-4', text: 'Elaborar relatório anual de desempenho do programa', position: 3 },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildQuestion(itemText: string): string {
  const text = itemText.toLowerCase();
  if (text.includes('designar') || text.includes('nomear') || text.includes('escalar'))
    return 'Como foi feita a designação? Informe o nome do responsável e a data.';
  if (text.includes('elaborar') || text.includes('criar') || text.includes('publicar'))
    return 'Como foi elaborado? Descreva o processo e quem participou.';
  if (text.includes('aprovar') || text.includes('coletar assinatura'))
    return 'Como ocorreu a aprovação? Informe data, responsáveis e eventuais observações.';
  if (text.includes('treinar') || text.includes('capacitar') || text.includes('treinamento'))
    return 'Como foi realizado o treinamento? Informe data, participantes e conteúdo abordado.';
  if (text.includes('instalar') || text.includes('adequar') || text.includes('sinalizar'))
    return 'Como foi implementado? Descreva o que foi feito, fornecedores e data de conclusão.';
  if (text.includes('reunião') || text.includes('reunioes') || text.includes('formatura') || text.includes('hasteamento'))
    return 'Como foi definido? Descreva a rotina estabelecida, responsáveis e horários.';
  if (text.includes('integrar') || text.includes('configurar') || text.includes('habilitar') || text.includes('implantar'))
    return 'Como foi configurado? Descreva os passos realizados e quem executou.';
  if (text.includes('distribuir') || text.includes('divulgar'))
    return 'Como foi feita a distribuição/divulgação? Informe os canais utilizados e o alcance.';
  return 'Como foi definido e implementado? Descreva brevemente o processo e as decisões tomadas.';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ---------- Modal de conclusão ----------
function CompletionModal({
  itemText, existingNote, onConfirm, onCancel,
}: {
  itemText: string; existingNote?: ItemNote;
  onConfirm: (answer: string) => void; onCancel: () => void;
}) {
  const question = buildQuestion(itemText);
  const [answer, setAnswer] = useState(existingNote?.answer ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 50); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="flex items-start gap-3 p-5 border-b border-slate-100 bg-emerald-50">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-0.5">Etapa concluída</p>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{itemText}</p>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block text-sm font-medium text-slate-700">{question}</label>
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Descreva aqui como foi realizado..."
            rows={4}
            className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
          />
          <p className="text-xs text-slate-400">Esta informação será usada na geração do relatório de implantação.</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirm(answer.trim())} className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-2">
            <Check className="w-4 h-4" />
            Confirmar conclusão
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Modal de leitura da nota ----------
function NoteViewModal({
  itemText, note, onEdit, onClose,
}: {
  itemText: string; note: ItemNote; onEdit: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
        <div className="flex items-start gap-3 p-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Registro da etapa</p>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{itemText}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs font-medium text-slate-500">{note.question}</p>
          {note.answer
            ? <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap">{note.answer}</p>
            : <p className="text-sm text-slate-400 italic">Nenhuma observação registrada.</p>
          }
          <p className="text-xs text-slate-400">Concluído em {formatDate(note.doneAt)}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Fechar</button>
          <button onClick={onEdit} className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2">
            <Edit2 className="w-4 h-4" />Editar registro
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Toast de Desfazer ----------
function UndoToast({ message, onUndo, onDismiss }: { message: string; onUndo: () => void; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-800 text-white text-sm px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <span className="text-slate-200">{message}</span>
      <button
        onClick={onUndo}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Desfazer
      </button>
      <button onClick={onDismiss} className="text-slate-400 hover:text-white transition-colors ml-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------- componente principal ----------
export default function ImplantacaoPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<{ catId: string; itemId: string } | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [addingItemCat, setAddingItemCat] = useState<string | null>(null);
  const [addingItemText, setAddingItemText] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newCatText, setNewCatText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [completionModal, setCompletionModal] = useState<{
    catId: string; itemId: string; itemText: string; existingNote?: ItemNote; isEdit?: boolean;
  } | null>(null);
  const [noteViewModal, setNoteViewModal] = useState<{
    itemText: string; note: ItemNote; catId: string; itemId: string;
  } | null>(null);

  // Undo stack — guarda apenas a última ação
  const [undoStack, setUndoStack] = useState<UndoAction | null>(null);
  const [undoToast, setUndoToast] = useState<string | null>(null);

  const pushUndo = (action: UndoAction, message: string) => {
    setUndoStack(action);
    setUndoToast(message);
  };
  const clearUndo = () => { setUndoStack(null); setUndoToast(null); };

  // ---------- Carregar do Supabase ----------
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: cats } = await supabase()
      .from('implantacao_categories')
      .select('*')
      .order('position');

    if (!cats || cats.length === 0) {
      // Seed inicial
      await seedInitialData();
      setLoading(false);
      return;
    }

    const { data: items } = await supabase()
      .from('implantacao_items')
      .select('*')
      .order('position');

    const built: Category[] = cats.map((c: any) => ({
      id: c.id,
      title: c.title,
      position: c.position,
      items: (items ?? [])
        .filter((i: any) => i.category_id === c.id)
        .map((i: any) => ({
          id: i.id,
          text: i.text,
          done: i.done,
          position: i.position,
          note: i.note_question ? {
            question: i.note_question,
            answer: i.note_answer ?? '',
            doneAt: i.note_done_at ?? new Date().toISOString(),
          } : undefined,
        })),
    }));

    setCategories(built);
    setLoading(false);
  }, []);

  const seedInitialData = async () => {
    for (const cat of INITIAL_CATEGORIES) {
      await supabase().from('implantacao_categories').upsert({
        id: cat.id, title: cat.title, position: cat.position,
      });
    }
    for (const item of INITIAL_ITEMS) {
      await supabase().from('implantacao_items').upsert({
        id: item.id, category_id: item.catId, text: item.text,
        done: false, position: item.position,
      });
    }
    await loadData();
  };

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (editingItem || addingItemCat || editingCat || addingCat) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editingItem, addingItemCat, editingCat, addingCat]);

  // ---------- progresso ----------
  const allItems = categories.flatMap(c => c.items);
  const totalItems = allItems.length;
  const doneItems = allItems.filter(i => i.done).length;
  const progress = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

  const progressColor =
    progress < 25 ? 'bg-rose-500' : progress < 50 ? 'bg-amber-500' :
    progress < 75 ? 'bg-blue-500' : progress < 100 ? 'bg-emerald-500' : 'bg-emerald-600';

  const progressLabel =
    progress < 25 ? 'Iniciando' : progress < 50 ? 'Em andamento' :
    progress < 75 ? 'Avançando' : progress < 100 ? 'Quase concluído' : 'Concluído!';

  // ---------- toggle ----------
  const handleToggleItem = (catId: string, item: CheckItem) => {
    if (item.done) {
      // Desmarca — abre modal para editar ou apenas desmarca
      const prevDone = item.done;
      const prevNote = item.note;
      setCategories(prev => prev.map(c =>
        c.id !== catId ? c : { ...c, items: c.items.map(i => i.id !== item.id ? i : { ...i, done: false }) }
      ));
      supabase().from('implantacao_items').update({ done: false, note_question: null, note_answer: null, note_done_at: null, updated_at: new Date().toISOString() }).eq('id', item.id).then(() => {});
      pushUndo({ type: 'toggle_item', catId, itemId: item.id, prevDone, prevNote }, 'Item desmarcado.');
    } else {
      setCompletionModal({ catId, itemId: item.id, itemText: item.text, existingNote: item.note });
    }
  };

  const handleConfirmCompletion = async (answer: string) => {
    if (!completionModal) return;
    const { catId, itemId, itemText } = completionModal;
    const question = buildQuestion(itemText);
    const note: ItemNote = { question, answer, doneAt: new Date().toISOString() };

    const prevItem = categories.find(c => c.id === catId)?.items.find(i => i.id === itemId);

    setCategories(prev => prev.map(c =>
      c.id !== catId ? c : { ...c, items: c.items.map(i => i.id !== itemId ? i : { ...i, done: true, note }) }
    ));

    await supabase().from('implantacao_items').update({
      done: true,
      note_question: question,
      note_answer: answer,
      note_done_at: note.doneAt,
      updated_at: new Date().toISOString(),
    }).eq('id', itemId);

    pushUndo(
      { type: 'toggle_item', catId, itemId, prevDone: false, prevNote: prevItem?.note },
      'Item marcado como concluído.'
    );
    setCompletionModal(null);
  };

  // ---------- editar item ----------
  const startEditItem = (catId: string, item: CheckItem) => {
    setEditingItem({ catId, itemId: item.id });
    setEditText(item.text);
  };

  const saveEditItem = async () => {
    if (!editingItem || !editText.trim()) { setEditingItem(null); return; }
    const prevItem = categories.find(c => c.id === editingItem.catId)?.items.find(i => i.id === editingItem.itemId);
    pushUndo({ type: 'edit_item', catId: editingItem.catId, itemId: editingItem.itemId, prevText: prevItem?.text ?? '' }, 'Texto do item editado.');
    setCategories(prev => prev.map(c =>
      c.id !== editingItem.catId ? c : { ...c, items: c.items.map(i => i.id !== editingItem.itemId ? i : { ...i, text: editText.trim() }) }
    ));
    await supabase().from('implantacao_items').update({ text: editText.trim(), updated_at: new Date().toISOString() }).eq('id', editingItem.itemId);
    setEditingItem(null);
  };

  // ---------- deletar item ----------
  const deleteItem = async (catId: string, item: CheckItem) => {
    pushUndo({ type: 'delete_item', catId, item, position: item.position }, 'Item excluído.');
    setCategories(prev => prev.map(c =>
      c.id !== catId ? c : { ...c, items: c.items.filter(i => i.id !== item.id) }
    ));
    await supabase().from('implantacao_items').delete().eq('id', item.id);
  };

  // ---------- adicionar item ----------
  const saveAddItem = async () => {
    if (!addingItemCat || !addingItemText.trim()) { setAddingItemCat(null); return; }
    const cat = categories.find(c => c.id === addingItemCat);
    const position = cat ? cat.items.length : 0;
    const newItem: CheckItem = { id: uid(), text: addingItemText.trim(), done: false, position };
    setCategories(prev => prev.map(c =>
      c.id !== addingItemCat ? c : { ...c, items: [...c.items, newItem] }
    ));
    await supabase().from('implantacao_items').insert({ id: newItem.id, category_id: addingItemCat, text: newItem.text, done: false, position });
    pushUndo({ type: 'add_item', catId: addingItemCat, itemId: newItem.id }, 'Item adicionado.');
    setAddingItemCat(null);
    setAddingItemText('');
  };

  // ---------- editar categoria ----------
  const startEditCat = (cat: Category) => { setEditingCat(cat.id); setEditText(cat.title); };

  const saveEditCat = async () => {
    if (!editingCat || !editText.trim()) { setEditingCat(null); return; }
    const prev = categories.find(c => c.id === editingCat);
    pushUndo({ type: 'edit_cat', catId: editingCat, prevTitle: prev?.title ?? '' }, 'Categoria renomeada.');
    setCategories(prev => prev.map(c => c.id !== editingCat ? c : { ...c, title: editText.trim() }));
    await supabase().from('implantacao_categories').update({ title: editText.trim(), updated_at: new Date().toISOString() }).eq('id', editingCat);
    setEditingCat(null);
  };

  // ---------- deletar categoria ----------
  const deleteCat = async (cat: Category) => {
    if (!confirm('Remover esta categoria e todos os itens?')) return;
    pushUndo({ type: 'delete_cat', cat, position: cat.position }, 'Categoria excluída.');
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    await supabase().from('implantacao_categories').delete().eq('id', cat.id);
  };

  // ---------- adicionar categoria ----------
  const saveAddCat = async () => {
    if (!newCatText.trim()) { setAddingCat(false); return; }
    const position = categories.length;
    const newCat: Category = { id: uid(), title: newCatText.trim(), position, items: [] };
    setCategories(prev => [...prev, newCat]);
    await supabase().from('implantacao_categories').insert({ id: newCat.id, title: newCat.title, position });
    pushUndo({ type: 'add_cat', catId: newCat.id }, 'Categoria adicionada.');
    setAddingCat(false);
    setNewCatText('');
  };

  // ---------- UNDO ----------
  const handleUndo = async () => {
    if (!undoStack) return;
    const action = undoStack;
    clearUndo();

    switch (action.type) {
      case 'delete_item': {
        const { catId, item } = action;
        setCategories(prev => prev.map(c =>
          c.id !== catId ? c : { ...c, items: [...c.items, item].sort((a, b) => a.position - b.position) }
        ));
        await supabase().from('implantacao_items').insert({
          id: item.id, category_id: catId, text: item.text, done: item.done, position: item.position,
          note_question: item.note?.question ?? null,
          note_answer: item.note?.answer ?? null,
          note_done_at: item.note?.doneAt ?? null,
        });
        break;
      }
      case 'delete_cat': {
        const { cat } = action;
        setCategories(prev => [...prev, cat].sort((a, b) => a.position - b.position));
        await supabase().from('implantacao_categories').insert({ id: cat.id, title: cat.title, position: cat.position });
        for (const item of cat.items) {
          await supabase().from('implantacao_items').insert({
            id: item.id, category_id: cat.id, text: item.text, done: item.done, position: item.position,
            note_question: item.note?.question ?? null,
            note_answer: item.note?.answer ?? null,
            note_done_at: item.note?.doneAt ?? null,
          });
        }
        break;
      }
      case 'edit_item': {
        const { catId, itemId, prevText } = action;
        setCategories(prev => prev.map(c =>
          c.id !== catId ? c : { ...c, items: c.items.map(i => i.id !== itemId ? i : { ...i, text: prevText }) }
        ));
        await supabase().from('implantacao_items').update({ text: prevText, updated_at: new Date().toISOString() }).eq('id', itemId);
        break;
      }
      case 'edit_cat': {
        const { catId, prevTitle } = action;
        setCategories(prev => prev.map(c => c.id !== catId ? c : { ...c, title: prevTitle }));
        await supabase().from('implantacao_categories').update({ title: prevTitle, updated_at: new Date().toISOString() }).eq('id', catId);
        break;
      }
      case 'toggle_item': {
        const { catId, itemId, prevDone, prevNote } = action;
        setCategories(prev => prev.map(c =>
          c.id !== catId ? c : { ...c, items: c.items.map(i => i.id !== itemId ? i : { ...i, done: prevDone, note: prevNote }) }
        ));
        await supabase().from('implantacao_items').update({
          done: prevDone,
          note_question: prevNote?.question ?? null,
          note_answer: prevNote?.answer ?? null,
          note_done_at: prevNote?.doneAt ?? null,
          updated_at: new Date().toISOString(),
        }).eq('id', itemId);
        break;
      }
      case 'add_item': {
        const { catId, itemId } = action;
        setCategories(prev => prev.map(c =>
          c.id !== catId ? c : { ...c, items: c.items.filter(i => i.id !== itemId) }
        ));
        await supabase().from('implantacao_items').delete().eq('id', itemId);
        break;
      }
      case 'add_cat': {
        const { catId } = action;
        setCategories(prev => prev.filter(c => c.id !== catId));
        await supabase().from('implantacao_categories').delete().eq('id', catId);
        break;
      }
    }
  };

  const toggleCollapse = (catId: string) => setCollapsed(prev => ({ ...prev, [catId]: !prev[catId] }));

  const handleKey = (e: React.KeyboardEvent, save: () => void, cancel: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  // ---------- render ----------
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando dados de implantação...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 pb-16">

        {/* cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">
              Implantação do Programa Cívico-Militar
            </h1>
            <p className="text-xs text-slate-500">
              Acompanhe cada etapa — ao concluir um item, registre como foi realizado
            </p>
          </div>
        </div>

        {/* barra de progresso */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="text-3xl font-extrabold text-slate-800">{progress}%</span>
              <span className="ml-2 text-sm font-medium text-slate-500">{progressLabel}</span>
            </div>
            <span className="text-xs text-slate-400">{doneItems} de {totalItems} etapas</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: progress + '%' }}
            />
          </div>

          {/* mini barras por categoria */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map(cat => {
              const done = cat.items.filter(i => i.done).length;
              const total = cat.items.length;
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 truncate max-w-[90%]">{cat.title}</span>
                    <span className="text-xs font-semibold text-slate-600">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: pct + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* categorias */}
        {categories.map(cat => {
          const doneCat = cat.items.filter(i => i.done).length;
          const isCollapsed = collapsed[cat.id] ?? false;

          return (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* header da categoria */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <button onClick={() => toggleCollapse(cat.id)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {editingCat === cat.id ? (
                  <input
                    ref={inputRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => handleKey(e, saveEditCat, () => setEditingCat(null))}
                    className="flex-1 text-sm font-semibold text-slate-800 bg-white border border-blue-400 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <span className="flex-1 text-sm font-semibold text-slate-700">{cat.title}</span>
                )}

                <span className="text-xs text-slate-400 font-medium">{doneCat}/{cat.items.length}</span>

                {editingCat === cat.id ? (
                  <div className="flex gap-1">
                    <button onClick={saveEditCat} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingCat(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                    <button onClick={() => startEditCat(cat)} className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteCat(cat)} className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>

              {/* itens */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-50">
                  {cat.items.map(item => (
                    <div key={item.id} className={`group flex items-center gap-3 px-4 py-3 transition-colors ${item.done ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                      <button onClick={() => handleToggleItem(cat.id, item)} className="flex-shrink-0 transition-transform active:scale-90">
                        {item.done
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : <Circle className="w-5 h-5 text-slate-300 hover:text-blue-400 transition-colors" />
                        }
                      </button>

                      {editingItem?.catId === cat.id && editingItem.itemId === item.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            ref={inputRef}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => handleKey(e, saveEditItem, () => setEditingItem(null))}
                            className="flex-1 text-sm text-slate-800 bg-white border border-blue-400 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <button onClick={saveEditItem} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingItem(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <span className={`flex-1 text-sm leading-snug ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {item.text}
                          </span>

                          {item.done && item.note && (
                            <button
                              onClick={() => setNoteViewModal({ itemText: item.text, note: item.note!, catId: cat.id, itemId: item.id })}
                              className="text-xs font-medium text-blue-500 hover:text-blue-700 hover:underline transition-colors flex-shrink-0"
                            >
                              ver registro
                            </button>
                          )}

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => startEditItem(cat.id, item)} className="p-1 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteItem(cat.id, item)} className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* adicionar item */}
                  {addingItemCat === cat.id ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50/40">
                      <div className="w-5 h-5 flex-shrink-0" />
                      <input
                        ref={inputRef}
                        value={addingItemText}
                        onChange={e => setAddingItemText(e.target.value)}
                        onKeyDown={e => handleKey(e, saveAddItem, () => setAddingItemCat(null))}
                        placeholder="Descreva a nova etapa..."
                        className="flex-1 text-sm text-slate-800 bg-white border border-blue-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button onClick={saveAddItem} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setAddingItemCat(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingItemCat(cat.id)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-blue-600 hover:bg-blue-50/60 transition-colors w-full"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar etapa
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* adicionar categoria */}
        {addingCat ? (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-4 flex items-center gap-2">
            <input
              ref={inputRef}
              value={newCatText}
              onChange={e => setNewCatText(e.target.value)}
              onKeyDown={e => handleKey(e, saveAddCat, () => setAddingCat(false))}
              placeholder="Nome da nova categoria..."
              className="flex-1 text-sm text-slate-800 bg-slate-50 border border-blue-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={saveAddCat} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />Salvar
            </button>
            <button onClick={() => setAddingCat(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCat(true)}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-2xl border border-dashed border-slate-200 hover:border-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova categoria
          </button>
        )}
      </div>

      {/* Modais */}
      {completionModal && (
        <CompletionModal
          itemText={completionModal.itemText}
          existingNote={completionModal.existingNote}
          onConfirm={handleConfirmCompletion}
          onCancel={() => setCompletionModal(null)}
        />
      )}

      {noteViewModal && (
        <NoteViewModal
          itemText={noteViewModal.itemText}
          note={noteViewModal.note}
          onClose={() => setNoteViewModal(null)}
          onEdit={() => {
            const { catId, itemId, itemText, note } = noteViewModal;
            setNoteViewModal(null);
            setCompletionModal({ catId, itemId, itemText, existingNote: note, isEdit: true });
          }}
        />
      )}

      {/* Toast de Desfazer */}
      {undoToast && (
        <UndoToast
          message={undoToast}
          onUndo={handleUndo}
          onDismiss={clearUndo}
        />
      )}
    </AppShell>
  );
}
