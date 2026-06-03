import { FICAIPanel } from '@/components/psicossocial/ficai/FICAIPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FICAI · Psicossocial | SIGMILITAR',
  description: 'Painel de infrequência escolar e acompanhamento da FICAI',
}

export default function FICAIPage() {
  return (
    <main className="container max-w-7xl space-y-6 py-6">
      <FICAIPanel />
    </main>
  )
}
