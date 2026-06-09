'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabase';
import { setSchoolPrintConfig } from '@/lib/print-header';

interface PrintHeaderModalProps {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  onSaved?: () => void;
}

const linesToText = (v: unknown): string =>
  Array.isArray(v) ? (v as string[]).join('\n') : '';

const textToLines = (t: string): string[] =>
  t.split('\n').map(l => l.trim()).filter(Boolean);

export default function PrintHeaderModal({ open, onClose, schoolId, onSaved }: PrintHeaderModalProps) {
  const supabase = supabaseClient!;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [seducLogoUrl, setSeducLogoUrl] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    setLoading(true);
    supabase
      .from('school_settings')
      .select('print_logo_url, print_seduc_logo_url, print_header_lines, print_footer_lines')
      .eq('school_id', schoolId)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        setLogoUrl(data?.print_logo_url || '');
        setSeducLogoUrl(data?.print_seduc_logo_url || '');
        setHeaderText(linesToText(data?.print_header_lines));
        setFooterText(linesToText(data?.print_footer_lines));
      })
      .then(() => setLoading(false));
  }, [open, schoolId, supabase]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const headerLines = textToLines(headerText);
      const footerLines = textToLines(footerText);
      const payload = {
        school_id: schoolId,
        print_logo_url: logoUrl.trim() || null,
        print_seduc_logo_url: seducLogoUrl.trim() || null,
        print_header_lines: headerLines.length ? headerLines : null,
        print_footer_lines: footerLines.length ? footerLines : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('school_settings').upsert(payload, { onConflict: 'school_id' });
      if (error) throw error;

      // Reflete imediatamente nos builders de impressão, sem reload
      setSchoolPrintConfig(schoolId, {
        logoUrl: payload.print_logo_url,
        seducLogoUrl: payload.print_seduc_logo_url,
        headerLines: payload.print_header_lines,
        footerLines: payload.print_footer_lines,
      });

      setMsg({ t: 'ok', m: 'Cabeçalho salvo. As próximas impressões já usam estes dados.' });
      onSaved?.();
      setTimeout(() => onClose(), 900);
    } catch (err: any) {
      setMsg({ t: 'err', m: err.message || 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const inputCls = 'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return createPortal(
    <div className="fixed inset-0 z-[9996] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Cabeçalho de Impressão</h3>
              <p className="text-[11px] text-slate-400">Logo, cabeçalho e rodapé das ATAs e documentos (vindos do BD).</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Logo da escola (URL)</label>
                <input className={inputCls} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="/schools/.../logo.png" />
                {logoUrl && <img src={logoUrl} alt="" className="h-12 object-contain mt-1" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Logo SEDUC/Governo (URL)</label>
                <input className={inputCls} value={seducLogoUrl} onChange={e => setSeducLogoUrl(e.target.value)} placeholder="/logo-seduc-mt.svg (padrão)" />
                {seducLogoUrl && <img src={seducLogoUrl} alt="" className="h-12 object-contain mt-1" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Linhas do cabeçalho (uma por linha)
              </label>
              <textarea
                className={inputCls + ' font-mono text-xs leading-relaxed'}
                rows={4}
                value={headerText}
                onChange={e => setHeaderText(e.target.value)}
                placeholder={'GOVERNO DO ESTADO DE MATO GROSSO\nSECRETARIA DE ESTADO DE EDUCAÇÃO\nESCOLA ESTADUAL CÍVICO-MILITAR\nPROF. JOÃO BATISTA'}
              />
              <p className="text-[10px] text-slate-400">Vazio = usa o padrão da escola.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Linhas do rodapé (uma por linha)</label>
              <textarea
                className={inputCls + ' font-mono text-xs leading-relaxed'}
                rows={5}
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                placeholder={'E.E Cívico-Militar Prof. João Batista\n(65) 3329-1021\nAv. Ismael José do Nascimento nº 892-N\nCEP 78.300-152 – TANGARÁ DA SERRA/MT\nescola.16020@edu.mt.gov.br'}
              />
              <p className="text-[10px] text-slate-400">Vazio = usa o padrão da escola.</p>
            </div>

            {msg && (
              <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${msg.t === 'err' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>{msg.m}</p>
            )}
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-xs font-semibold border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="flex-1 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar cabeçalho'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
