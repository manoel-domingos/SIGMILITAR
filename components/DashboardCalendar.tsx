"use client";

import React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import { AgendaPreventiva } from "@/lib/data";
import { psicossocialService } from "@/lib/psicossocial-service";
import { useAppContext } from "@/lib/store";

const pad = (value: number) => String(value).padStart(2, "0");
const toDateKey = (date: Date) =>
  date.getFullYear() +
  "-" +
  pad(date.getMonth() + 1) +
  "-" +
  pad(date.getDate());
const fromDateKey = (key?: string) => {
  if (!key) return null;
  const [year, month, day] = key.substring(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

function eventContainsDay(event: AgendaPreventiva, dateKey: string) {
  const start = event.data_inicio?.substring(0, 10);
  const end = (event.data_fim || event.data_inicio)?.substring(0, 10);
  if (!start || !end) return false;
  return dateKey >= start && dateKey <= end;
}

function buildCalendarDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cells: Date[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--)
    cells.push(new Date(year, month - 1, previousMonthDays - i));
  for (let day = 1; day <= daysInMonth; day++)
    cells.push(new Date(year, month, day));
  while (cells.length < 42)
    cells.push(
      new Date(year, month + 1, cells.length - firstWeekday - daysInMonth + 1),
    );

  return cells;
}

const addDaysToDate = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(year, (month || 1) - 1, day || 1);
  next.setDate(next.getDate() + Math.max(days - 1, 0));
  return next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0') + '-' + String(next.getDate()).padStart(2, '0');
};

