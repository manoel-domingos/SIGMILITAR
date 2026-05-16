'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { supabase as supabaseClient } from '@/lib/supabase';
import {
  Building2, Users, AlertTriangle, Star, TrendingUp,
  ArrowRight, RefreshCw, ShieldCheck, Activity,
} from 'lucide-react';

const supabase = supabaseClient!;

interface SchoolStats {
  id: string;
  name: string;
  students: number;
  occurrences: number;
  praises: number;
  accidents: number;
  leves: number;
  medias: number;
  graves: number;
}

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

function KPICard({ label, value, icon, color, sub }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
      <div className={'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ' + color}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DrePage() {
  const router = useRouter();
  const { currentUserRole, currentUserSchoolId, setActiveSchoolContext, students, occurrences, praises, accidents } = useAppContext();

  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<SchoolStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard — só DRE/admin_global acessa
  useEffect(() => {
    if (currentUserRole !== 'admin_global' && currentUserSchoolId !== 'DRE') {
      router.replace('/');
    }
  }, [currentUserRole, currentUserSchoolId, router]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: schoolsData } = await supabase.from('schools').select('id, name').order('name');
        const list = (schoolsData ?? []).filter((s: any) => s.id !== 'DRE');
        setSchools(list);

        // Para cada escola, busca contagens
        const statsArr: SchoolStats[] = await Promise.all(
          list.map(async (school: { id: string; name: string }) => {
            const [
              { count: stCount },
              { data: occData },
              { count: prCount },
              { count: acCount },
            ] = await Promise.all([
              supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', school.id).eq('archived', false),
              supabase.from('occurrences').select('severity').eq('school_id', school.id),
              supabase.from('praises').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
              supabase.from('accidents').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
            ]);

            const occ = occData ?? [];
            return {
              id: school.id,
              name: school.name,
              students: stCount ?? 0,
              occurrences: occ.length,
              praises: prCount ?? 0,
              accidents: acCount ?? 0,
              leves:  occ.filter((o: any) => o.severity === 'Leve').length,
              medias: occ.filter((o: any) => o.severity === 'Media').length,
              graves: occ.filter((o: any) => o.severity === 'Grave').length,
            };
          })
        );
        setStats(statsArr);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // KPIs consolidados
  const totalStudents    = stats.reduce((s, x) => s + x.students, 0);
  const totalOccurrences = stats.reduce((s, x) => s + x.occurrences, 0);
  const totalPraises     = stats.reduce((s, x) => s + x.praises, 0);
  const totalAccidents   = stats.reduce((s, x) => s + x.accidents, 0);
  const totalGraves      = stats.reduce((s, x) => s + x.graves, 0);

  function handleSelectSchool(schoolId: string) {
    setActiveSchoolContext(schoolId);
    router.push('/');
  }

  if (currentUserRole !== 'admin_global') return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Painel DRE</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visao consolidada de todas as escolas da rede</p>
        </div>
        {loading && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin ml-auto" />}
      </div>

      {/* KPIs consolidados */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Totais Consolidados</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard
            label="Alunos Ativos"
            value={totalStudents}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            color="bg-blue-50 dark:bg-blue-500/10"
          />
          <KPICard
            label="Ocorrencias"
            value={totalOccurrences}
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            color="bg-amber-50 dark:bg-amber-500/10"
            sub={`${totalGraves} graves`}
          />
          <KPICard
            label="Elogios"
            value={totalPraises}
            icon={<Star className="w-5 h-5 text-emerald-600" />}
            color="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <KPICard
            label="Acidentes"
            value={totalAccidents}
            icon={<Activity className="w-5 h-5 text-rose-600" />}
            color="bg-rose-50 dark:bg-rose-500/10"
          />
          <KPICard
            label="Escolas Ativas"
            value={stats.length}
            icon={<Building2 className="w-5 h-5 text-violet-600" />}
            color="bg-violet-50 dark:bg-violet-500/10"
          />
        </div>
      </section>

      {/* Grade de escolas */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Escolas da Rede</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : stats.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhuma escola encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map(school => (
              <div
                key={school.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{school.name}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{school.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectSchool(school.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition opacity-0 group-hover:opacity-100"
                  >
                    Ver painel <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mini KPIs */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{school.students}</p>
                    <p className="text-[10px] text-slate-400">Alunos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{school.occurrences}</p>
                    <p className="text-[10px] text-slate-400">Ocorr.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{school.praises}</p>
                    <p className="text-[10px] text-slate-400">Elogios</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{school.graves}</p>
                    <p className="text-[10px] text-slate-400">Graves</p>
                  </div>
                </div>

                {/* Barra de severidade */}
                {school.occurrences > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] text-slate-400 mb-1">Distribuicao de ocorrencias</p>
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                      {school.leves > 0 && (
                        <div
                          className="bg-amber-300 dark:bg-amber-500 rounded-full"
                          style={{ width: `${(school.leves / school.occurrences) * 100}%` }}
                          title={`Leves: ${school.leves}`}
                        />
                      )}
                      {school.medias > 0 && (
                        <div
                          className="bg-orange-400 dark:bg-orange-500 rounded-full"
                          style={{ width: `${(school.medias / school.occurrences) * 100}%` }}
                          title={`Medias: ${school.medias}`}
                        />
                      )}
                      {school.graves > 0 && (
                        <div
                          className="bg-rose-500 dark:bg-rose-600 rounded-full"
                          style={{ width: `${(school.graves / school.occurrences) * 100}%` }}
                          title={`Graves: ${school.graves}`}
                        />
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-amber-500">L: {school.leves}</span>
                      <span className="text-[10px] text-orange-500">M: {school.medias}</span>
                      <span className="text-[10px] text-rose-500">G: {school.graves}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
