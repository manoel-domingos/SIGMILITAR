import React from 'react';
import { 
  AlertTriangle, CheckCircle, Info, Calendar, Clock, User, 
  ChevronLeft, ChevronRight, Activity 
} from 'lucide-react';
import { Ocorrencia, Acompanhamento, AgendaPreventiva } from '@/lib/data';

// Label Maps
export const VIOLENCIA_LABELS: Record<string, string> = {
  porte_arma: 'Porte de Arma',
  uso_arma: 'Uso de Arma',
  suspeita_porte_arma: 'Suspeita de Porte de Arma',
  vias_de_fato_rixas: 'Vias de Fato / Rixas',
  lesao_corporal: 'Lesão Corporal',
  tentativa_homicidio: 'Tentativa de Homicídio',
  homicidio: 'Homicídio',
  porte_drogas: 'Porte de Drogas',
  trafico_drogas: 'Tráfico de Drogas',
  consumo_entorpecentes: 'Consumo de Entorpecentes',
  ameaca_atentado_escola: 'Ameaça de Atentado à Escola',
  ameaca_estudante: 'Ameaça a Estudante',
  ameaca_profissional_educacao: 'Ameaça a Profissional de Educação',
  furto: 'Furto',
  roubo: 'Roubo',
  assalto: 'Assalto',
  danos_patrimonio_escolar: 'Danos ao Patrimônio Escolar',
  danos_patrimonio_terceiros: 'Danos ao Patrimônio de Terceiros',
  xingamentos_ofensas: 'Xingamentos / Ofensas',
  bullying: 'Bullying',
  racismo: 'Racismo',
  homofobia: 'Homofobia',
  xenofobia: 'Xenofobia',
  intolerancia_religiosa: 'Intolerância Religiosa',
  outro: 'Outro',
};

export const VIOLACAO_LABELS: Record<string, string> = {
  maus_tratos: 'Maus-Tratos',
  tentativa_suicidio: 'Tentativa de Suicídio',
  autolesao: 'Autolesão',
  violencia_psicologica: 'Violência Psicológica',
  violencia_fisica: 'Violência Física',
  violencia_sexual: 'Violência Sexual',
  outro: 'Outro'
};

export const TEMATICA_LABELS: Record<string, string> = {
  acolhimento: 'Acolhimento',
  bullying: 'Bullying / Cyberbullying',
  violencia_fisica: 'Violência Física',
  racismo: 'Racismo / Preconceito',
  intolerancia_religiosa: 'Intolerância Religiosa',
  violencia_contra_mulheres: 'Violência contra as Mulheres',
  sexualidade: 'Sexualidade e Efetividade',
  boa_convivencia: 'Cultura de Paz / Boa Convivência',
  diversidade_inclusao: 'Diversidade e Inclusão',
  saude_mental: 'Saúde Mental / Acolhimento Emocional',
  uso_substancias: 'Prevenção ao Uso de Substâncias',
  atrasos: 'Evasão / Pontualidade',
  outros: 'Outros Temas'
};

// 1. StatusBadge
export function StatusBadge({ status }: { status: Ocorrencia['status'] }) {
  const configs = {
    aberto: {
      bg: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20',
      label: 'Aberto',
      dot: 'bg-blue-500'
    },
    em_acompanhamento: {
      bg: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',
      label: 'Acompanhamento',
      dot: 'bg-amber-500'
    },
    encerrado: {
      bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20',
      label: 'Encerrado',
      dot: 'bg-emerald-500'
    }
  };

  const current = configs[status] || configs.aberto;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-sm transition-all duration-200 ${current.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
      {current.label}
    </span>
  );
}

// 2. ViolenciaTagList
export function ViolenciaTagList({ tipos }: { tipos: string[] }) {
  if (!tipos || tipos.length === 0) {
    return <span className="text-xs text-slate-400 italic">Nenhum</span>;
  }

  // Estilos de cor por gravidade dos tipos de violência
  const getStyle = (tipo: string) => {
    const graves = ['porte_arma', 'uso_arma', 'tentativa_homicidio', 'homicidio', 'violencia_sexual', 'autolesao', 'trafico_drogas'];
    const medias = ['lesao_corporal', 'porte_drogas', 'consumo_entorpecentes', 'ameaca_atentado_escola', 'roubo', 'assalto', 'bullying', 'racismo', 'homofobia', 'xenofobia'];
    
    if (graves.includes(tipo)) {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
    }
    if (medias.includes(tipo)) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="flex flex-wrap gap-1">
      {tipos.map((t) => (
        <span 
          key={t}
          className={`px-2 py-0.5 rounded-md border text-[10px] font-medium leading-none whitespace-nowrap shadow-sm ${getStyle(t)}`}
        >
          {VIOLENCIA_LABELS[t] || t}
        </span>
      ))}
    </div>
  );
}

// 3. FormStep
interface FormStepProps {
  current: number;
  total: number;
  labels: string[];
}

