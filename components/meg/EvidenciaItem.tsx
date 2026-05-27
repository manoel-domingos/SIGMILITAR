// components/meg/EvidenciaItem.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, AlertTriangle, HelpCircle, Loader2, Paperclip, 
  Trash2, FileText, ExternalLink, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EvidenciaItemProps {
  evidencia: {
    id: string;
    nome: string;
    descricao: string;
  };
  checklist?: {
    status: string;
    observacao: string;
    arquivo_url: string;
    atualizado_por: string;
    atualizado_em: string;
  };
  schoolId: string;
  eixoNome: string;
  faseNome: string;
  currentUser: any;
  readonly: boolean;
  onSaveSuccess: (msg: string) => void;
  onSaveError: (msg: string) => void;
}

export default function EvidenciaItem({
  evidencia,
  checklist,
  schoolId,
  eixoNome,
  faseNome,
  currentUser,
  readonly,
  onSaveSuccess,
  onSaveError
}: EvidenciaItemProps) {
  // Local state for optimistic updates
  const [status, setStatus] = useState<string>('pendente');
  const [observacao, setObservacao] = useState<string>('');
  const [arquivoUrl, setArquivoUrl] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when props change
  useEffect(() => {
    if (checklist) {
      setStatus(checklist.status || 'pendente');
      setObservacao(checklist.observacao || '');
      setArquivoUrl(checklist.arquivo_url || '');
    } else {
      setStatus('pendente');
      setObservacao('');
      setArquivoUrl('');
    }
  }, [checklist]);

  // Rotates status: pendente -> em_andamento -> concluido -> pendente
  const handleCycleStatus = async () => {
    if (readonly || loading) return;

    let nextStatus = 'pendente';
    if (status === 'pendente') nextStatus = 'em_andamento';
    else if (status === 'em_andamento') nextStatus = 'concluido';

    const previousStatus = status;
    
    // 1. Optimistic Update in UI
    setStatus(nextStatus);
    
    try {
      setLoading(true);
      
      // 2. Perform DB operations via supabase upsert
      const { error } = await supabase
        .from('meg_checklist')
        .upsert({
          school_id: schoolId,
          evidencia_id: evidencia.id,
          status: nextStatus,
          observacao: observacao,
          arquivo_url: arquivoUrl,
          atualizado_por: currentUser?.name || currentUser?.email || 'Sistema',
          atualizado_em: new Date().toISOString()
        }, {
          onConflict: 'school_id,evidencia_id'
        });

      if (error) throw error;

      // 3. Dispatch global 'meg-edit' event for the NotificationBell
      window.dispatchEvent(new CustomEvent('meg-edit', {
        detail: { school: schoolId, eixo: eixoNome, fase: faseNome }
      }));

      onSaveSuccess(`Evidência "${evidencia.nome}" atualizada para: ${
        nextStatus === 'concluido' ? 'Concluído' : 
        nextStatus === 'em_andamento' ? 'Em Andamento' : 'Pendente'
      }`);

    } catch (err: any) {
      // 4. Rollback in case of DB failure
      setStatus(previousStatus);
      onSaveError(`Falha ao atualizar evidência: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Handles updating the text observation on input blur
  const handleBlurObservation = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const nextObs = e.target.value.trim();
    if (readonly || loading || nextObs === (checklist?.observacao || '')) return;

    const previousObs = observacao;
    setObservacao(nextObs);

    try {
      setLoading(true);
      const { error } = await supabase
        .from('meg_checklist')
        .upsert({
          school_id: schoolId,
          evidencia_id: evidencia.id,
          status: status,
          observacao: nextObs,
          arquivo_url: arquivoUrl,
          atualizado_por: currentUser?.name || currentUser?.email || 'Sistema',
          atualizado_em: new Date().toISOString()
        }, {
          onConflict: 'school_id,evidencia_id'
        });

      if (error) throw error;

      // Dispatch event to track edits
      window.dispatchEvent(new CustomEvent('meg-edit', {
        detail: { school: schoolId, eixo: eixoNome, fase: faseNome }
      }));

      onSaveSuccess('Observação salva com sucesso.');
    } catch (err: any) {
      setObservacao(previousObs);
      onSaveError(`Falha ao salvar observação: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle uploading files into Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (readonly || uploading || !file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${schoolId}/${evidencia.id}-${Date.now()}.${fileExt}`;
      const filePath = `evidencias/${fileName}`;

      // Upload file to the 'meg-evidencias' storage bucket
      const { data, error: uploadError } = await supabase.storage
        .from('meg-evidencias')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meg-evidencias')
        .getPublicUrl(filePath);

      const previousUrl = arquivoUrl;
      setArquivoUrl(publicUrl);

      // Save checklist record with the new file url
      const { error: upsertError } = await supabase
        .from('meg_checklist')
        .upsert({
          school_id: schoolId,
          evidencia_id: evidencia.id,
          status: status,
          observacao: observacao,
          arquivo_url: publicUrl,
          atualizado_por: currentUser?.name || currentUser?.email || 'Sistema',
          atualizado_em: new Date().toISOString()
        }, {
          onConflict: 'school_id,evidencia_id'
        });

      if (upsertError) {
        setArquivoUrl(previousUrl);
        throw upsertError;
      }

      // Dispatch event
      window.dispatchEvent(new CustomEvent('meg-edit', {
        detail: { school: schoolId, eixo: eixoNome, fase: faseNome }
      }));

      onSaveSuccess('Arquivo anexado com sucesso.');

    } catch (err: any) {
      onSaveError(`Falha no upload do arquivo: ${err.message || err}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clears attached file
  const handleRemoveFile = async () => {
    if (readonly || loading) return;

    const previousUrl = arquivoUrl;
    setArquivoUrl('');

    try {
      setLoading(true);
      const { error } = await supabase
        .from('meg_checklist')
        .upsert({
          school_id: schoolId,
          evidencia_id: evidencia.id,
          status: status,
          observacao: observacao,
          arquivo_url: '',
          atualizado_por: currentUser?.name || currentUser?.email || 'Sistema',
          atualizado_em: new Date().toISOString()
        }, {
          onConflict: 'school_id,evidencia_id'
        });

      if (error) throw error;

      onSaveSuccess('Anexo removido.');
    } catch (err: any) {
      setArquivoUrl(previousUrl);
      onSaveError(`Falha ao remover anexo: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Status-specific color configurations
  const statusStyles = {
    pendente: {
      border: 'border-slate-200 dark:border-slate-700/60',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500',
      badge: 'bg-slate-50 dark:bg-slate-800/30 text-slate-500 border-slate-200/50 dark:border-slate-700/50',
      text: 'Pendente',
      icon: HelpCircle
    },
    em_andamento: {
      border: 'border-amber-400 dark:border-amber-500/40',
      bg: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 shadow-sm shadow-amber-500/5',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      text: 'Em Andamento',
      icon: AlertTriangle
    },
    concluido: {
      border: 'border-emerald-500 dark:border-emerald-600/40',
      bg: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shadow-sm shadow-emerald-500/5',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      text: 'Concluído',
      icon: CheckCircle
    }
  };

  const currentStyle = (statusStyles as any)[status] || statusStyles.pendente;
  const StatusIcon = currentStyle.icon;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300 flex flex-col md:flex-row gap-4 md:items-start group relative ${currentStyle.border}`}>
      
      {/* 3-State Checkbox Indicator */}
      <button
        onClick={handleCycleStatus}
        disabled={readonly || loading}
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 active:scale-90 ${
          readonly ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
        } ${currentStyle.bg} ${currentStyle.border}`}
        title={readonly ? 'Visualização somente leitura' : 'Clique para mudar o estado (Pendente -> Em Andamento -> Concluído)'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <StatusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>

      {/* Info details */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-snug">
              {evidencia.nome}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
              {evidencia.descricao}
            </p>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 w-fit ${currentStyle.badge}`}>
            {currentStyle.text}
          </span>
        </div>

        {/* Observation text area */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Observações e Comentários
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            onBlur={handleBlurObservation}
            disabled={readonly || loading}
            placeholder={readonly ? 'Sem observações cadastradas.' : 'Digite as observações e saia do campo para salvar automaticamente...'}
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-75 disabled:cursor-not-allowed transition resize-none leading-relaxed"
          />
        </div>

        {/* Footer info (Metadata + File attachment link) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            {checklist?.atualizado_por ? (
              <>
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Modificado por:
                </span>
                <span>{checklist.atualizado_por}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>
                  {new Date(checklist.atualizado_em).toLocaleDateString('pt-BR')} às {new Date(checklist.atualizado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : (
              <span className="italic">Nenhum registro de atualização.</span>
            )}
          </div>

          {/* Attachment Management */}
          <div className="flex items-center gap-2">
            {arquivoUrl ? (
              <div className="flex items-center gap-1.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <a
                  href={arquivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  Ver Evidência <ExternalLink className="w-2.5 h-2.5" />
                </a>
                {!readonly && (
                  <>
                    <span className="text-blue-200 dark:text-slate-800">|</span>
                    <button
                      onClick={handleRemoveFile}
                      disabled={loading}
                      className="text-rose-500 hover:text-rose-600 p-0.5 rounded transition"
                      title="Remover anexo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              !readonly && (
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    disabled={uploading}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2 py-1 rounded-lg transition font-bold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 active:scale-95"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-3 h-3" />
                        Anexar arquivo
                      </>
                    )}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
