'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '../components/LandingPage';

// Fallback: quando o OAuth do Google redireciona para / em vez de /auth/callback
// (acontece se /auth/callback ainda não estiver na lista do Supabase),
// detecta o ?code= e encaminha para a rota correta.
export default function Home() {
  const router = useRouter();
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      setIsOAuthCallback(true);
      router.replace(`/auth/callback?${params.toString()}`);
    }
  }, [router]);

  if (isOAuthCallback) return null;

  return <LandingPage />;
}
