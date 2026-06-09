'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase as supabaseClient } from '@/lib/supabase';
import { Building2, ArrowLeft, Settings, HardDrive, CheckCircle2, AlertCircle, Link2, FolderOpen } from 'lucide-react';
import { DriveModal, type DriveFile } from '@/components/drive/DriveModal';

const supabase = supabaseClient!;

interface DriveStatus {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
  driveFolderId: string | null;
}

export default function DreConfiguracoesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUserRole, isAuthRestored } = useAppContext();

  // Nova Escola
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [newSchoolError, setNewSchoolError] = useState('');
  const [newSchoolOk, setNewSchoolOk] = useState('');
  const [newSchool, setNewSchool] = useState({ schoolName: '', slug: '', gestorName: '', gestorEmail: '', driveFolder: '' });

  // Google Drive
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);
  const [driveMsg, setDriveMsg] = useState('');

  const SCHOOL_ID = 'dretga';

  useEffect(() => {
    if (isAuthRestored && currentUserRole && currentUserRole !== 'admin_global') {
      router.replace('/');
    }
  }, [isAuthRestored, currentUserRole, router]);

  const loadDriveStatus = useCallback(async () => {
    setDriveLoading(true);
    try {
      const res = await fetch(`/api/drive/oauth/status?schoolId=${SCHOOL_ID}`);
      const data = await res.json();
      setDriveStatus(data);
    } catch { /* silencioso */ } finally {
      setDriveLoading(false);
    }
  }, []);

  useEffect(() => { loadDriveStatus(); }, [loadDriveStatus]);

  // Trata retorno do callback OAuth
  useEffect(() => {
    const drive = searchParams.get('drive');
    if (drive === 'connected') {
      const email = searchParams.get('email') || '';
      setDriveMsg(`Drive conectado com sucesso${email ? ` como ${email}` : ''}.`);
      loadDriveStatus();
      // Limpa os params da URL sem reload
      const url = new URL(window.location.href);
      url.searchParams.delete('drive');
      url.searchParams.delete('email');
      window.history.replaceState({}, '', url.toString());
    } else if (drive === 'error') {
      setDriveMsg(`Erro: ${searchParams.get('msg') || 'Falha ao conectar.'}`);
    }
  }, [searchParams, loadDriveStatus]);

  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    setDriveMsg('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Sessão autenticada obrigatória.');

      // O endpoint redireciona para o Google — abrimos na mesma aba
      window.location.href = `/api/drive/oauth/connect?schoolId=${SCHOOL_ID}&_token=${encodeURIComponent(accessToken)}`;
    } catch (err: any) {
      setDriveMsg(`Erro: ${err.message}`);
      setConnectingDrive(false);
    }
  };

  const handleSelectFolder = async (folder: DriveFile) => {
    setShowFolderPicker(false);
    setSavingFolder(true);
    setDriveMsg('');
    try {
      const { error } = await supabase
        .from('school_settings')
        .upsert({ school_id: SCHOOL_ID, drive_folder_id: folder.id }, { onConflict: 'school_id' });
      if (error) throw error;
      setDriveMsg(`Pasta raiz definida: "${folder.name}"`);
      await loadDriveStatus();
    } catch (err: any) {
      setDriveMsg(`Erro ao salvar pasta: ${err.message}`);
    } finally {
      setSavingFolder(false);
    }
  };

  const slugPreview = newSchool.slug.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^eecm/, '');

  const handleCreateSchool = async () => {
    setNewSchoolError('');
    setNewSchoolOk('');
    if (!newSchool.schoolName.trim() || !slugPreview || !newSchool.gestorName.trim() || !newSchool.gestorEmail.trim()) {
      setNewSchoolError('Preencha nome da escola, slug, nome e e-mail do gestor.');
      return;
    }
    setCreatingSchool(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Sessão autenticada obrigatória.');

      const res = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          schoolName: newSchool.schoolName.trim(),
          slug: slugPreview,
          dreId: 'DRETGA',
          gestor: { email: newSchool.gestorEmail.trim().toLowerCase(), name: newSchool.gestorName.trim() },
          driveFolder: newSchool.driveFolder.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Falha ao criar escola.');

      setNewSchool({ schoolName: '', slug: '', gestorName: '', gestorEmail: '', driveFolder: '' });
      setNewSchoolOk(`Escola "${data.school?.name}" criada em sigmilitar.com.br/${data.slug}. O gestor ${data.gestor?.email} já pode entrar via Google.`);
    } catch (err: any) {
      setNewSchoolError(err.message || 'Erro ao criar escola.');
    } finally {
      setCreatingSchool(false);
    }
  };

  if (isAuthRestored && currentUserRole !== 'admin_global') return null;

  const inputCls = 'mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F1115] px-3 py-2 text-sm text-slate-800 dark:text-slate-100';

  return (
    <main className="min-h-screen bg-[#F4F5F7] dark:bg-[#0F1115] px-4 py-8 text-[#2B2C33] dark:text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dre')} className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#181A20] border border-[#2B2C33]/10 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-[#22252D]" aria-label="Voltar ao painel DRE">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#0052CC]" />
            <h1 className="text-xl font-black">Configuração do Sistema</h1>
          </div>
        </div>

        {/* ── Google Drive ── */}
        <section className="rounded-3xl bg-white dark:bg-[#181A20] p-6 shadow-sm border border-[#2B2C33]/10 dark:border-white/10">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-[#0052CC]" />
            <h2 className="text-lg font-black">Google Drive</h2>
          </div>

          {driveLoading ? (
            <p className="text-sm text-slate-400">Verificando conexão...</p>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div className={`flex items-start gap-3 rounded-2xl p-4 ${driveStatus?.connected ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                {driveStatus?.connected
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                }
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${driveStatus?.connected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>
                    {driveStatus?.connected ? 'Conectado' : 'Não conectado'}
                  </p>
                  {driveStatus?.connected && driveStatus.email && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">{driveStatus.email}</p>
                  )}
                  {driveStatus?.connected && driveStatus.connectedAt && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Desde {new Date(driveStatus.connectedAt).toLocaleDateString('pt-BR')}</p>
                  )}
                  {driveStatus?.driveFolderId && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">Pasta: <span className="font-mono">{driveStatus.driveFolderId}</span></p>
                  )}
                </div>
              </div>

              {driveMsg && (
                <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${driveMsg.startsWith('Erro') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>{driveMsg}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleConnectDrive}
                  disabled={connectingDrive}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0052CC] px-4 py-2 text-sm font-bold text-white hover:bg-[#003d99] disabled:opacity-50 transition"
                >
                  <Link2 className="h-4 w-4" />
                  {driveStatus?.connected ? 'Reconectar Drive' : 'Conectar Drive'}
                </button>
                <button
                  onClick={() => setShowFolderPicker(true)}
                  disabled={savingFolder}
                  className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#0F1115] border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  <FolderOpen className="h-4 w-4" />
                  {savingFolder ? 'Salvando...' : 'Trocar pasta raiz'}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">O gestor autoriza uma vez. Todos os uploads vão para a conta dele, sem 403 de cota.</p>
            </div>
          )}
        </section>

        {/* ── Nova Escola ── */}
        <section className="rounded-3xl bg-white dark:bg-[#181A20] p-6 shadow-sm border border-[#2B2C33]/10 dark:border-white/10">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0052CC]" />
            <h2 className="text-lg font-black">Nova Escola</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Nome da escola</label>
              <input value={newSchool.schoolName} onChange={(e) => setNewSchool(s => ({ ...s, schoolName: e.target.value }))} placeholder="EECM Prof. João Batista" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Slug (endereço)</label>
              <input value={newSchool.slug} onChange={(e) => setNewSchool(s => ({ ...s, slug: e.target.value }))} placeholder="joaobatista" className={inputCls} />
              <p className="mt-1 text-[11px] text-slate-400">sigmilitar.com.br/<span className="font-bold text-[#0052CC]">{slugPreview || '...'}</span></p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Nome do gestor</label>
              <input value={newSchool.gestorName} onChange={(e) => setNewSchool(s => ({ ...s, gestorName: e.target.value }))} placeholder="Maria Silva" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">E-mail do gestor (login Google)</label>
              <input value={newSchool.gestorEmail} onChange={(e) => setNewSchool(s => ({ ...s, gestorEmail: e.target.value }))} placeholder="gestor@edu.mt.gov.br" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">ID da pasta do Drive (opcional)</label>
              <input value={newSchool.driveFolder} onChange={(e) => setNewSchool(s => ({ ...s, driveFolder: e.target.value }))} placeholder="ID do Drive Compartilhado" className={inputCls} />
            </div>

            {newSchoolError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{newSchoolError}</p>}
            {newSchoolOk && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{newSchoolOk}</p>}

            <button onClick={handleCreateSchool} disabled={creatingSchool} className="w-full rounded-xl bg-[#0052CC] px-4 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#003d99] disabled:opacity-50">
              {creatingSchool ? 'Criando...' : 'Criar escola'}
            </button>
            <p className="text-center text-[11px] text-slate-400">Aplica regras padrão (DRETGA) e libera o e-mail do gestor.</p>
          </div>
        </section>
      </div>

      {/* Picker de pasta raiz */}
      {showFolderPicker && (
        <DriveModal
          open={showFolderPicker}
          onClose={() => setShowFolderPicker(false)}
          schoolId={SCHOOL_ID}
          selectFolderMode
          onSelectFolder={handleSelectFolder}
        />
      )}
    </main>
  );
}
