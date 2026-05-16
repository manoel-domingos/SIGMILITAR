'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Circle, Plus, Trash2, Edit2, Check, X,
  ChevronDown, ChevronRight, Rocket, GripVertical,
} from 'lucide-react';

// ---------- tipos ----------
type CheckItem = {
  id: string;
  text: string;
  done: boolean;
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

const STORAGE_KEY = 'eecm_implantacao_v1';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

  // Persiste no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (editingItem || addingItemCat || editingCat || addingCat) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editingItem, addingItemCat, editingCat, addingCat]);

  // ---------- cálculo de progresso ----------
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
    progress < 75 ? 'Avancando' :
    progress < 100 ? 'Quase concluido' :
    'Concluido!';

  // ---------- handlers ----------
  const toggleItem = (catId: string, itemId: string) => {
    setCategories(prev => prev.map(c =>
      c.id !== catId ? c : {
        ...c,
        items: c.items.map(i => i.id !== itemId ? i : { ...i, done: !i.done }),
      }
    ));
  };

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
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* cabecalho */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Implantacao do Programa Civico-Militar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acompanhe e gerencie cada etapa da implementacao
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
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
                    className={'flex items-center gap-3 px-4 py-2.5 group transition-colors ' +
                      (item.done ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30')}
                  >
                    <button
                      onClick={() => toggleItem(cat.id, item.id)}
                      className="flex-shrink-0 transition-transform active:scale-90"
                      title={item.done ? 'Marcar como pendente' : 'Marcar como concluido'}
                    >
                      {item.done
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-500 hover:text-blue-400 transition-colors" />
                      }
                    </button>

                    {editingItem?.catId === cat.id && editingItem.itemId === item.id ? (
                      <input
                        ref={inputRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => handleKey(e, saveEditItem, () => setEditingItem(null))}
                        className="flex-1 text-sm bg-transparent border-b border-blue-400 focus:outline-none text-slate-800 dark:text-slate-100"
                      />
                    ) : (
                      <span
                        className={'flex-1 text-sm leading-snug select-none cursor-default ' +
                          (item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200')}
                      >
                        {item.text}
                      </span>
                    )}

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
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditItem(cat.id, item)}
                          className="p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(cat.id, item.id)}
                          className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
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
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
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

      {/* nova categoria */}
      {addingCat ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-700 px-4 py-3 flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
          <input
            ref={inputRef}
            value={newCatText}
            onChange={e => setNewCatText(e.target.value)}
            onKeyDown={e => handleKey(e, saveAddCat, () => setAddingCat(false))}
            placeholder="Nome da nova categoria..."
            className="flex-1 text-sm font-semibold bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button onClick={saveAddCat} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setAddingCat(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingCat(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-sm text-slate-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova categoria
        </button>
      )}
    </div>
  );
}