export default function DashboardCalendar() {
  const { activeSchoolContext, students, rules, user, addOccurrence } = useAppContext();
  const todayKey = toDateKey(new Date());
  const [cursor, setCursor] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState(todayKey);
  const [events, setEvents] = React.useState<AgendaPreventiva[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Estados do Modal de Criação Rápida
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [createType, setCreateType] = React.useState<'retencao' | 'preventiva'>('retencao');
  
  // Ação Preventiva
  const [prevTitle, setPrevTitle] = React.useState('');
  const [prevDesc, setPrevDesc] = React.useState('');
  const [prevTematica, setPrevTematica] = React.useState('acolhimento');
  const [prevEixo, setPrevEixo] = React.useState<'prevencao' | 'acao_intervencao' | 'pos_violencia'>('prevencao');
  const [prevPublico, setPrevPublico] = React.useState('todos');
  const [prevPeriodicidade, setPrevPeriodicidade] = React.useState('eventual');
  const [saving, setSaving] = React.useState(false);

  // Ocorrência de Retenção
  const [selectedStudentId, setSelectedStudentId] = React.useState('');
  const [searchStudent, setSearchStudent] = React.useState('');
  const [showStudentList, setShowStudentList] = React.useState(false);

  const [selectedRuleCode, setSelectedRuleCode] = React.useState<number>(26);
  const [searchRule, setSearchRule] = React.useState('');
  const [showRuleList, setShowRuleList] = React.useState(false);

  const [durationDays, setDurationDays] = React.useState(1);
  const [measureOverride, setMeasureOverride] = React.useState('');
  const [observations, setObservations] = React.useState('');

  const reloadEvents = React.useCallback(() => {
    setLoading(true);
    psicossocialService
      .fetchAgendaPreventiva(activeSchoolContext)
      .then((data) => {
        setEvents(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar calendário do dashboard:", err);
        setEvents([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeSchoolContext]);

  React.useEffect(() => {
    reloadEvents();
  }, [reloadEvents]);

  const filteredStudents = React.useMemo(() => {
    if (!searchStudent.trim()) return [];
    const term = searchStudent.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.class.toLowerCase().includes(term)
    );
  }, [students, searchStudent]);

  const filteredRules = React.useMemo(() => {
    const term = searchRule.toLowerCase();
    return rules.filter(
      (r) =>
        String(r.code).includes(term) ||
        r.description.toLowerCase().includes(term)
    );
  }, [rules, searchRule]);

  const handleSelectStudent = (id: string, name: string) => {
    setSelectedStudentId(id);
    setSearchStudent(name);
    setShowStudentList(false);
  };

  const handleSelectRule = (code: number, measure: string) => {
    setSelectedRuleCode(code);
    setMeasureOverride(measure);
    setShowRuleList(false);
    const ruleDesc = rules.find(r => r.code === code)?.description || '';
    setSearchRule(`Art. ${code} - ${ruleDesc.substring(0, 40)}...`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    try {
      setSaving(true);

      if (createType === 'preventiva') {
        if (!prevTitle.trim()) {
          alert('Por favor, informe o título da atividade.');
          setSaving(false);
          return;
        }

        await psicossocialService.addAgendaPreventiva({
          school_id: activeSchoolContext,
          titulo: prevTitle.trim(),
          descricao: prevDesc.trim(),
          tematica: prevTematica,
          eixo: prevEixo,
          data_inicio: selectedDate,
          data_fim: selectedDate,
          periodicidade: prevPeriodicidade,
          publico_alvo: prevPublico,
          status: 'planejado'
        }, activeSchoolContext, user?.id);

        alert('Atividade preventiva agendada!');
      } else {
        // Retenção Disciplinar
        if (!selectedStudentId) {
          alert('Por favor, selecione um aluno.');
          setSaving(false);
          return;
        }

        const studentObj = students.find(s => String(s.id) === String(selectedStudentId));
        const ruleObj = rules.find(r => r.code === selectedRuleCode);

        // 1. Cria ocorrência
        const occResult = await addOccurrence({
          studentId: selectedStudentId,
          studentIds: [selectedStudentId],
          date: selectedDate,
          hour: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          ruleCode: selectedRuleCode,
          ruleCodes: [selectedRuleCode],
          registeredBy: user?.name || user?.email || 'Calendário',
          observations: observations.trim() || `Retenção de intervalo agendada pelo calendário. Infração: Art. ${selectedRuleCode}.`,
          measure: measureOverride.trim() || ruleObj?.measure || 'Retenção de Intervalo',
          measures: [measureOverride.trim() || ruleObj?.measure || 'Retenção de Intervalo'],
          durationDays: durationDays,
          status: 'iniciada'
        });

        // 2. Sincroniza com a agenda
        const end = addDaysToDate(selectedDate, durationDays);
        await psicossocialService.syncDisciplinaryRetentionEvent({
          schoolId: activeSchoolContext,
          occurrenceId: occResult.id,
          studentId: selectedStudentId,
          studentName: studentObj?.name || 'Aluno',
          className: studentObj?.class,
          startDate: selectedDate,
          endDate: end,
          durationDays: durationDays,
          measure: measureOverride.trim() || ruleObj?.measure || 'Retenção de Intervalo',
          ruleCodes: [selectedRuleCode],
          userId: user?.id
        });

        alert('Retenção agendada com sucesso!');
      }

      // Reset states
      setPrevTitle('');
      setPrevDesc('');
      setSelectedStudentId('');
      setSearchStudent('');
      setObservations('');
      setDurationDays(1);
      setIsCreateModalOpen(false);
      reloadEvents();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar agendamento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const calendarDays = React.useMemo(() => buildCalendarDays(cursor), [cursor]);
  const selectedEvents = React.useMemo(
    () =>
      events.filter(
        (event) =>
          event.status !== "cancelado" && eventContainsDay(event, selectedDate),
      ),
    [events, selectedDate],
  );

  const eventDates = React.useMemo(() => {
    const set = new Set<string>();
    events
      .filter((event) => event.status !== "cancelado")
      .forEach((event) => {
        const start = fromDateKey(event.data_inicio);
        const end = fromDateKey(event.data_fim || event.data_inicio);
        if (!start || !end) return;
        const day = new Date(start);
        while (day <= end) {
          set.add(toDateKey(day));
          day.setDate(day.getDate() + 1);
        }
      });
    return set;
  }, [events]);

  const selectedLabel =
    fromDateKey(selectedDate)?.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }) || selectedDate;

  return (
    <section className="glass-card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            Calendário
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Agenda preventiva e retenções
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCursor(now);
              setSelectedDate(toDateKey(now));
            }}
            className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Hoje
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
          {weekDays.map((day, index) => (
            <span key={day + index}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const key = toDateKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const active = key === selectedDate;
            const hasEvent = eventDates.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={
                  "relative h-9 rounded-xl text-xs font-semibold transition-all " +
                  (active
                    ? "bg-indigo-600 text-white shadow-md"
                    : inMonth
                      ? "text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                      : "text-slate-300 dark:text-slate-600") +
                  (key === todayKey && !active
                    ? " ring-1 ring-indigo-300 dark:ring-indigo-500/60"
                    : "")
                }
              >
                {day.getDate()}
                {hasEvent && (
                  <span
                    className={
                      "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full " +
                      (active ? "bg-white" : "bg-indigo-500")
                    }
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 capitalize">
            {selectedLabel}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchStudent('');
                setSelectedStudentId('');
                setObservations('');
                setPrevTitle('');
                setPrevDesc('');
                setIsCreateModalOpen(true);
              }}
              className="text-[10px] font-extrabold uppercase bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white px-2 py-1 rounded-lg flex items-center gap-0.5 shadow-sm transition cursor-pointer"
            >
              + Agendar
            </button>
            <span className="text-[10px] font-bold text-slate-400">
              {selectedEvents.length} evento(s)
            </span>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {loading ? (
            <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : selectedEvents.length === 0 ? (
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
              Nenhum evento para o dia.
            </p>
          ) : (
            selectedEvents.map((event) => {
              const student = event.student_id
                ? students.find(
                    (s) => String(s.id) === String(event.student_id),
                  )
                : null;
              const className =
                (event.metadata as any)?.turma || student?.class;
              return (
                <article
                  key={event.id}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
                      {event.titulo}
                    </h4>
                    <span
                      className={
                        "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full " +
                        (event.source === "disciplinary_retention"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300")
                      }
                    >
                      {event.source === "disciplinary_retention"
                        ? "Retenção"
                        : event.status}
                    </span>
                  </div>
                  {student && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {student.name}
                      {className ? " • " + className : ""}
                    </p>
                  )}
                  {event.descricao && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {event.descricao}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-2">
                    {event.data_inicio && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.data_inicio.substring(0, 10)}
                        {event.data_fim && event.data_fim !== event.data_inicio
                          ? " até " + event.data_fim.substring(0, 10)
                          : ""}
                      </span>
                    )}
                    {className && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {className}
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Criação Rápida (Atividade Preventiva vs Retenção de Aluno) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                Agendar para {fromDateKey(selectedDate)?.toLocaleDateString('pt-BR') || selectedDate}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-655 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Abas */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCreateType('retencao')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${createType === 'retencao' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-505 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Retenção / Ocorrência
              </button>
              <button
                type="button"
                onClick={() => setCreateType('preventiva')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${createType === 'preventiva' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-505 hover:text-slate-750 dark:hover:text-slate-200'}`}
              >
                Ação Preventiva
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {createType === 'retencao' ? (
                <>
                  {/* Busca Aluno */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Selecionar Aluno *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchStudent}
                        onChange={(e) => {
                          setSearchStudent(e.target.value);
                          setSelectedStudentId('');
                          setShowStudentList(true);
                        }}
                        onFocus={() => setShowStudentList(true)}
                        placeholder="Pesquisar por nome ou turma..."
                        className="glass-input w-full text-xs pr-8"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                    
                    {showStudentList && filteredStudents.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl shadow-lg z-[9999999] max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                        {filteredStudents.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectStudent(s.id, s.name)}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex justify-between"
                          >
                            <span>{s.name}</span>
                            <span className="text-slate-400 font-medium font-mono">{s.class}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Busca Regra/Infração */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Infração (Artigo / Regra) *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchRule}
                        onChange={(e) => {
                          setSearchRule(e.target.value);
                          setShowRuleList(true);
                        }}
                        onFocus={() => setShowRuleList(true)}
                        placeholder="Pesquisar infração..."
                        className="glass-input w-full text-xs pr-8"
                      />
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>

                    {showRuleList && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-xl shadow-lg z-[9999999] max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                        {filteredRules.slice(0, 15).map(r => (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => handleSelectRule(r.code, r.measure)}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-255 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                          >
                            <span className="font-bold text-indigo-500 mr-1.5 font-mono">Art. {r.code}</span>
                            <span>{r.description.substring(0, 60)}...</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Duração (dias) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Duração (Dias)</label>
                      <input
                        type="number"
                        min={1}
                        value={durationDays}
                        onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="glass-input w-full text-xs"
                      />
                    </div>

                    {/* Medida pre-definida */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Medida Aplicada</label>
                      <input
                        type="text"
                        value={measureOverride}
                        onChange={(e) => setMeasureOverride(e.target.value)}
                        placeholder="Ex: Retenção de intervalo"
                        className="glass-input w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Relato / Obs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Relato da Ocorrência</label>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Relato sumário do comportamento que resultou na retenção..."
                      className="glass-input w-full min-h-[70px] text-xs py-1.5 px-3 leading-relaxed"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Título atividade */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Título da Atividade *</label>
                    <input
                      type="text"
                      value={prevTitle}
                      onChange={(e) => setPrevTitle(e.target.value)}
                      placeholder="Ex: Palestra sobre Bullying no Ambiente Escolar"
                      className="glass-input w-full text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Temática */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Temática</label>
                      <select
                        value={prevTematica}
                        onChange={(e) => setPrevTematica(e.target.value)}
                        className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                      >
                        <option value="acolhimento">Acolhimento</option>
                        <option value="bullying">Bullying / Cyberbullying</option>
                        <option value="violencia_fisica">Violência Física</option>
                        <option value="racismo">Racismo / Preconceito</option>
                        <option value="intolerancia_religiosa">Intolerância Religiosa</option>
                        <option value="violencia_contra_mulheres">Violência contra Mulheres</option>
                        <option value="sexualidade">Sexualidade e Efetividade</option>
                        <option value="boa_convivencia">Boa Convivência</option>
                        <option value="diversidade_inclusao">Diversidade e Inclusão</option>
                        <option value="saude_mental">Saúde Mental / Emoções</option>
                        <option value="uso_substancias">Prevenção ao Uso de Substâncias</option>
                        <option value="atrasos">Atitudes / Pontualidade</option>
                        <option value="outros">Outros Temas</option>
                      </select>
                    </div>

                    {/* Eixo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Eixo das Rotinas IV</label>
                      <select
                        value={prevEixo}
                        onChange={(e) => setPrevEixo(e.target.value as any)}
                        className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                      >
                        <option value="prevencao">Prevenção</option>
                        <option value="acao_intervencao">Ação e Intervenção</option>
                        <option value="pos_violencia">Pós-Violência</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Público Alvo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Público-Alvo</label>
                      <select
                        value={prevPublico}
                        onChange={(e) => setPrevPublico(e.target.value)}
                        className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                      >
                        <option value="todos">Todos</option>
                        <option value="estudantes">Estudantes</option>
                        <option value="professores">Professores</option>
                        <option value="pais">Pais e Responsáveis</option>
                      </select>
                    </div>

                    {/* Periodicidade */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Periodicidade</label>
                      <select
                        value={prevPeriodicidade}
                        onChange={(e) => setPrevPeriodicidade(e.target.value)}
                        className="glass-input w-full text-xs bg-transparent dark:bg-slate-900"
                      >
                        <option value="eventual">Eventual</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensal">Mensal</option>
                        <option value="bimestral">Bimestral</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
                    <textarea
                      value={prevDesc}
                      onChange={(e) => setPrevDesc(e.target.value)}
                      placeholder="Detalhes metodológicos..."
                      className="glass-input w-full min-h-[70px] text-xs py-1.5 px-3 leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-650 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 text-xs font-extrabold text-white bg-indigo-650 hover:bg-indigo-700 rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  {saving ? 'Salvando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
