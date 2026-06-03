'use client'

import { useCallback, useState } from 'react'
import { Upload, TableIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FICAIUploadProps {
  onFile: (file: File) => void
  loading: boolean
}

export function FICAIUpload({ onFile, loading }: FICAIUploadProps) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (file) onFile(file)
    },
    [onFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile]
  )

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-200',
        dragging
          ? 'border-blue-500 bg-blue-500/5'
          : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-400 dark:hover:border-slate-700'
      )}
    >
      <div className="rounded-2xl bg-white dark:bg-slate-850 p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <TableIcon className="h-8 w-8 text-blue-500" />
      </div>

      <div className="space-y-1">
        <p className="text-base font-bold text-slate-800 dark:text-slate-200">Planilha de Frequência FICAI</p>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Arraste o arquivo CSV ou clique para selecionar
        </p>
      </div>

      <label className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 shadow-sm',
        'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350',
        loading && 'pointer-events-none opacity-50'
      )}>
        <Upload className="h-4 w-4 text-slate-500" />
        {loading ? 'Processando...' : 'Selecionar arquivo'}
        <input
          type="file"
          accept=".csv"
          className="sr-only"
          disabled={loading}
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </label>

      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {['Nome Aluno', 'Cod Aluno', '% Faltas', 'FICAI', '→ cruza Supabase', 'Telefone'].map(t => (
          <span
            key={t}
            className="rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950/60 px-2.5 py-1 text-[10px] font-bold text-slate-450 dark:text-slate-500"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
