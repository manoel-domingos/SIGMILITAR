'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase as supabaseClient } from '@/lib/supabase';
import { Building2, ArrowLeft, Settings } from 'lucide-react';

const supabase = supabaseClient!;

export default function DreConfiguracoesPage() {
  const router = useRouter();
  const { currentUserRole, isAuthRestored } = useAppContext();

  const [creatingSchool, setCreatingSchool] = useState(false);
  const [newSchoolError, setNewSchoolError] = useState('');
  const [newSchoolOk, setNewSchoolOk] = useState('');
  const [newSchool, setNewSchool] = useState({ schoolName: '', slug: '', gestorName: '', gestorEmail: '', driveFolder: '' });

  // Acesso restrito ao admin_global.
  useEffect(() => {
    if (isAuthRestored && currentUserRole && currentUserRole !== 'admin_global') {
      router.replace('/');
    }
  }, [isAuthRestored, currentUserRole, router]);

  const slugPreview = newSchool.slug
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^eecm/, '');

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
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/dre')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#181A20] border border-[#2B2C33]/10 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-[#22252D]"
            aria-label="Voltar ao painel DRE"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#0052CC]" />
            <h1 className="text-xl font-black">Configuração do Sistema</h1>
          </div>
        </div>

        {/* Nova Escola */}
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
    </main>
  );
}
