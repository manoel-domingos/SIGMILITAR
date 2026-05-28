'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import FichaNotificacaoForm from '@/components/FichaNotificacaoForm';

export default function VisualizarFichaPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="p-4 sm:p-8 min-h-screen pb-24">
      <FichaNotificacaoForm mode="visualizar" id={id} />
    </div>
  );
}
