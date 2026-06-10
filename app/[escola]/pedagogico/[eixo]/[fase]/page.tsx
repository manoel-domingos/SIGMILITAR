// app/[escola]/pedagogico/[eixo]/[fase]/page.tsx
// Rota legada — redireciona para a nova página do eixo (modelo 2 abas)
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function FaseRedirect() {
  const router = useRouter();
  const params = useParams();
  const { escola, eixo } = params as { escola: string; eixo: string };

  useEffect(() => {
    router.replace(`/${escola}/pedagogico/${eixo}`);
  }, [escola, eixo, router]);

  return null;
}
