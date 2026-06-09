'use client';

import AppShell from '@/components/AppShell';
import { DrivePanel } from '@/components/drive/DrivePanel';
import { FolderOpen, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getDbSchoolId } from '@/lib/useTenantConfig';

const DRIVE_FOLDER_ID = '1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk';

export default function DocumentosPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.escola as string;
  const resolvedSchoolId = getDbSchoolId(schoolSlug);

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
          <DrivePanel 
            initialFolderId={DRIVE_FOLDER_ID}
            title="Pasta Disciplinar"
            schoolId={resolvedSchoolId}
          />
        </div>
      </div>
    </AppShell>
  );
}
