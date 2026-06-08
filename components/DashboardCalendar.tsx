"use client";

import React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
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

export default function DashboardCalendar() {
  const { activeSchoolContext, students } = useAppContext();
  const todayKey = toDateKey(new Date());
  const [cursor, setCursor] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState(todayKey);
  const [events, setEvents] = React.useState<AgendaPreventiva[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    psicossocialService
      .fetchAgendaPreventiva(activeSchoolContext)
      .then((data) => {
        if (alive) setEvents(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar calendário do dashboard:", err);
        if (alive) setEvents([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [activeSchoolContext]);

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
          <span className="text-[10px] font-bold text-slate-400">
            {selectedEvents.length} evento(s)
          </span>
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
    </section>
  );
}
