'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { DrivePanel } from '@/components/drive/DrivePanel';
import { FolderOpen, ArrowLeft, Info } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getDbSchoolId } from '@/lib/useTenantConfig';

export default function DocumentosPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.escola as string;
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  useEffect(() => {
    const loadDriveFolder = async () => {
      const schoolId = getDbSchoolId(schoolSlug);
      const { data, error } = await supabase
        .from('school_settings')
        .select('drive_folder_id')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar pasta disciplinar:', error);
        setDriveFolderId(null);
        return;
      }

      setDriveFolderId(data?.drive_folder_id || null);
    };

    loadDriveFolder();
  }, [schoolSlug]);

  return (
    <AppShell>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 space-y-6">
        
        {/* Navigation Header */}
        <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-5">
          <button
            onClick={() => router.push(`/${schoolSlug}/registro-disciplinar`)}
            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline font-bold self-start"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar para Registro Disciplinar
          </button>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
              <FolderOpen size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                Documentos Disciplinares
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Repositório de arquivos e documentos da coordenação disciplinar e pedagógica.
              </p>
            </div>
          </div>
        </div>

        {/* Gorgeous integrated DrivePanel */}
        <div className="flex-1 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-1 shadow-sm flex flex-col min-h-[600px] animate-in fade-in duration-300">
          {driveFolderId ? (
            <DrivePanel
              initialFolderId={driveFolderId}
              title="Pasta Disciplinar"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mb-4">
                <Info className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Configure seu Google Drive para usar este painel</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                Ambiente novo começa sem pasta do Drive. Cadastre o ID da pasta em Configurações → Integrações quando quiser habilitar documentos.
              </p>
              <Link href={`/${schoolSlug}/configuracoes?tab=status`} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition">
                Configurar Drive
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
