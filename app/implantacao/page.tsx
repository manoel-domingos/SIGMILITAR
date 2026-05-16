'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/AppShell';
import {
  CheckCircle2, Circle, Plus, Trash2, Edit2, Check, X,
  ChevronDown, ChevronRight, Rocket, GripVertical,
  FileText, ClipboardCheck,
} from 'lucide-react';

// ---------- tipos ----------
type ItemNote = {
  question: string;   // pergunta contextual gerada pelo título
  answer: string;     // resposta da pessoa
  doneAt: string;     // ISO timestamp
};

type CheckItem = {
  id: string;
  text: string;
  done: boolean;
  note?: ItemNote;
};

type Category = {
  id: string;
  title: string;
  items: CheckItem[];
};

// ---------- dados iniciais ----------
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    title: 'Estrutura Administrativa',
    items: [
      { id: 'i-1-1', text: 'Designar Gestor Cívico Educacional (G1)', done: false },
      { id: 'i-1-2', text: 'Designar Gestor Adjunto (G2)', done: false },
      { id: 'i-1-3', text: 'Nomear Coordenadores de Turno', done: false },
      { id: 'i-1-4', text: 'Escalar equipe de Monitores por turno', done: false },
      { id: 'i-1-5', text: 'Definir organograma e linha de comando', done: false },
    ],
  },
  {
    id: 'cat-2',
    title: 'Documentação e Normas',
    items: [
      { id: 'i-2-1', text: 'Elaborar Regimento Interno adaptado ao modelo cívico-militar', done: false },
      { id: 'i-2-2', text: 'Publicar normas de conduta e disciplina', done: false },
      { id: 'i-2-3', text: 'Criar formulários padrão (ATA, Termo, Convocação)', done: false },
      { id: 'i-2-4', text: 'Aprovar Regimento junto à SEDUC', done: false },
      { id: 'i-2-5', text: 'Distribuir manual do aluno e da família', done: false },
    ],
  },
  {
    id: 'cat-3',
    title: 'Capacitação da Equipe',
    items: [
      { id: 'i-3-1', text: 'Realizar treinamento de gestão disciplinar', done: false },
      { id: 'i-3-2', text: 'Capacitar monitores em mediação de conflitos', done: false },
      { id: 'i-3-3', text: 'Treinar uso do sistema de registro disciplinar', done: false },
      { id: 'i-3-4', text: 'Realizar simulação de rotinas cívico-militares', done: false },
    ],
  },
  {
    id: 'cat-4',
    title: 'Infraestrutura Escolar',
    items: [
      { id: 'i-4-1', text: 'Instalar câmeras de segurança em áreas comuns', done: false },
      { id: 'i-4-2', text: 'Sinalizar zonas de circulação e postos de monitoramento', done: false },
      { id: 'i-4-3', text: 'Organizar fardamento e identificação visual dos alunos', done: false },
      { id: 'i-4-4', text: 'Instalar sistema de controle de entrada/saída', done: false },
      { id: 'i-4-5', text: 'Adequar sala de coordenação disciplinar', done: false },
    ],
  },
  {
    id: 'cat-5',
    title: 'Rotinas e Rituais Cívicos',
    items: [
      { id: 'i-5-1', text: 'Implementar hasteamento de bandeira diário', done: false },
      { id: 'i-5-2', text: 'Estabelecer rotina de formatura matinal', done: false },
      { id: 'i-5-3', text: 'Criar calendário de datas cívicas comemorativas', done: false },
      { id: 'i-5-4', text: 'Instituir hino nacional no início das aulas', done: false },
    ],
  },
  {
    id: 'cat-6',
    title: 'Tecnologia e Sistema',
    items: [
      { id: 'i-6-1', text: 'Implantar sistema de registro disciplinar digital', done: false },
      { id: 'i-6-2', text: 'Cadastrar todos os alunos no sistema', done: false },
      { id: 'i-6-3', text: 'Configurar usuários e permissões de acesso', done: false },
      { id: 'i-6-4', text: 'Integrar sistema com banco de dados na nuvem', done: false },
      { id: 'i-6-5', text: 'Treinar equipe no uso do sistema de ocorrências', done: false },
      { id: 'i-6-6', text: 'Habilitar módulo de relatórios e dashboards', done: false },
    ],
  },
  {
    id: 'cat-7',
    title: 'Comunicação com Família',
    items: [
      { id: 'i-7-1', text: 'Realizar reunião de apresentação do modelo às famílias', done: false },
      { id: 'i-7-2', text: 'Coletar assinatura do Termo de Ciência das Normas', done: false },
      { id: 'i-7-3', text: 'Estabelecer canal de comunicação escola-família', done: false },
      { id: 'i-7-4', text: 'Divulgar calendário de convocações e reuniões', done: false },
    ],
  },
  {
    id: 'cat-8',
    title: 'Acompanhamento e Melhoria',
    items: [
      { id: 'i-8-1', text: 'Realizar reuniões quinzenais de avaliação disciplinar', done: false },
      { id: 'i-8-2', text: 'Revisar indicadores de ocorrências mensalmente', done: false },
      { id: 'i-8-3', text: 'Aplicar pesquisa de clima escolar semestralmente', done: false },
      { id: 'i-8-4', text: 'Elaborar relatório anual de desempenho do programa', done: false },
    ],
  },
];

