'use client'

import { useCallback, useState } from 'react'
import { Upload, TableIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FICAIUploadProps {
  onFile: (file: File) => void
  loading: boolean
  compact?: boolean
}

export function FICAIUpload({ onFile, loading, compact = false }: FICAIUploadProps) {
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

  if (compact) {
    return (
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border-2 border-dashed p-4 text-center sm:text-left transition-all duration-200 animate-in fade-in duration-300',
          dragging
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 hover:border-slate-350 dark:hover:border-slate-700'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white dark:bg-slate-850 p-2.5 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
            <TableIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">Importar Planilha de Frequência DRE (CSV)</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Suba o novo arquivo para atualizar o status e as faltas dos alunos no painel
            </p>
          </div>
        </div>

        <label className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-extrabold transition-all active:scale-95 shadow-sm shrink-0',
          'border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
          loading && 'pointer-events-none opacity-50'
        )}>
          <Upload className="h-3.5 w-3.5 text-slate-500" />
          {loading ? 'Processando...' : 'Carregar nova planilha'}
          <input
            type="file"
            accept=".csv"
            className="sr-only"
            disabled={loading}
            onChange={e => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>
    )
  }

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