export function FormStep({ current, total, labels }: FormStepProps) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between">
        {labels.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < current;
          const isActive = stepNum === current;

          return (
            <React.Fragment key={idx}>
              {/* Step circle */}
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                    : isActive 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20 scale-105' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle className="w-4 h-4 text-white" /> : stepNum}
                </div>
                <span className={`text-[10px] font-semibold mt-1.5 max-w-[80px] text-center hidden sm:block ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}>
                  {label}
                </span>
              </div>

              {/* Progress Line */}
              {idx < total - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-slate-100 dark:bg-slate-700 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all duration-500 ease-in-out"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// 4. TimelineAcompanhamento
export function TimelineAcompanhamento({ entries }: { entries: Acompanhamento[] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-400 dark:text-slate-500 text-xs">
        <Info className="w-5 h-5 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
        Nenhum registro de acompanhamento cadastrado para este caso.
      </div>
    );
  }

  const getActionColor = (tipo?: string) => {
    switch (tipo) {
      case 'acolhimento': return 'bg-emerald-500';
      case 'encaminhamento': return 'bg-blue-500';
      case 'retorno': return 'bg-purple-500';
      case 'reuniao': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 py-2 ml-3">
      {entries.map((entry) => (
        <div key={entry.id} className="relative animate-in fade-in duration-200">
          {/* Node marker */}
          <span className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 ${getActionColor(entry.tipo_acao)} shadow`} />
          
          <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur border border-white/50 dark:border-slate-700/50 p-4 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/40 pb-1.5 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(entry.data_registro + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                {entry.tipo_acao || 'Ação'}
              </span>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {entry.descricao}
            </p>

            {entry.responsavel && (
              <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/30 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                <User className="w-3.5 h-3.5 text-slate-300" />
                <span>Responsável: <strong>{entry.responsavel}</strong></span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// 5. AgendaCalendar
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  eixo: string;
  tematica: string;
  status: string;
  raw: AgendaPreventiva;
}

export function AgendaCalendar({ events, onSelectEvent }: { events: AgendaPreventiva[], onSelectEvent?: (e: AgendaPreventiva) => void }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDayIndex = new Date(year, month + 1, 0).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Previous month padding days
  for (let i = firstDayIndex; i > 0; i--) {
    const d = prevMonthTotalDays - i + 1;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: false,
      isToday: false
    });
  }

  // Current month days
  const today = new Date();
  for (let i = 1; i <= totalDays; i++) {
    const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
    days.push({
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dayNum: i,
      isCurrentMonth: true,
      isToday
    });
  }

  // Next month padding days
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dayNum: i,
      isCurrentMonth: false,
      isToday: false
    });
  }

  const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Map events to date strings
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, AgendaPreventiva[]> = {};
    events.forEach(e => {
      if (e.data_inicio) {
        // Handle potential range of dates or just the start date
        const dateKey = e.data_inicio;
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(e);
      }
    });
    return map;
  }, [events]);

  const getEixoColor = (eixo?: string) => {
    switch (eixo) {
      case 'prevencao': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      case 'acao_intervencao': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'pos_violencia': return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300';
    }
  };

  return (
    <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl animate-in fade-in duration-300">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          {MONTHS_PT[month]} {year}
        </h3>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800 dark:hover:text-white transition shadow-sm active:scale-95 border border-transparent"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg hover:bg-white dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 border border-transparent"
          >
            Hoje
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800 dark:hover:text-white transition shadow-sm active:scale-95 border border-transparent"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week days labels */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {WEEK_DAYS.map(day => (
          <div key={day} className="text-xs font-bold text-slate-400 dark:text-slate-500 py-1 uppercase tracking-wider">{day}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.dateStr] || [];
          return (
            <div 
              key={idx}
              className={`min-h-[90px] p-2 rounded-2xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                cell.isCurrentMonth
                  ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/60'
                  : 'bg-slate-100/30 dark:bg-slate-900/10 border-transparent text-slate-400 dark:text-slate-600'
              } ${cell.isToday ? 'ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-slate-900 bg-blue-50/10' : ''}`}
            >
              {/* Day Number */}
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold ${
                  cell.isToday 
                    ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md' 
                    : cell.isCurrentMonth 
                      ? 'text-slate-700 dark:text-slate-350' 
                      : 'text-slate-400 dark:text-slate-650'
                }`}>
                  {cell.dayNum}
                </span>
                {dayEvents.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse sm:hidden" />
                )}
              </div>

              {/* Day Events list */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[56px] scrollbar-none hidden sm:block">
                {dayEvents.map(e => (
                  <button
                    key={e.id}
                    onClick={() => onSelectEvent && onSelectEvent(e)}
                    className={`w-full text-left px-1.5 py-0.5 rounded border text-[9px] font-bold leading-tight truncate active:scale-95 transition-all ${getEixoColor(e.eixo)}`}
                    title={`${e.titulo} (${TEMATICA_LABELS[e.tematica || ''] || e.tematica})`}
                  >
                    {e.titulo}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
