'use client';

import React from 'react';
import OcorrenciaForm from '@/components/OcorrenciaForm';

export default function NovaOcorrenciaPage() {
  return (
    <div className="p-4 sm:p-8 min-h-screen pb-24">
      <OcorrenciaForm mode="nova" />
    </div>
  );
}
