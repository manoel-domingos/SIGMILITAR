import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? 'EECM Prof. João Batista';

export const metadata: Metadata = {
  title: `Gestão Disciplinar — ${schoolName}`,
  description: `Sistema de Gestão Disciplinar da ${schoolName}`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: schoolName,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-[#F8FAFC] text-slate-800 min-h-screen antialiased touch-manipulation" suppressHydrationWarning>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
