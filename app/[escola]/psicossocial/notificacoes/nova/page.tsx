'use client';

import React from 'react';
import FichaNotificacaoForm from '@/components/FichaNotificacaoForm';

export default function NovaFichaPage() {
  return (
    <div className="p-4 sm:p-8 min-h-screen pb-24">
      <FichaNotificacaoForm mode="nova" />
    </div>
  );
}
