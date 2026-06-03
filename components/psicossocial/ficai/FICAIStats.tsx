import {
  Users, AlertTriangle, Flame, FileWarning, Send, Phone, FileX
} from 'lucide-react'
import type { FICAIStats } from '@/types/ficai'

interface FICAIStatsProps {
  stats: FICAIStats
}

export function FICAIStatsCards({ stats }: FICAIStatsProps) {
  const cards = [
    { label: 'Total alunos',    value: stats.total,           icon: Users,         variant: 'default' },
    { label: 'Em alerta',       value: stats.comAlerta,       icon: AlertTriangle, variant: 'warning' },
    { label: 'Alerta grave',    value: stats.alertaGrave,     icon: Flame,         variant: 'danger'  },
    { label: 'FICAI necessária',value: stats.ficaiNecessaria, icon: FileX,         variant: 'danger'  },
    { label: 'FICAI aberta',    value: stats.ficaiAberta,     icon: FileWarning,   variant: 'info'    },
    { label: 'Encaminhados',    value: stats.encaminhados,    icon: Send,          variant: 'success' },
    { label: 'Com telefone',    value: stats.comTelefone,     icon: Phone,         variant: 'default' },
  ] as const

  const variantClasses: Record<string, string> = {
    default: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350 shadow-sm',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm shadow-amber-500/5',
    danger:  'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-450 shadow-sm shadow-rose-500/5',
    info:    'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm shadow-blue-500/5',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/5',
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 animate-in fade-in duration-300">
      {cards.map(card => {
        const Icon = card.icon
        const cls = variantClasses[card.variant]
        return (
          <div key={card.label} className={`rounded-2xl border p-4 flex flex-col justify-between ${cls}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-85">
              <Icon className="h-4 w-4 shrink-0" />
              {card.label}
            </div>
            <p className="text-3xl font-black text-slate-850 dark:text-slate-100 mt-2 leading-none">{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}
