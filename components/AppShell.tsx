'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/store';
import {
  LayoutDashboard, Users, FileText, Activity,
  BarChart, AlertTriangle, Star, CheckSquare, FileBadge,
  UserPlus, Award, Menu, X, LogOut, ShieldAlert,
  Sun, Moon, RefreshCw, CloudCheck, CloudOff, MessageCircle, Settings,
  ChevronDown,
  GraduationCap, Gavel, Smile, Cog, Clock, KeyRound, Eye, EyeOff, Loader2, FolderOpen, Rocket, ShieldCheck, Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import versionData from '@/lib/version.json';
import AIChat from '@/components/AIChat';

type MenuItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type MenuGroup = { label: string; icon: React.ComponentType<{ className?: string }>; href?: string; children?: MenuItem[] };

const MENU_GROUPS: MenuGroup[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  {
    label: 'Alunos', icon: GraduationCap,
    children: [
      { href: '/alunos', label: 'Lista de Alunos', icon: Users },
      { href: '/ficha', label: 'Ficha Disciplinar', icon: FileBadge },
      { href: '/xerife', label: 'Xerife', icon: ShieldCheck },
      { href: '/arquivados', label: 'Arquivados', icon: FileText },
    ],
  },
  {
    label: 'Disciplina', icon: Gavel,
    children: [
      { href: '/registro-disciplinar', label: 'Registro Disciplinar', icon: FileText },
      { href: '/faltas', label: 'Faltas Disciplinares', icon: CheckSquare },
      { href: '/termo', label: 'Termo de Conduta', icon: FileText },
      { href: '/convocacao', label: 'Convocação de Pais', icon: UserPlus },
      { href: '/disciplina/documentos', label: 'Documentos', icon: FolderOpen },
    ],
  },
  {
    label: 'Comportamento', icon: Smile,
    children: [
      { href: '/comportamento', label: 'Comportamento & Rankings', icon: Activity },
      { href: '/elogios', label: 'Elogios e Bonificações', icon: Star },
      { href: '/acidentes', label: 'Registro de Acidentes', icon: AlertTriangle },
    ],
  },
  { label: 'Relatórios', icon: BarChart, href: '/relatorios' },
  {
    label: 'Sistema', icon: Cog,
    children: [
      { href: '/implantacao', label: 'Implantação', icon: Rocket },
      { href: '/fechamento', label: 'Fechamento do Ano', icon: Award },
      { href: '/auditoria', label: 'Auditoria de Ações', icon: ShieldAlert },
    ],
  },
];

function findGroupForPath(pathname: string): { groupLabel: string; itemLabel: string } | null {
  for (const g of MENU_GROUPS) {
    if (g.href && g.href === pathname) return { groupLabel: g.label, itemLabel: g.label };
    if (g.children) {
      const child = g.children.find((c) => c.href === pathname);
      if (child) return { groupLabel: g.label, itemLabel: child.label };
    }
  }
  return null;
}

type LayoutMode = 'sidebar' | 'topbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isGuest, currentUserRole, currentUserSchoolId, activeSchoolContext, setActiveSchoolContext, setOpenContextModal, isAuthRestored, logout, isSyncing, isSupabaseConnected, refreshData } = useAppContext();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('topbar');

  // Modal de seleção de contexto para admin_global
  const [showContextModal, setShowContextModal] = useState(false);
  const [schools, setSchools] = useState<{id: string; name: string}[]>([]);
  useEffect(() => {
    if (currentUserRole !== 'admin_global' || !user) return;
    // Mostra o modal apenas uma vez por sessão
    const key = 'dre_context_chosen_' + new Date().toDateString();
    if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
      // Carrega escolas disponíveis
      supabase?.from('schools').select('id, name').order('name').then(({ data }: { data: { id: string; name: string }[] | null }) => {
        setSchools((data ?? []).filter((s: any) => s.id !== 'DRE'));
        setShowContextModal(true);
      });
    }
  }, [currentUserRole, user]);

  const chooseContext = (schoolId: string) => {
    setActiveSchoolContext(schoolId);
    const key = 'dre_context_chosen_' + new Date().toDateString();
    if (typeof window !== 'undefined') sessionStorage.setItem(key, schoolId);
    setShowContextModal(false);
    if (schoolId === 'DRE') router.push('/dre');
  };

  // Carrega lista de escolas para todos os usuários (necessário para o título dinâmico)
  useEffect(() => {
    if (!user) return;
    supabase?.from('schools').select('id, name').neq('id', 'DRE').order('name').then(({ data }) => {
      if (data) setSchools(data);
    });
  }, [user]);

  // Registra o callback para abrir o modal a partir de qualquer página
  useEffect(() => {
    setOpenContextModal(() => {
      supabase?.from('schools').select('id, name').order('name').then(({ data }) => {
        setSchools((data ?? []).filter((s: any) => s.id !== 'DRE'));
        setShowContextModal(true);
      });
    });
  }, [setOpenContextModal]);

  // Popup alerta xerife (sexta e segunda)
  const [showXerifeAlert, setShowXerifeAlert] = useState(false);
  useEffect(() => {
    if (!user || isGuest) return;
    const today = new Date();
    const dow = today.getDay(); // 1=seg, 5=sex
    if (dow !== 1 && dow !== 5) return;
    const key = 'xerife_alert_dismissed_' + today.toISOString().split('T')[0];
    if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
      setShowXerifeAlert(true);
    }
  }, [user, isGuest]);

  const dismissXerifeAlert = (noMore: boolean) => {
    if (noMore && typeof window !== 'undefined') {
      const key = 'xerife_alert_dismissed_' + new Date().toISOString().split('T')[0];
      sessionStorage.setItem(key, '1');
    }
    setShowXerifeAlert(false);
  };

  // Inactivity session management
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(10);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (showInactivityModal) return; // Don't reset if modal is already open

    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityModal(true);
      setInactivityCountdown(10);
    }, 10 * 60 * 1000); // 10 minutes
  }, [showInactivityModal]);

  useEffect(() => {
    if (user && !isGuest) {
      resetInactivityTimer();
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetInactivityTimer));
      return () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
      };
    }
  }, [user, isGuest, showInactivityModal, resetInactivityTimer]);

  useEffect(() => {
    if (showInactivityModal) {
      countdownTimerRef.current = setInterval(() => {
        setInactivityCountdown(prev => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            logout();
            setShowInactivityModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      };
    }
  }, [showInactivityModal, logout]);

  const cancelInactivity = () => {
    setShowInactivityModal(false);
    resetInactivityTimer();
  };

  useEffect(() => {
    if (isAuthRestored && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, isAuthRestored, router]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setTimeout(() => setIsMobileMenuOpen(false), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const initStorage = () => {
      const storedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }

      const storedMode = localStorage.getItem('layoutMode');
      if (storedMode === 'sidebar' || storedMode === 'topbar') {
        setLayoutMode(storedMode as LayoutMode);
      }
    };

    setTimeout(initStorage, 0);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const toggleLayout = () => {
    const next: LayoutMode = layoutMode === 'sidebar' ? 'topbar' : 'sidebar';
    setLayoutMode(next);
    localStorage.setItem('layoutMode', next);
    setIsProfileOpen(false);
  };

  if (!user && !isGuest) return null;

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Gestor Escolar';
  const userInitials = userName.split(' ').slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join('') || 'US';
  const userRole = isGuest ? 'Somente Leitura' : 'Admin';

  const rightControls = (
    <RightControls
      isSupabaseConnected={isSupabaseConnected}
      isSyncing={isSyncing}
      refreshData={refreshData}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      isProfileOpen={isProfileOpen}
      setIsProfileOpen={setIsProfileOpen}
      user={user}
      userName={userName}
      userInitials={userInitials}
      userRole={userRole}
      currentUserRole={currentUserRole}
      logout={logout}
      setIsChatOpen={setIsChatOpen}
      layoutMode={layoutMode}
      toggleLayout={toggleLayout}
    />
  );

  return (
    <div className={'min-h-screen bg-[#eef3f9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 ' + (layoutMode === 'sidebar' ? 'flex' : 'flex flex-col')}>
      {/* Background decoration for liquid glass effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 blur-[120px] rounded-full" />
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <MobileDrawer
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={pathname}
      />

      {layoutMode === 'sidebar' ? (
        <SidebarLayout
          pathname={pathname}
          rightControls={rightControls}
          openMobileMenu={() => setIsMobileMenuOpen(true)}
        >
          {children}
        </SidebarLayout>
      ) : (
        <TopbarLayout
          pathname={pathname}
          rightControls={rightControls}
          openMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenContextModal={() => setShowContextModal(true)}
          schools={schools}
        >
          {children}
        </TopbarLayout>
      )}

      <AIChat />

      {/* Modal de seleção de contexto — admin_global */}
      {showContextModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Qual painel deseja ver?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Voce pode alternar a qualquer momento pelo menu lateral.</p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => chooseContext('DRE')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" /> Painel DRE — Visao Consolidada
              </button>
              {schools.map(s => (
                <button
                  key={s.id}
                  onClick={() => chooseContext(s.id)}
                  className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" /> {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Xerife Alert Popup — sexta e segunda */}
      {showXerifeAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {new Date().getDay() === 5 ? 'E o fim de semana do Xerife?' : 'Nova Semana, Novo Xerife!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {new Date().getDay() === 5
                  ? 'Hoje e sexta-feira. Lembre-se de coletar o feedback dos xerifes desta semana antes de encerrar.'
                  : 'Hoje e segunda-feira. E hora de designar os novos Xerifes, Sub-Xerifes e Pelotao da Faxina para a semana.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <a
                href="/xerife"
                onClick={() => setShowXerifeAlert(false)}
                className="block w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
              >
                {new Date().getDay() === 5 ? 'Registrar Feedback' : 'Designar Xerifes'}
              </a>
              <button
                onClick={() => dismissXerifeAlert(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Lembrar mais tarde
              </button>
              <button
                onClick={() => dismissXerifeAlert(true)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
              >
                Nao aparecer novamente hoje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inactivity Popup */}
      {showInactivityModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 transform animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Sessão Expirando</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Você ficou inativo por muito tempo. Sua sessão será encerrada em:
              </p>
            </div>
            
            <div className="text-6xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
              {inactivityCountdown}
            </div>
            
            <button
              onClick={cancelInactivity}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Continuar Conectado
            </button>
            
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
              Escola Estadual Cívico-Militar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- LAYOUT: SIDEBAR ---------- */

function SidebarLayout({
  pathname,
  rightControls,
  openMobileMenu,
  children,
}: {
  pathname: string;
  rightControls: React.ReactNode;
  openMobileMenu: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <aside className="hidden md:flex w-64 bg-[#1E293B] flex-col shrink-0 shadow-xl">
        <div className="p-6 flex flex-col items-center border-b border-slate-800">
          <div className="w-28 h-28 flex items-center justify-center">
            <img src="/nova_logo.png" alt="Logo EECM" className="w-full h-full object-contain drop-shadow-md" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-4 px-3">
            {MENU_GROUPS.map((group) => {
              if (group.href) {
                const active = pathname === group.href;
                return (
                  <li key={group.label}>
                    <Link
                      href={group.href}
                      className={'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ' + (active ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/40')}
                    >
                      <group.icon className={'w-5 h-5 ' + (active ? 'text-blue-400' : 'text-slate-500')} />
                      {group.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={group.label}>
                  <p className="px-4 mb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
                    <group.icon className="w-3.5 h-3.5" />
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.children!.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={'flex items-center gap-3 pl-8 pr-4 py-2 rounded-lg text-sm transition-colors ' + (active ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/40')}
                          >
                            <item.icon className={'w-4 h-4 ' + (active ? 'text-blue-400' : 'text-slate-500')} />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 italic text-center">
            Versão: {versionData.version}
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 md:hidden"
              onClick={openMobileMenu}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
              {findGroupForPath(pathname)?.itemLabel || 'Gestão'}
            </h2>
          </div>
          {rightControls}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </>
  );
}

/* ---------- LAYOUT: TOPBAR ---------- */

function TopbarLayout({
  pathname,
  rightControls,
  openMobileMenu,
  children,
  onOpenContextModal,
  schools,
}: {
  pathname: string;
  rightControls: React.ReactNode;
  openMobileMenu: () => void;
  children: React.ReactNode;
  onOpenContextModal?: () => void;
  schools: { id: string; name: string }[];
}) {
  const currentInfo = findGroupForPath(pathname);
  const { currentUserRole, activeSchoolContext } = useAppContext();

  return (
    <>
      <header className="z-30 px-4 pt-2 pb-1 space-y-2 pointer-events-none">
        {/* top row: logo + right controls */}
        <div className="pointer-events-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-800/50 shadow-sm rounded-full flex items-center justify-between gap-4 px-4 md:px-6 py-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              className="w-11 h-11 -ml-1 flex items-center justify-center text-slate-500 dark:text-slate-400 md:hidden rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
              onClick={openMobileMenu}
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <img
              src="/logo_dash.svg"
              alt="EECM"
              className="w-auto h-10 sm:h-12 md:h-16 object-contain shrink-0 drop-shadow-sm"
            />
            <div className="hidden sm:block min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                <span className="font-extrabold">EECM</span>{' '}
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  {(() => {
                    const active = schools.find(s => s.id === activeSchoolContext);
                    if (active) {
                      // Remove prefixos comuns para exibir só o nome sem "EECM Prof." redundante
                      return active.name
                        .replace(/^EECM\s*/i, '')
                        .replace(/^Prof\.?\s*/i, '')
                        .toUpperCase();
                    }
                    return 'PROF. JOÃO BATISTA';
                  })()}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Disciplina e Monitoramento Escolar
              </p>
            </div>
            {currentUserRole === 'admin_global' && onOpenContextModal && (
              <button
                onClick={onOpenContextModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ml-2
                  bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400
                  hover:bg-blue-100 dark:hover:bg-blue-500/20"
                title="Trocar contexto de escola"
              >
                <Building2 className="w-3.5 h-3.5" />
                {activeSchoolContext === 'DRE' ? 'DRE' : activeSchoolContext}
              </button>
            )}
          </div>
          {rightControls}
        </div>

        {/* nav row: grouped pills with hover dropdown */}
        <div className="pointer-events-auto hidden md:flex items-center justify-center gap-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-800/50 shadow-md rounded-full px-4 md:px-10 py-1">
          {MENU_GROUPS.map((group) => (
            <GroupPill
              key={group.label}
              group={group}
              pathname={pathname}
              activeGroup={currentInfo?.groupLabel}
            />
          ))}
        </div>
      </header>

      <div className="md:hidden px-4 pt-3 pb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {currentInfo?.itemLabel || 'Gestão'}
      </div>

      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>
    </>
  );
}

function GroupPill({
  group,
  pathname,
  activeGroup,
}: {
  group: MenuGroup;
  pathname: string;
  activeGroup: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const handleButtonClick = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) {
      // Primeiro clique: navega para o primeiro item do submenu e mantém aberto
      if (group.children && group.children.length > 0) {
        router.push(group.children[0].href);
      }
      setOpen(true);
    } else {
      // Submenu já aberto: fecha
      setOpen(false);
    }
  };

  const isActive = activeGroup === group.label;

  // Direct link group (no children)
  if (group.href) {
    const active = pathname === group.href;
    return (
      <Link
        href={group.href}
        className={'shrink-0 group/item flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ' + (active ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500')}
      >
        <group.icon className={'w-4 h-4 ' + (active ? 'text-white' : 'text-slate-400 group-hover/item:text-white')} />
        <span className="whitespace-nowrap">{group.label}</span>
      </Link>
    );
  }

  // Group with children (dropdown on hover)
  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={handleButtonClick}
        className={'shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ' + (isActive || open ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500')}
      >
        <group.icon className={'w-4 h-4 transition-colors ' + (isActive || open ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
        <span className="whitespace-nowrap">{group.label}</span>
        <ChevronDown className={'w-3.5 h-3.5 transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[200] min-w-[240px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="glass-dropdown flex flex-col py-1.5">
            {group.children!.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ' + (active ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700')}
                >
                  <item.icon className={'w-4 h-4 shrink-0 ' + (active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- MOBILE DRAWER (used by both layouts) ---------- */

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  return (
    <aside
      className={'fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#1E293B] flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out shadow-2xl md:hidden safe-area-inset ' + (open ? 'translate-x-0' : '-translate-x-full')}
    >
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-800">
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <img src="/nova_logo.png" alt="Logo EECM" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <button 
          className="w-11 h-11 flex items-center justify-center text-slate-400 rounded-xl active:bg-slate-700 transition-colors" 
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 overscroll-contain">
        <ul className="space-y-3 px-2 sm:px-3">
          {MENU_GROUPS.map((group) => {
            if (group.href) {
              const active = pathname === group.href;
              return (
                <li key={group.label}>
                  <Link
                    href={group.href}
                    onClick={onClose}
                    className={'flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors active:scale-[0.98] ' + (active ? 'bg-blue-500/15 text-blue-400 border-l-4 border-blue-500' : 'text-slate-300 active:bg-slate-700/60')}
                  >
                    <group.icon className="w-5 h-5 shrink-0" />
                    {group.label}
                  </Link>
                </li>
              );
            }
            return (
              <li key={group.label}>
                <p className="px-4 mb-2 text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
                  <group.icon className="w-4 h-4" />
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.children!.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={'flex items-center gap-3 pl-8 pr-4 py-3 rounded-xl text-base transition-colors active:scale-[0.98] ' + (active ? 'bg-blue-500/15 text-blue-400 border-l-4 border-blue-500' : 'text-slate-300 active:bg-slate-700/60')}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800 safe-area-bottom">
        <p className="text-xs text-slate-500 italic text-center">
          Versão: {versionData.version}
        </p>
      </div>
    </aside>
  );
}

/* ---------- RIGHT CONTROLS (used by both layouts) ---------- */

type RightControlsProps = {
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  refreshData: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (v: boolean) => void;
  user: { email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string } } | null;
  userName: string;
  userInitials: string;
  userRole: string;
  currentUserRole: string | null;
  logout: () => void;
  setIsChatOpen: (v: boolean) => void;
  layoutMode: LayoutMode;
  toggleLayout: () => void;
};

function RightControls(props: RightControlsProps) {
  const {
    isSupabaseConnected, isSyncing, refreshData, isDarkMode, toggleTheme,
    isProfileOpen, setIsProfileOpen, user, userName, userInitials, userRole,
    currentUserRole, logout, setIsChatOpen, layoutMode, toggleLayout,
  } = props;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Status badge - compacto no mobile */}
      <div
        className={'inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ' + (isSupabaseConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30')}
      >
        {isSupabaseConnected ? <CloudCheck className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
        <span className="hidden xs:inline">{isSupabaseConnected ? 'Online' : 'Offline'}</span>
      </div>

      <button
        onClick={refreshData}
        disabled={isSyncing}
        className={'w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/60 active:bg-slate-100 dark:active:bg-slate-700 transition shadow-sm ' + (isSyncing ? 'animate-spin text-blue-500' : '')}
        title="Sincronizar"
        aria-label="Sincronizar dados"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      <button
        onClick={toggleTheme}
        className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/60 active:bg-slate-100 dark:active:bg-slate-700 transition shadow-sm"
        title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
        aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <ProfileMenu
        isOpen={isProfileOpen}
        setIsOpen={setIsProfileOpen}
        user={user}
        userName={userName}
        userInitials={userInitials}
        userRole={userRole}
        currentUserRole={currentUserRole}
        logout={logout}
        setIsChatOpen={setIsChatOpen}
        layoutMode={layoutMode}
        toggleLayout={toggleLayout}
      />
    </div>
  );
}

/* ---------- PROFILE MENU (Portal) ---------- */

type ProfileMenuProps = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  user: RightControlsProps['user'];
  userName: string;
  userInitials: string;
  userRole: string;
  currentUserRole: string | null;
  logout: () => void;
  setIsChatOpen: (v: boolean) => void;
  layoutMode: LayoutMode;
  toggleLayout: () => void;
};

function ProfileMenu({
  isOpen, setIsOpen, user, userName, userInitials, userRole,
  currentUserRole, logout, setIsChatOpen, layoutMode, toggleLayout,
}: ProfileMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Profile edit state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Carregar perfil salvo no Supabase e verificar primeiro acesso
  useEffect(() => {
    if (!mounted || !user?.email || !supabase) return;
    const sb = supabase;
    const loadProfile = async () => {
      const { data, error } = await sb
        .from('user_profiles')
        .select('name, role, setup_done')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        // Falha na consulta: não exibe o modal para não bloquear o usuário
        return;
      }

      if (data) {
        setProfileName(data.name || '');
        setProfileRole(data.role || '');
        setShowFirstAccessModal(!data.setup_done);
      } else {
        // Nenhum registro: primeiro acesso real
        setShowFirstAccessModal(true);
      }
    };
    loadProfile();
  }, [mounted, user?.email]);

  const handleSaveProfile = async () => {
    setProfileError('');
    if (!profileName.trim()) {
      setProfileError('O nome é obrigatório.');
      return;
    }
    if (!user?.email || !supabase) {
      setProfileError('Sessão inválida. Faça login novamente.');
      return;
    }
    const sb = supabase;
    setProfileLoading(true);
    try {
      const { error } = await sb
        .from('user_profiles')
        .upsert(
          {
            email: user.email,
            name: profileName.trim(),
            role: profileRole.trim(),
            setup_done: true,
          },
          { onConflict: 'email' }
        );

      if (error) throw error;

      // Notifica outros componentes (ex: "Registrado por" no formulário)
      window.dispatchEvent(
        new CustomEvent('eecm_profile_updated', {
          detail: { name: profileName.trim(), role: profileRole.trim() },
        })
      );

      setProfileSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => {
        setShowProfileModal(false);
        setShowFirstAccessModal(false);
        setProfileSuccess('');
      }, 1200);
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao salvar perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdError('');
    setPwdSuccess('');
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
  };

  const handleChangePassword = async () => {
    setPwdError('');
    setPwdSuccess('');

    if (!newPassword || !confirmPassword) {
      setPwdError('Preencha todos os campos.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('As senhas não coincidem.');
      return;
    }

    if (!supabase) {
      setPwdError('Conexão com o servidor indisponível. Verifique as configurações.');
      return;
    }

    setPwdLoading(true);
    try {
      // Verificar se é uma sessão mock (localStorage) ou real (Supabase)
      const sessionData = localStorage.getItem('eecm_session');
      const sessionParsed = sessionData ? JSON.parse(sessionData) : null;
      
      // Se for sessão mock (login como "manoel"), não permite trocar senha
      if (sessionParsed && sessionParsed.type === 'mock') {
        setPwdError('A troca de senha só está disponível para usuários autenticados via Supabase. Seu acesso é via modo demo.');
        setPwdLoading(false);
        return;
      }

      // Tentar obter sessão real do Supabase
      const { data: supabaseSession } = await supabase.auth.getSession();
      if (!supabaseSession?.session) {
        setPwdError('Sessão expirada. Faça login novamente para alterar a senha.');
        setPwdLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwdError(error.message);
      } else {
        setPwdSuccess('Senha alterada com sucesso!');
        setTimeout(() => {
          setShowPasswordModal(false);
          resetPasswordForm();
        }, 1500);
      }
    } catch (err: any) {
      setPwdError(err.message || 'Erro ao alterar senha.');
    } finally {
      setPwdLoading(false);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  // Position the portal relative to the trigger button
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="ml-1">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/60 hover:bg-white/90 dark:hover:bg-slate-700 transition shadow-sm"
      >
        {user?.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-xs font-bold flex items-center justify-center">
            {userInitials}
          </span>
        )}
        <div className="text-left hidden sm:block leading-tight pr-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{userName}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">{userRole}</p>
        </div>
      </button>

      {mounted && isOpen && pos && ReactDOM.createPortal(
        <div
          ref={menuRef}
          className="fixed w-64 glass-dropdown overflow-hidden text-sm animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ top: pos.top, right: pos.right, zIndex: 99999 }}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{userName}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{user?.email || 'Sem e-mail'}</p>
          </div>

          <div className="py-2">
            {currentUserRole === 'admin_global' && (
              <>
                <Link
                  href="/dre"
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" /> Painel DRE
                </Link>
                <Link
                  href="/configuracoes"
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4" /> Configuração do Sistema
                </Link>
              </>
            )}
            <button
              onClick={() => { setShowPasswordModal(true); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-3"
            >
              <KeyRound className="w-4 h-4 text-amber-500" /> Alterar Senha
            </button>
            <button
              onClick={() => { logout(); setIsOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 flex items-center gap-3"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center">
              Versão: {versionData.version}
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Alteracao de Senha */}
      {mounted && showPasswordModal && ReactDOM.createPortal(
        <div className="fixed inset-0 glass-overlay flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ zIndex: 100000 }}>
          <div 
            className="glass-modal w-full max-w-sm p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                Alterar Senha
              </h2>
              <button
                onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass-input w-full pr-10"
                    placeholder="Minimo 6 caracteres"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input w-full pr-10"
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error/Success */}
              {pwdError && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{pwdError}</p>
              )}
              {pwdSuccess && (
                <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">{pwdSuccess}</p>
              )}

              {/* Botoes */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={pwdLoading || !newPassword || !confirmPassword}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center justify-center gap-2"
                >
                  {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {pwdLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Meu Perfil / Primeiro Acesso */}
      {mounted && (showProfileModal || showFirstAccessModal) && ReactDOM.createPortal(
        <div className="fixed inset-0 glass-overlay flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ zIndex: 100000 }}>
          <div className="glass-modal w-full max-w-sm p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-500" />
                  {showFirstAccessModal ? 'Bem-vindo! Configure seu perfil' : 'Meu Perfil'}
                </h2>
                {showFirstAccessModal && (
                  <p className="text-xs text-slate-500 mt-0.5">Estas informações aparecem nos registros de ocorrências.</p>
                )}
              </div>
              {!showFirstAccessModal && (
                <button
                  onClick={() => { setShowProfileModal(false); setProfileError(''); setProfileSuccess(''); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Ex: João Batista Silva"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Ex: Coordenador Pedagógico, Monitor..."
                />
                <p className="text-xs text-slate-400 mt-1">Aparece junto ao nome nos registros: <span className="italic">&quot;{profileRole || 'Cargo'} {profileName || 'Nome'}&quot;</span></p>
              </div>

              {profileError && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{profileError}</p>
              )}
              {profileSuccess && (
                <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">{profileSuccess}</p>
              )}

              <div className="flex gap-3 pt-1">
                {!showFirstAccessModal && (
                  <button
                    onClick={() => { setShowProfileModal(false); setProfileError(''); setProfileSuccess(''); }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                )}
                {showFirstAccessModal && (
                  <button
                    onClick={async () => {
                      // Persiste setup_done=true no Supabase mesmo ao pular
                      if (user?.email && supabase) {
                        await supabase
                          .from('user_profiles')
                          .upsert(
                            { email: user.email, name: profileName || '', role: profileRole || '', setup_done: true },
                            { onConflict: 'email' }
                          );
                      }
                      setShowFirstAccessModal(false);
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition"
                  >
                    Pular
                  </button>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={profileLoading || !profileName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center justify-center gap-2"
                >
                  {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
