'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Upload, Lock, Loader2, Check } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [footerSlug, setFooterSlug] = useState('');
  const [footerText, setFooterText] = useState('');

  // Revoke object URL when preview changes (memory cleanup)
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    setLogoFile(null);
    setLoading(true);
    Promise.all([
      supabase.from('school_settings')
        .select('print_logo_url, print_footer_lines')
        .eq('school_id', schoolId)
        .maybeSingle(),
      supabase.from('schools')
        .select('name')
        .eq('id', schoolId)
        .maybeSingle(),
    ]).then(([{ data: ss }, { data: sc }]: [{ data: any }, { data: any }]) => {
      const slug = sc?.name ? `E.E Cívico-Militar ${sc.name}` : '';
      setFooterSlug(slug);
      setLogoPreview(ss?.print_logo_url || null);
      const allLines = Array.isArray(ss?.print_footer_lines) ? ss.print_footer_lines : [];
      setFooterText(linesToText(allLines.slice(1)));
    }).finally(() => setLoading(false));
  }, [open, schoolId, supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMsg({ t: 'err', m: 'Imagem deve ter no máximo 2 MB.' });
      return;
    }
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      let resolvedLogoUrl: string | null = logoPreview?.startsWith('blob:') ? null : (logoPreview || null);

      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'png';
        const path = `school-logos/${schoolId}/logo.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('student-files')
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('student-files').getPublicUrl(path);
        resolvedLogoUrl = pub?.publicUrl || null;
      }

      const footerLines = footerSlug
        ? [footerSlug, ...textToLines(footerText)]
        : textToLines(footerText);

      const payload = {
        school_id: schoolId,
        print_logo_url: resolvedLogoUrl,
        print_header_lines: null,
        print_footer_lines: footerLines.length ? footerLines : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('school_settings').upsert(payload, { onConflict: 'school_id' });
      if (error) throw error;

      setSchoolPrintConfig(schoolId, {
        logoUrl: resolvedLogoUrl,
        seducLogoUrl: null,
        headerLines: null,
        footerLines: payload.print_footer_lines,
      });

      window.dispatchEvent(new CustomEvent('printFooterConfigured'));

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
              <p className="text-[11px] text-slate-400">Logo e rodapé das ATAs e documentos (vindos do BD).</p>
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
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Logo da escola */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Logo da escola</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Upload className="w-3.5 h-3.5" />
                  {logoFile ? logoFile.name : 'Escolher imagem'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    className="text-xs text-slate-400 hover:text-rose-500 transition"
                  >
                    Remover
                  </button>
                )}
              </div>
              {logoPreview && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex">
                  <img
                    src={logoPreview}
                    alt="Preview logo"
                    className="h-16 max-w-[160px] object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rodapé</label>

              {/* Slug line (readonly) */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {footerSlug || <span className="italic">Nome da escola (carregando...)</span>}
                </span>
              </div>

              <textarea
                className={inputCls + ' font-mono text-xs leading-relaxed'}
                rows={4}
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                placeholder={'(65) 3329-1021\nAv. Ismael José do Nascimento nº 892-N\nCEP 78.300-152 – TANGARÁ DA SERRA/MT\nescola.16020@edu.mt.gov.br'}
              />
              <p className="text-[10px] text-slate-400">Primeira linha (nome da escola) é automática.</p>
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
