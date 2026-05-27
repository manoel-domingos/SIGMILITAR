'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ShieldCheck, Cpu, FileText, Clock, MessageSquareDashed,
  Zap, BarChart2, Award, Gavel, Bot, TrendingUp, Shield, Users, Star,
  CheckCircle, X, AlertTriangle, Info, Building2
} from 'lucide-react';

export default function LandingPage() {
  const [form, setForm] = useState({ school: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const hero3dRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll Reveal Observer
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal').forEach(el => {
      revealObserver.observe(el);
    });

    // 3D Cards Mouse Move
    const handleMouseMove = (e: MouseEvent) => {
      if (!hero3dRef.current) return;
      const x = (window.innerWidth / 2 - e.pageX) / 40;
      const y = (window.innerHeight / 2 - e.pageY) / 40;

      document.querySelectorAll('.hero-card').forEach((el) => {
        const card = el as HTMLElement;
        const depth = parseFloat(card.getAttribute('data-depth') || '1');
        const baseX = parseFloat(card.getAttribute('data-base-x') || '0');
        const baseY = parseFloat(card.getAttribute('data-base-y') || '0');
        const baseZ = parseFloat(card.getAttribute('data-base-z') || '0');

        card.style.transform = `translateX(${baseX + x * depth}px) translateY(${baseY + y * depth}px) translateZ(${baseZ}px) rotateY(${-15 + x * 0.5}deg) rotateX(${10 - y * 0.5}deg)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      revealObserver.disconnect();
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ school: '', email: '', phone: '' });
    }, 1200);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&display=swap');

        .orbitron {
          font-family: "Orbitron", sans-serif;
          font-optical-sizing: auto;
          font-weight: 500;
          font-style: normal;
        }

        @keyframes slideDownCard {
          0% { margin-top: -150px; opacity: 0; }
          100% { margin-top: 0; opacity: 1; }
        }
        @keyframes slideUpCard {
          0% { margin-top: 150px; opacity: 0; }
          100% { margin-top: 0; opacity: 1; }
        }
        .anim-slide-down {
          animation: slideDownCard 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-slide-up-1 {
          animation: slideUpCard 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
        }
        .anim-slide-up-2 {
          animation: slideUpCard 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.4s;
        }

        :root {
          --color-primary: #2563eb;
          --color-accent: #3b82f6;
          --color-bg-base: #050505;
          --color-bg-elevated: #0A0A0A;
          --color-bg-card: #121212;
        }
        
        .radar-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
        }

        .section-bg-dots {
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .showcase-card {
          background: #0A0A0A;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .showcase-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.02);
        }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes particle-drift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translate(var(--dx, 30px), var(--dy, -50px)) scale(0); opacity: 0; }
        }

        .animate-reveal { animation: reveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .radar-sweep-anim {
          background: conic-gradient(from 0deg, transparent 0deg, rgba(37, 99, 235, 0.1) 60deg, rgba(37, 99, 235, 0.4) 360deg);
          animation: radar-spin 4s linear infinite;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .scroll-reveal.is-visible { opacity: 1; transform: translateY(0); }

        .ds-nav {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 50;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(5,5,5,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        
        .particles-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: var(--color-primary);
          opacity: 0;
          animation: particle-drift 6s ease-in-out infinite;
        }
      `}} />

      <div className="bg-[#050505] text-white overflow-x-hidden font-sans antialiased min-h-screen">

        {/* NAVBAR */}
        <nav className="ds-nav">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <a href="#" className="flex items-center group">
              <img src="/LOGO SIGMILITAR.svg" alt="SIGMILITAR" className="h-16 md:h-20 w-auto object-contain" />
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
              <a href="#problema" className="hover:text-white transition-colors">Problema</a>
              <a href="#solucao" className="hover:text-white transition-colors">Solução</a>
              <a href="#modulos" className="hover:text-white transition-colors">Módulos</a>
              <a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a>
            </div>
            <a href="#cta" className="hidden md:flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#3b82f6] hover:text-white transition-all duration-300">
              Agendar Demonstração
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </nav>

        {/* SEÇÃO 1: HERO */}
        <section id="hero" className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
          <div className="particles-container">
            <div className="particle w-1 h-1" style={{ top: '20%', left: '10%', '--dx': '60px', '--dy': '-80px', animationDelay: '0s', animationDuration: '5s' } as React.CSSProperties}></div>
            <div className="particle w-1.5 h-1.5" style={{ top: '40%', left: '80%', '--dx': '-40px', '--dy': '-60px', animationDelay: '1s', animationDuration: '7s' } as React.CSSProperties}></div>
            <div className="particle w-1 h-1" style={{ top: '70%', left: '30%', '--dx': '50px', '--dy': '-70px', animationDelay: '2s', animationDuration: '6s' } as React.CSSProperties}></div>
            <div className="particle w-2 h-2" style={{ top: '60%', left: '70%', '--dx': '-30px', '--dy': '-90px', animationDelay: '3s', animationDuration: '8s' } as React.CSSProperties}></div>
          </div>
          <div className="radar-grid absolute inset-0 opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] opacity-[0.06] bg-[#2563eb] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center w-full">

            {/* LADO ESQUERDO: TEXTOS (ALINHADOS À ESQUERDA) */}
            <div className="text-left flex flex-col items-start z-20">
              <div className="inline-flex animate-reveal text-xs font-medium text-[#2563eb] tracking-wide bg-[#3b82f6]/5 border-[#3b82f6]/30 border rounded-full mb-8 pt-1 pr-4 pb-1 pl-4 items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#2563eb]"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563eb]"></span>
                </span>
                GESTÃO DISCIPLINAR DE ALTO DESEMPENHO
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-6 leading-[1.1] animate-reveal delay-100">
                Controle <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#2563eb] to-[#3b82f6]">Inteligente</span> e<br />Monitoramento Escolar
              </h1>

              <p className="text-lg md:text-xl text-white/60 font-light mb-10 max-w-2xl leading-relaxed animate-reveal delay-200">
                Centralize ocorrências, automatize a redação de atas com o assistente ARIA e gerencie o ranking comportamental em tempo real. O sistema definitivo para as Escolas Cívico-Militares.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-reveal delay-300 w-full sm:w-auto">
                <a href="#cta" className="flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-[#60a5fa] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-[#2563eb]">
                  Solicitar Demonstração
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a href="#modulos" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-white/10 transition-colors">
                  Ver Funcionalidades
                </a>
              </div>

              <div className="mt-16 flex flex-wrap gap-6 md:gap-8 animate-reveal delay-400">
                <div className="flex items-center gap-2 text-sm font-mono text-white/50 uppercase tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>
                  <ShieldCheck className="w-4 h-4 text-[#2563eb]" /> DRE Multi-Escola
                </div>
                <div className="w-px h-6 bg-white/10 hidden md:block"></div>
                <div className="flex items-center gap-2 text-sm font-mono text-white/50 uppercase tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>
                  <Cpu className="w-4 h-4 text-[#2563eb]" /> IA Nativo (ARIA)
                </div>
              </div>
            </div>

            {/* LADO DIREITO: CARDS 3D */}
            <div className="hidden lg:block relative w-full perspective-[1200px]" id="hero3d" style={{ perspective: '1200px' }} ref={hero3dRef}>
              <div id="hero3d-container" className="w-full flex flex-col gap-4 max-w-[600px] ml-auto relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                {/* Top Row: 2 Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Card 3 (Top Left - Ocorrências) */}
                  <div className="hero-card bg-[#050505]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl transition-transform duration-200 ease-out opacity-0 anim-slide-up-2"
                    data-depth="0.3" data-base-x="0" data-base-y="0" data-base-z="0"
                    style={{ transform: 'rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 px-2">
                      <span className="text-xs font-mono text-white/50 tracking-wider" style={{ fontFamily: 'Geist Mono, monospace' }}># OCORRÊNCIAS</span>
                      <span className="text-[10px] text-gray-400 font-mono tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>[SYNC]</span>
                    </div>
                    {/* Imagem Ocorrências */}
                    <img src="https://i.postimg.cc/3xbPSpCD/image.png" alt="Ocorrências Preview" className="w-full h-auto rounded-xl border border-white/5 shadow-inner" />
                  </div>

                  {/* Card 2 (Top Right - ARIA) */}
                  <div className="hero-card bg-[#0A0A0A]/90 backdrop-blur-xl border border-[#2563eb]/30 rounded-2xl p-3 shadow-[0_0_40px_rgba(37,99,235,0.15)] transition-transform duration-200 ease-out opacity-0 anim-slide-up-1"
                    data-depth="0.4" data-base-x="0" data-base-y="0" data-base-z="0"
                    style={{ transform: 'rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                    <div className="flex items-center justify-between border-b border-[#2563eb]/20 pb-2 mb-3 px-2 relative">
                      <div className="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-[#2563eb] to-transparent"></div>
                      <span className="text-xs font-mono text-white/70 tracking-wider" style={{ fontFamily: 'Geist Mono, monospace' }}># ARIA_NODE</span>
                      <span className="text-[10px] text-[#3b82f6] font-mono tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>[INDEX]</span>
                    </div>
                    {/* Imagem ARIA */}
                    <img src="https://i.postimg.cc/pXv50cPZ/image.png" alt="ARIA Node Preview" className="w-full h-auto rounded-xl border border-[#2563eb]/20 shadow-inner" />
                  </div>
                </div>

                {/* Bottom Row: Dashboard */}
                <div className="hero-card w-full bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl transition-transform duration-200 ease-out z-10 opacity-0 anim-slide-down"
                  data-depth="0.5" data-base-x="0" data-base-y="0" data-base-z="0"
                  style={{ transform: 'rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3 px-2">
                    <span className="text-xs font-mono text-white tracking-wider" style={{ fontFamily: 'Geist Mono, monospace' }}># DASHBOARD_EXECUTIVO</span>
                    <span className="text-[10px] text-green-400 font-mono tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>[LIVE]</span>
                  </div>
                  {/* Imagem do Dashboard */}
                  <img src="https://i.postimg.cc/3NJ4xPyy/image.png" alt="Dashboard Disciplinar" className="w-full h-auto rounded-xl border border-white/5 shadow-inner" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: DOR */}
        <section id="problema" className="relative py-32 border-t border-white/5">
          <div className="section-bg-dots absolute inset-0 opacity-10 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">A gestão disciplinar manual está esgotando sua coordenação?</h2>
              <p className="text-lg text-white/60 font-light">Os métodos tradicionais de registro limitam a eficiência da escola e ocultam dados vitais sobre o comportamento dos alunos.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="showcase-card scroll-reveal">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Registros em Papel</h3>
                <p className="text-white/60 text-sm leading-relaxed">Fichas disciplinares acumuladas em pastas dificultam a análise de reincidências e a contagem precisa da pontuação do aluno.</p>
              </div>
              <div className="showcase-card scroll-reveal delay-100">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Horas Perdidas</h3>
                <p className="text-white/60 text-sm leading-relaxed">Redigir ATAs, Termos de Conduta e Convocações de Pais toma um tempo precioso que deveria ser focado no aspecto pedagógico.</p>
              </div>
              <div className="showcase-card scroll-reveal delay-200">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                  <MessageSquareDashed className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Comunicação Tardia</h3>
                <p className="text-white/60 text-sm leading-relaxed">Avisar responsáveis sobre ocorrências ou acidentes pode demorar dias devido à falta de uma centralização rápida da informação.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: SOLUÇÃO */}
        <section id="solucao" className="relative py-32 border-t border-white/5 bg-[#0A0A0A]">
          <div className="absolute top-0 right-[-10%] w-[400px] h-[400px] rounded-full blur-[160px] opacity-[0.04] bg-[#2563eb] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 scroll-reveal">
                <span className="text-xs font-mono text-[#2563eb] uppercase tracking-widest mb-4 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Inteligência Acadêmica</span>
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">Controle Total e Inteligência a Seu Favor</h2>
                <p className="text-lg text-white/60 font-light mb-8">O <strong className="orbitron text-white">SIGMILITAR</strong> resolve cada um desses desafios integrando funcionalidades de alta tecnologia desenhadas exclusivamente para a rotina Cívico-Militar.</p>

                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <Zap className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Automação de ATAs com ARIA</h4>
                      <p className="text-white/50 text-sm">A Inteligência Artificial lê o relato, tipifica a infração via Regimento e gera a ATA formal em instantes.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <BarChart2 className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Monitoramento em Tempo Real</h4>
                      <p className="text-white/50 text-sm">Dashboards gerenciais apontam imediatamente as turmas críticas, faltas graves e a distribuição de ocorrências no mês.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <Award className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Sistema de Pontuação Preciso</h4>
                      <p className="text-white/50 text-sm">Cada registro atualiza automaticamente o saldo de 10.0 pontos do aluno, classificando-o no ranking comportamental.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="flex-1 scroll-reveal delay-200">
                <div className="relative bg-black rounded-3xl border border-white/10 p-2 overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/5 to-transparent pointer-events-none"></div>
                  {/* Mock Dashboard Element */}
                  <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-white/50 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Dashboard Executivo</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#2563eb] border border-[#2563eb]/30 px-2 py-1 rounded" style={{ fontFamily: 'Geist Mono, monospace' }}>LIVE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-[10px] font-mono text-white/40 mb-1 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Ocorrências Mês</div>
                        <div className="text-2xl font-medium text-white">124</div>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                        <div className="text-[10px] font-mono text-red-400 mb-1 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Casos Graves</div>
                        <div className="text-2xl font-medium text-red-500">12</div>
                      </div>
                    </div>

                    <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-4 relative overflow-hidden">
                      <div className="text-[10px] font-mono text-white/40 mb-3 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Alertas Recentes</div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-500" /><span className="text-white/80 text-xs">Reincidência: João P.</span></div>
                          <span className="text-xs text-white/30">Agora</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><Info className="w-3 h-3 text-blue-500" /><span className="text-white/80 text-xs">Elogio Art.50: Maria T.</span></div>
                          <span className="text-xs text-white/30">10 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 4: MÓDULOS */}
        <section id="modulos" className="relative py-32 border-t border-white/5">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
              <span className="text-xs font-mono text-[#2563eb] uppercase tracking-widest mb-4 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Ecossistema Completo</span>
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">Gestão de Ponta a Ponta</h2>
              <p className="text-lg text-white/60 font-light">Tudo que sua instituição precisa em uma única plataforma.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Modulo 1 */}
              <div className="showcase-card group scroll-reveal">
                <div className="w-12 h-12 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Gavel className="w-5 h-5 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Registro Disciplinar Completo</h3>
                <p className="text-white/60 text-sm font-light">Cadastro de infrações por turmas, atenuantes e detecção instantânea de multi-infratores baseado no regimento interno.</p>
              </div>

              {/* Modulo 2 */}
              <div className="showcase-card group scroll-reveal delay-100">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bot className="w-5 h-5 text-[#60a5fa]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Assistente ARIA</h3>
                <p className="text-white/60 text-sm font-light">IA Nativa para geração de atas e relatórios gerenciais automáticos através do chat inteligente acoplado ao sistema.</p>
              </div>

              {/* Modulo 3 */}
              <div className="showcase-card group scroll-reveal delay-200">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Rankings e Pontuação</h3>
                <p className="text-white/60 text-sm font-light">Monitoramento do saldo de 10.0 pontos por aluno. Visualização rápida de quem se enquadra como Bom, Regular ou Irregular.</p>
              </div>

              {/* Modulo 4 */}
              <div className="showcase-card group scroll-reveal">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Controle de Acidentes e Xerifes</h3>
                <p className="text-white/60 text-sm font-light">Módulos específicos para gerenciar acidentes escolares, atendimentos, e as escalas semanais de xerifes por turma.</p>
              </div>

              {/* Modulo 5 */}
              <div className="showcase-card group scroll-reveal delay-100">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Painel DRE</h3>
                <p className="text-white/60 text-sm font-light">Visão consolidada multi-escola para a Diretoria, medindo o Índice de Disciplina e o nível de risco de cada unidade.</p>
              </div>

              {/* Modulo 6 */}
              <div className="showcase-card group scroll-reveal delay-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">Convocações e Termos</h3>
                <p className="text-white/60 text-sm font-light">Criação rápida de termos de conduta e convocações para os pais com formatos prontos para impressão oficial.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 5: PROVA SOCIAL */}
        <section className="relative py-32 border-t border-white/5 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="scroll-reveal">
                <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-8">Validado no ambiente real.</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border-l-2 border-[#2563eb] pl-6 py-2">
                    <div className="text-4xl font-semibold text-white mb-1">91</div>
                    <div className="text-sm font-mono text-white/50 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Artigos do Regimento Codificados</div>
                  </div>
                  <div className="border-l-2 border-[#2563eb] pl-6 py-2">
                    <div className="text-4xl font-semibold text-white mb-1">24/7</div>
                    <div className="text-sm font-mono text-white/50 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Disponibilidade Operacional</div>
                  </div>
                  <div className="border-l-2 border-[#2563eb] pl-6 py-2">
                    <div className="text-4xl font-semibold text-white mb-1">100%</div>
                    <div className="text-sm font-mono text-white/50 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Das escolas conectadas aprovam</div>
                  </div>
                </div>
              </div>

              <div className="scroll-reveal delay-200">
                <div className="bg-[#121212] p-8 rounded-3xl border border-white/5 relative shadow-xl">
                  <div className="absolute -top-4 right-8 bg-[#2563eb] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Verified User
                  </div>
                  <div className="flex mb-6 text-[#2563eb]">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-white/80 font-light text-lg mb-8 leading-relaxed">
                    [DEPOIMENTO - PREENCHER] "O <strong className="orbitron text-white">SIGMILITAR</strong> mudou a nossa rotina. Antes perdíamos horas transcrevendo ATAs e checando pontuações no Excel. Hoje, a IA resolve a burocracia e nós focamos nos alunos. É indispensável para o modelo Cívico-Militar."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white font-medium text-lg border border-white/20">
                      G
                    </div>
                    <div>
                      <div className="text-white font-medium">[Nome do Gestor]</div>
                      <div className="text-white/40 text-sm">Direção — EECM [Nome da Escola]</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 6: COMO FUNCIONA */}
        <section className="relative py-32 border-t border-white/5 bg-[#0A0A0A]">
          <div className="section-bg-dots absolute inset-0 opacity-20 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 scroll-reveal">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">Do Registro à Resolução em 3 Passos</h2>
            </div>

            <div className="relative">
              <div className="absolute left-[23px] md:left-1/2 top-0 bottom-0 w-px bg-white/10 md:-translate-x-1/2"></div>

              <div className="space-y-16">
                {/* Passo 1 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between scroll-reveal">
                  <div className="md:w-5/12 order-2 md:order-1 ml-16 md:ml-0 md:text-right pt-2">
                    <h3 className="text-2xl font-medium text-white mb-3">Identificação Rápida</h3>
                    <p className="text-white/60 font-light">Pelo celular ou tablet, o Monitor ou Professor relata a ocorrência (ou elogio) selecionando os alunos envolvidos de forma fácil.</p>
                  </div>
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 rounded-full bg-black border-4 border-[#0A0A0A] flex items-center justify-center z-10 text-[#2563eb] font-mono font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)]" style={{ fontFamily: 'Geist Mono, monospace' }}>01</div>
                  <div className="md:w-5/12 order-3 md:order-3"></div>
                </div>

                {/* Passo 2 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between scroll-reveal">
                  <div className="md:w-5/12 order-1 md:order-1"></div>
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 rounded-full bg-black border-4 border-[#0A0A0A] flex items-center justify-center z-10 text-[#2563eb] font-mono font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)]" style={{ fontFamily: 'Geist Mono, monospace' }}>02</div>
                  <div className="md:w-5/12 order-2 md:order-3 ml-16 md:ml-0 pt-2">
                    <h3 className="text-2xl font-medium text-white mb-3">Processamento via IA (ARIA)</h3>
                    <p className="text-white/60 font-light">O assistente analisa o relato, tipifica segundo os 91 artigos, calcula atenuantes, atualiza o saldo e redige automaticamente a ATA Oficial.</p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between scroll-reveal">
                  <div className="md:w-5/12 order-2 md:order-1 ml-16 md:ml-0 md:text-right pt-2">
                    <h3 className="text-2xl font-medium text-white mb-3">Ação e Visibilidade</h3>
                    <p className="text-white/60 font-light">Gestores validam, pais recebem as notificações e os painéis (Rankings e DRE) são atualizados ao vivo para acompanhamento.</p>
                  </div>
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 rounded-full bg-black border-4 border-[#0A0A0A] flex items-center justify-center z-10 text-[#2563eb] font-mono font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.2)]" style={{ fontFamily: 'Geist Mono, monospace' }}>03</div>
                  <div className="md:w-5/12 order-3 md:order-3"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 7: DIFERENCIAIS */}
        <section id="diferenciais" className="relative py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">Por que o <strong className="orbitron text-[#3b82f6]">SIGMILITAR</strong> é incomparável?</h2>
            </div>

            <div className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden scroll-reveal">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10">
                  <h3 className="text-2xl font-medium text-white mb-6">Arquitetura de Ponta</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white font-medium mb-1">Importação Inteligente com IA</div>
                        <div className="text-white/50 text-sm">Adicione turmas via planilhas. A IA entende e mapeia as colunas sozinha.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white font-medium mb-1">Segurança Multi-Tenant</div>
                        <div className="text-white/50 text-sm">Dados 100% isolados entre as escolas e perfis com auditoria total de ações.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white font-medium mb-1">Real-time Sincronizado</div>
                        <div className="text-white/50 text-sm">As modificações refletem simultaneamente para todos os monitores logados.</div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="p-8 md:p-12 bg-black/30">
                  <h3 className="text-2xl font-medium text-white mb-6">Sistemas Comuns</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 opacity-50">
                      <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white font-medium mb-1">Cadastro Manual Demorado</div>
                        <div className="text-white/50 text-sm">Dependência pesada de TI para formatar ou importar planilhas.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 opacity-50">
                      <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white font-medium mb-1">Redação 100% Manual</div>
                        <div className="text-white/50 text-sm">A coordenação perde horas tipificando qual regra do regimento foi violada.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 opacity-50">
                      <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white font-medium mb-1">Módulos Desconexos</div>
                        <div className="text-white/50 text-sm">Um sistema para faltas, planilhas para comportamento e cadernos para ocorrências.</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 8: CTA FINAL */}
        <section id="cta" className="relative py-32 border-t border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[#2563eb]/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full radar-sweep-anim opacity-10 pointer-events-none"></div>

          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-white mb-8">Eleve a <span className="font-bold text-[#3b82f6]">disciplina</span> e <span className="font-bold text-[#3b82f6]">gestão</span> da sua instituição hoje.</h2>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-2xl scroll-reveal">
              <h3 className="text-xl font-medium text-white mb-2">Solicite sua implantação guiada</h3>
              <p className="text-white/50 text-sm mb-8">Nossa equipe realizará o setup do sistema, integração dos alunos e treinamento do seu corpo docente.</p>

              {submitted ? (
                <div className="bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-300">
                  <CheckCircle className="w-12 h-12 text-[#2563eb] mx-auto" />
                  <h4 className="font-bold text-white">Demonstração Solicitada!</h4>
                  <p className="text-sm text-white/60">Entraremos em contato em até 24 horas.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Nome da Instituição</label>
                    <input type="text" value={form.school} onChange={e => setForm(v => ({ ...v, school: e.target.value }))} placeholder="Ex: EECM Prof. João Batista" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/30 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]/30 transition-colors" required />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2 block" style={{ fontFamily: 'Geist Mono, monospace' }}>E-mail Profissional</label>
                    <input type="email" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} placeholder="gestao@escola.com.br" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/30 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]/30 transition-colors" required />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Telefone / WhatsApp</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} placeholder="(00) 00000-0000" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/30 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]/30 transition-colors" required />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 mt-4 rounded-xl text-white font-medium text-lg hover:bg-[#60a5fa] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-[#2563eb] flex items-center justify-center gap-2">
                    {loading ? 'Processando...' : 'Agendar Reunião de Implantação'}
                  </button>
                </form>
              )}
              <p className="text-xs text-white/30 font-mono mt-6 text-center" style={{ fontFamily: 'Geist Mono, monospace' }}>Versão atual: 25.05.26.08:31 · Sem spam · Dados protegidos</p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 9: FOOTER */}
        <footer className="border-t border-white/10 bg-black pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12">
              <div className="mb-8 md:mb-0">
                <img src="/LOGO SIGMILITAR.svg" alt="SIGMILITAR" className="h-20 w-auto object-contain mb-4" />
                <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                  Sistema Integrado de Gestão Cívico Militar. Automação, segurança e eficiência.
                </p>
              </div>
              <div className="flex gap-16">
                <div>
                  <h4 className="text-white font-medium mb-4 text-sm">Plataforma</h4>
                  <ul className="space-y-2 text-sm text-white/40">
                    <li><a className="hover:text-white transition-colors" href="#problema">Visão Geral</a></li>
                    <li><a className="hover:text-white transition-colors" href="#modulos">Módulos</a></li>
                    <li><a className="hover:text-white transition-colors" href="#diferenciais">Segurança</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-4 text-sm">Contato</h4>
                  <ul className="space-y-2 text-sm text-white/40">
                    <li><a className="hover:text-white transition-colors" href="#">Suporte</a></li>
                    <li><a className="hover:text-white transition-colors" href="#cta">Implantação</a></li>
                    <li><a className="hover:text-white transition-colors" href="#">Acessar Sistema</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-white/30 text-xs font-mono" style={{ fontFamily: 'Geist Mono, monospace' }}>© 2026 <strong className="orbitron text-white">SIGMILITAR</strong>. Todos os direitos reservados.</p>
              <div className="flex items-center gap-4 text-white/30">
                <Shield className="w-4 h-4" />
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