const STORAGE_KEY = 'eecm_implantacao_v2';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Gera pergunta contextual baseada no texto do item
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
    return 'Como foi implementado? Descreva o que foi feito, fornecedores envolvidos e data de conclusão.';
  if (text.includes('reunião') || text.includes('reunioes') || text.includes('formatura') || text.includes('hasteamento'))
    return 'Como foi definido? Descreva a rotina estabelecida, responsáveis e horários.';
  if (text.includes('integrar') || text.includes('configurar') || text.includes('habilitar') || text.includes('implantar'))
    return 'Como foi configurado? Descreva os passos realizados e quem executou.';
  if (text.includes('distribuir') || text.includes('divulgar'))
    return 'Como foi feita a distribuição/divulgação? Informe os canais utilizados e o alcance.';
  return 'Como foi definido e implementado? Descreva brevemente o processo e as decisões tomadas.';
}

// Formata data
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ---------- Modal de conclusao ----------
type ModalProps = {
  itemText: string;
  existingNote?: ItemNote;
  onConfirm: (answer: string) => void;
  onCancel: () => void;
};

function CompletionModal({ itemText, existingNote, onConfirm, onCancel }: ModalProps) {
  const question = buildQuestion(itemText);
  const [answer, setAnswer] = useState(existingNote?.answer ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* card */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-0.5">
              Etapa concluída
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
              {itemText}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* corpo */}
        <div className="p-5 space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {question}
          </label>
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Descreva aqui como foi realizado..."
            rows={4}
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Esta informação será usada na geração do relatório de implantação.
          </p>
        </div>

        {/* acoes */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(answer.trim())}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirmar conclusão
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Modal de leitura da nota ----------
type NoteViewProps = {
  itemText: string;
  note: ItemNote;
  onEdit: () => void;
  onClose: () => void;
};

function NoteViewModal({ itemText, note, onEdit, onClose }: NoteViewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">Registro da etapa</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{itemText}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{note.question}</p>
          {note.answer ? (
            <p className="text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap">
              {note.answer}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">Nenhuma observação registrada.</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">Concluído em {formatDate(note.doneAt)}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            Fechar
          </button>
          <button onClick={onEdit} className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            Editar registro
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- componente principal ----------
export default function ImplantacaoPage() {
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_CATEGORIES;
  });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<{ catId: string; itemId: string } | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [addingItemCat, setAddingItemCat] = useState<string | null>(null);
  const [addingItemText, setAddingItemText] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newCatText, setNewCatText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal de conclusao
  const [completionModal, setCompletionModal] = useState<{
    catId: string;
    itemId: string;
    itemText: string;
    existingNote?: ItemNote;
    isEdit?: boolean;
  } | null>(null);

  // Modal de visualizacao de nota
  const [noteViewModal, setNoteViewModal] = useState<{
    itemText: string;
    note: ItemNote;
    catId: string;
    itemId: string;
  } | null>(null);

  // Persiste no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (editingItem || addingItemCat || editingCat || addingCat) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editingItem, addingItemCat, editingCat, addingCat]);

  // ---------- calculo de progresso ----------
  const allItems = categories.flatMap(c => c.items);
  const totalItems = allItems.length;
  const doneItems = allItems.filter(i => i.done).length;
  const progress = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

  const progressColor =
    progress < 25 ? 'bg-rose-500' :
    progress < 50 ? 'bg-amber-500' :
    progress < 75 ? 'bg-blue-500' :
    progress < 100 ? 'bg-emerald-500' :
    'bg-emerald-600';

  const progressLabel =
    progress < 25 ? 'Iniciando' :
    progress < 50 ? 'Em andamento' :
    progress < 75 ? 'Avançando' :
    progress < 100 ? 'Quase concluído' :
    'Concluído!';

  // ---------- handlers de toggle ----------
  const handleToggleItem = (catId: string, item: CheckItem) => {
    if (item.done) {
      // Desmarca direto sem modal
      setCategories(prev => prev.map(c =>
        c.id !== catId ? c : {
          ...c,
          items: c.items.map(i => i.id !== item.id ? i : { ...i, done: false }),
        }
      ));
    } else {
      // Abre modal de conclusao
      setCompletionModal({
        catId,
        itemId: item.id,
        itemText: item.text,
        existingNote: item.note,
      });
    }
  };

  const handleConfirmCompletion = (answer: string) => {
    if (!completionModal) return;
    const { catId, itemId, itemText } = completionModal;
    const question = buildQuestion(itemText);
    const note: ItemNote = { question, answer, doneAt: new Date().toISOString() };
    setCategories(prev => prev.map(c =>
      c.id !== catId ? c : {
        ...c,
        items: c.items.map(i => i.id !== itemId ? i : { ...i, done: true, note }),
      }
    ));
    setCompletionModal(null);
  };

  const handleCancelCompletion = () => setCompletionModal(null);

  // ---------- outros handlers ----------
  const startEditItem = (catId: string, item: CheckItem) => {
    setEditingItem({ catId, itemId: item.id });
    setEditText(item.text);
  };

  const saveEditItem = () => {
    if (!editingItem || !editText.trim()) { setEditingItem(null); return; }
    setCategories(prev => prev.map(c =>
      c.id !== editingItem.catId ? c : {
        ...c,
        items: c.items.map(i => i.id !== editingItem.itemId ? i : { ...i, text: editText.trim() }),
      }
    ));
    setEditingItem(null);
  };

  const deleteItem = (catId: string, itemId: string) => {
    setCategories(prev => prev.map(c =>
      c.id !== catId ? c : { ...c, items: c.items.filter(i => i.id !== itemId) }
    ));
  };

  const startAddItem = (catId: string) => {
    setAddingItemCat(catId);
    setAddingItemText('');
  };

  const saveAddItem = () => {
    if (!addingItemCat || !addingItemText.trim()) { setAddingItemCat(null); return; }
    const newItem: CheckItem = { id: uid(), text: addingItemText.trim(), done: false };
    setCategories(prev => prev.map(c =>
      c.id !== addingItemCat ? c : { ...c, items: [...c.items, newItem] }
    ));
    setAddingItemCat(null);
    setAddingItemText('');
  };

  const startEditCat = (cat: Category) => {
    setEditingCat(cat.id);
    setEditText(cat.title);
  };

  const saveEditCat = () => {
    if (!editingCat || !editText.trim()) { setEditingCat(null); return; }
    setCategories(prev => prev.map(c =>
      c.id !== editingCat ? c : { ...c, title: editText.trim() }
    ));
    setEditingCat(null);
  };

  const deleteCat = (catId: string) => {
    if (!confirm('Remover esta categoria e todos os itens?')) return;
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const saveAddCat = () => {
    if (!newCatText.trim()) { setAddingCat(false); return; }
    const newCat: Category = { id: uid(), title: newCatText.trim(), items: [] };
    setCategories(prev => [...prev, newCat]);
    setAddingCat(false);
    setNewCatText('');
  };

  const toggleCollapse = (catId: string) => {
    setCollapsed(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleKey = (e: React.KeyboardEvent, save: () => void, cancel: () => void) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  // ---------- render ----------
  return (
    <AppShell>
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* cabecalho */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Implantação do Programa Cívico-Militar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhe cada etapa — ao concluir um item, registre como foi realizado
          </p>
        </div>
      </div>

      {/* barra de progresso */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{progress}%</span>
            <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">{progressLabel}</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">{doneItems} de {totalItems} itens</span>
        </div>
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={'h-full rounded-full transition-all duration-700 ease-out ' + progressColor}
            style={{ width: progress + '%' }}
          />
        </div>
        <div className="mt-3 flex gap-3 flex-wrap">
          {categories.map(cat => {
            const catDone = cat.items.filter(i => i.done).length;
            const catTotal = cat.items.length;
            const catPct = catTotal === 0 ? 0 : Math.round((catDone / catTotal) * 100);
            return (
              <div key={cat.id} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={'h-full rounded-full ' + (catPct === 100 ? 'bg-emerald-500' : 'bg-blue-400')}
                    style={{ width: catPct + '%' }}
                  />
                </div>
                <span className="truncate max-w-[100px]">{cat.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* categorias */}
      {categories.map(cat => {
        const catDone = cat.items.filter(i => i.done).length;
        const catTotal = cat.items.length;
        const isCollapsed = collapsed[cat.id];

        return (
          <div
            key={cat.id}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group"
          >
            {/* header da categoria */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <button
                onClick={() => toggleCollapse(cat.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                {isCollapsed
                  ? <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                }
                {editingCat === cat.id ? (
                  <input
                    ref={inputRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => handleKey(e, saveEditCat, () => setEditingCat(null))}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 text-sm font-semibold bg-transparent border-b border-blue-400 focus:outline-none text-slate-800 dark:text-slate-100"
                  />
                ) : (
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex-1">{cat.title}</span>
                )}
              </button>

              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums flex-shrink-0">
                {catDone}/{catTotal}
              </span>

              {editingCat === cat.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={saveEditCat} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingCat(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditCat(cat)}
                    title="Renomear categoria"
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCat(cat.id)}
                    title="Remover categoria"
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* itens */}
            {!isCollapsed && (
              <ul className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {cat.items.map(item => (
                  <li
                    key={item.id}
                    className={'flex items-center gap-3 px-4 py-2.5 group/item transition-colors ' +
                      (item.done ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30')}
                  >
                    {/* botao de check */}
                    <button
                      onClick={() => handleToggleItem(cat.id, item)}
                      className="flex-shrink-0 transition-transform active:scale-90"
                      title={item.done ? 'Desmarcar' : 'Marcar como concluído'}
                    >
                      {item.done
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-500 hover:text-blue-400 transition-colors" />
                      }
                    </button>

                    {/* texto ou input de edicao */}
                    {editingItem?.catId === cat.id && editingItem.itemId === item.id ? (
                      <input
                        ref={inputRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => handleKey(e, saveEditItem, () => setEditingItem(null))}
                        className="flex-1 text-sm bg-transparent border-b border-blue-400 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <span
                          className={'text-sm leading-snug select-none cursor-default ' +
                            (item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200')}
                        >
                          {item.text}
                        </span>
                        {/* indicador de nota registrada */}
                        {item.done && item.note && (
                          <button
                            onClick={() => setNoteViewModal({ itemText: item.text, note: item.note!, catId: cat.id, itemId: item.id })}
                            className="ml-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                            title="Ver registro"
                          >
                            <FileText className="w-3 h-3" />
                            ver registro
                          </button>
                        )}
                        {/* indicador sem nota */}
                        {item.done && !item.note?.answer && (
                          <button
                            onClick={() => setCompletionModal({ catId: cat.id, itemId: item.id, itemText: item.text, existingNote: item.note, isEdit: true })}
                            className="ml-2 inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-700 hover:underline transition-colors"
                            title="Adicionar registro"
                          >
                            + adicionar registro
                          </button>
                        )}
                      </div>
                    )}

                    {/* acoes inline */}
                    {editingItem?.catId === cat.id && editingItem.itemId === item.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={saveEditItem} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingItem(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditItem(cat.id, item)}
                          className="p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Editar texto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(cat.id, item.id)}
                          className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}

                {/* adicionar item */}
                {addingItemCat === cat.id ? (
                  <li className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/50 dark:bg-blue-900/10">
                    <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    <input
                      ref={inputRef}
                      value={addingItemText}
                      onChange={e => setAddingItemText(e.target.value)}
                      onKeyDown={e => handleKey(e, saveAddItem, () => setAddingItemCat(null))}
                      placeholder="Novo item..."
                      className="flex-1 text-sm bg-transparent border-b border-blue-400 focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    <button onClick={saveAddItem} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setAddingItemCat(null)} className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ) : (
                  <li>
                    <button
                      onClick={() => startAddItem(cat.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar item
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}

      {/* adicionar categoria */}
      {addingCat ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-700 p-4 flex items-center gap-3">
          <input
            ref={inputRef}
            value={newCatText}
            onChange={e => setNewCatText(e.target.value)}
            onKeyDown={e => handleKey(e, saveAddCat, () => setAddingCat(false))}
            placeholder="Nome da nova categoria..."
            className="flex-1 text-sm bg-transparent border-b border-blue-400 focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button onClick={saveAddCat} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setAddingCat(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setAddingCat(true); setNewCatText(''); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-400 hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova categoria
        </button>
      )}
    </div>

    {/* Modal de conclusao */}
    {completionModal && (
      <CompletionModal
        itemText={completionModal.itemText}
        existingNote={completionModal.existingNote}
        onConfirm={handleConfirmCompletion}
        onCancel={handleCancelCompletion}
      />
    )}

    {/* Modal de visualizacao */}
    {noteViewModal && (
      <NoteViewModal
        itemText={noteViewModal.itemText}
        note={noteViewModal.note}
        onEdit={() => {
          setCompletionModal({
            catId: noteViewModal.catId,
            itemId: noteViewModal.itemId,
            itemText: noteViewModal.itemText,
            existingNote: noteViewModal.note,
            isEdit: true,
          });
          setNoteViewModal(null);
        }}
        onClose={() => setNoteViewModal(null)}
      />
    )}

    </AppShell>
  );
}
