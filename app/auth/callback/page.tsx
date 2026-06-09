'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import { getTenantSlugFromSchoolId } from '@/lib/useTenantConfig';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const { user, isAuthRestored, currentUserRole, currentUserSchoolId } = useAppContext();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 12_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timedOut && !user) {
      router.replace('/login?error=timeout');
      return;
    }

    // Aguarda user populado — isAuthRestored pode ser true antes da troca PKCE
    if (!user) return;

    if (currentUserRole === 'admin_global') {
      router.replace('/login');
      return;
    }

    const slug = getTenantSlugFromSchoolId(currentUserSchoolId);
    if (slug) {
      router.replace(currentUserRole === 'PROFESSOR' ? `/${slug}/registro-disciplinar` : `/${slug}`);
    } else if (currentUserSchoolId !== null && currentUserSchoolId !== undefined) {
      // school_id existe mas não mapeou slug
      router.replace('/login');
    }
    // se schoolId ainda null → aguarda próximo render
  }, [user, currentUserRole, currentUserSchoolId, router, timedOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">
          {timedOut ? 'Redirecionando...' : 'Processando login com Google...'}
        </p>
      </div>
    </div>
  );
}
