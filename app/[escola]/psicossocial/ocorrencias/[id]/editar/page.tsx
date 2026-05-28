'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import OcorrenciaForm from '@/components/OcorrenciaForm';

export default function EditarOcorrenciaPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="p-4 sm:p-8 min-h-screen pb-24">
      <OcorrenciaForm mode="editar" id={id} />
    </div>
  );
}
