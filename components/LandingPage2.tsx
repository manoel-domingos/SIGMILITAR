'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ShieldCheck, Cpu, FileText, Clock, MessageSquareDashed,
  Zap, BarChart2, Award, Gavel, Bot, TrendingUp, Shield, Users, Star,
  CheckCircle, X, AlertTriangle, Info, Building2
} from 'lucide-react';

export default function LandingPage2() {
  const [form, setForm] = useState({ school: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const hero3dRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll Reveal Observer
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
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
        }
      `}} />

      <div className="bg-white text-[#2B2C33] overflow-x-hidden font-sans antialiased min-h-screen">

        {/* NAVBAR */}
        <nav className="fixed top-0 w-full z-50 border-b border-[#F4F5F7] bg-white/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <a href="#" className="flex items-center group">
              <img src="https://i.postimg.cc/rwTsT0rf/LOGO-SIGMILITAR.jpg" alt="SIGMILITAR" className="h-12 md:h-14 w-auto object-contain rounded-lg" />
            </a>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#2B2C33]/70">
              <a href="#problema" className="hover:text-[#0052CC] transition-colors">Problema</a>
              <a href="#solucao" className="hover:text-[#0052CC] transition-colors">Solução</a>
              <a href="#modulos" className="hover:text-[#0052CC] transition-colors">Módulos</a>
              <a href="#diferenciais" className="hover:text-[#0052CC] transition-colors">Diferenciais</a>
            </div>
            <div className="flex items-center gap-3">
              <a href="/login" className="flex items-center gap-1.5 border border-[#0052CC] text-[#0052CC] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#0052CC]/5 transition-all duration-300">
                Acessar Sistema
              </a>
              <a href="#cta" className="hidden md:flex items-center gap-2 bg-[#0052CC] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#0052CC]/90 transition-all duration-300">
                Agendar Demonstração
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </nav>

        {/* SEÇÃO 1: HERO */}
        <section id="hero" className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20 bg-white">
          <div className="absolute inset-0 bg-[#F4F5F7] opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2B2C33 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center w-full">

            <div className="text-left flex flex-col items-start z-20">

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#2B2C33] mb-6 leading-[1.1] scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
                Controle <span className="text-[#0052CC]">Inteligente</span> e<br />Monitoramento Escolar
              </h1>

              <p className="text-lg md:text-xl text-[#2B2C33]/70 font-light mb-10 max-w-2xl leading-relaxed scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
                Centralize ocorrências, automatize a redação de atas com o assistente ARI e gerencie o ranking comportamental em tempo real. O sistema definitivo para as Escolas Cívico-Militares.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-300">
                <a href="#cta" className="flex items-center justify-center gap-2 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-[#0052CC]/90 transition-colors shadow-lg bg-[#0052CC]">
                  Solicitar Demonstração
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a href="#modulos" className="flex items-center justify-center gap-2 bg-[#F4F5F7] border border-[#2B2C33]/10 text-[#2B2C33] px-8 py-4 rounded-full text-base font-medium hover:bg-[#F4F5F7]/80 transition-colors">
                  Ver Funcionalidades
                </a>
              </div>

              <div className="mt-16 flex flex-wrap gap-6 md:gap-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-400">
                <div className="flex items-center gap-2 text-sm font-mono text-[#2B2C33]/60 uppercase tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>
                  <ShieldCheck className="w-4 h-4 text-[#0052CC]" /> DRE Multi-Escola
                </div>
                <div className="w-px h-6 bg-[#2B2C33]/10 hidden md:block"></div>
                <div className="flex items-center gap-2 text-sm font-mono text-[#2B2C33]/60 uppercase tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>
                  <Cpu className="w-4 h-4 text-[#0052CC]" /> IA Nativo (ARI)
                </div>
              </div>
            </div>

            {/* LADO DIREITO: CARDS 3D */}
            <div className="hidden lg:block relative w-full perspective-[1200px]" id="hero3d" style={{ perspective: '1200px' }} ref={hero3dRef}>
              <div id="hero3d-container" className="w-full flex flex-col gap-4 max-w-[600px] ml-auto relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="hero-card bg-white/90 backdrop-blur-xl border border-[#2B2C33]/10 rounded-2xl p-3 shadow-xl transition-transform duration-200 ease-out"
                    data-depth="0.3" data-base-x="0" data-base-y="0" data-base-z="0"
                    style={{ transform: 'rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                    <div className="flex items-center justify-between border-b border-[#2B2C33]/10 pb-2 mb-3 px-2">
                      <span className="text-xs font-mono text-[#2B2C33]/70 tracking-wider" style={{ fontFamily: 'Geist Mono, monospace' }}># OCORRÊNCIAS</span>
                      <span className="text-[10px] text-[#2B2C33]/40 font-mono tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>[SYNC]</span>
                    </div>
                    <img src="https://i.postimg.cc/3xbPSpCD/image.png" alt="Ocorrências Preview" className="w-full h-auto rounded-xl border border-[#2B2C33]/10 shadow-sm" />
                  </div>

                  <div className="hero-card bg-white/90 backdrop-blur-xl border border-[#0052CC]/30 rounded-2xl p-3 shadow-xl transition-transform duration-200 ease-out"
                    data-depth="0.4" data-base-x="0" data-base-y="0" data-base-z="0"
                    style={{ transform: 'rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                    <div className="flex items-center justify-between border-b border-[#0052CC]/20 pb-2 mb-3 px-2 relative">
                      <span className="text-xs font-mono text-[#2B2C33]/70 tracking-wider" style={{ fontFamily: 'Geist Mono, monospace' }}># ARI</span>
                      <span className="text-[10px] text-[#0052CC] font-mono tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>[INDEX]</span>
                    </div>
                    <img src="https://i.postimg.cc/fbkHRL4L/Chat-GPT-Image-27-de-mai-de-2026-08-06-23.png" alt="ARI" className="w-full h-auto rounded-xl border border-[#0052CC]/20 shadow-sm" />
                  </div>
                </div>

                <div className="hero-card w-full bg-white/95 backdrop-blur-xl border border-[#2B2C33]/10 rounded-2xl p-3 shadow-xl transition-transform duration-200 ease-out z-10"
                  data-depth="0.5" data-base-x="0" data-base-y="0" data-base-z="0"
                  style={{ transform: 'rotateY(-10deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                  <div className="flex items-center justify-between border-b border-[#2B2C33]/10 pb-2 mb-3 px-2">
                    <span className="text-xs font-mono text-[#2B2C33] tracking-wider" style={{ fontFamily: 'Geist Mono, monospace' }}># DASHBOARD_EXECUTIVO</span>
                    <span className="text-[10px] text-green-600 font-mono tracking-widest" style={{ fontFamily: 'Geist Mono, monospace' }}>[LIVE]</span>
                  </div>
                  <img src="https://i.postimg.cc/3NJ4xPyy/image.png" alt="Dashboard Disciplinar" className="w-full h-auto rounded-xl border border-[#2B2C33]/10 shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: DOR */}
        <section id="problema" className="relative py-32 border-t border-[#F4F5F7] bg-white">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2B2C33] mb-6">A gestão disciplinar manual está esgotando sua coordenação?</h2>
              <p className="text-lg text-[#2B2C33]/70 font-light">Os métodos tradicionais de registro limitam a eficiência da escola e ocultam dados vitais sobre o comportamento dos alunos.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#F4F5F7] rounded-2xl p-8 border border-[#2B2C33]/5 hover:shadow-lg transition-all scroll-reveal opacity-0 translate-y-8 duration-700">
                <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#2B2C33] mb-3">Registros em Papel</h3>
                <p className="text-[#2B2C33]/70 text-sm leading-relaxed">Fichas disciplinares acumuladas em pastas dificultam a análise de reincidências e a contagem precisa da pontuação do aluno.</p>
              </div>
              <div className="bg-[#F4F5F7] rounded-2xl p-8 border border-[#2B2C33]/5 hover:shadow-lg transition-all scroll-reveal opacity-0 translate-y-8 duration-700 delay-100">
                <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#2B2C33] mb-3">Horas Perdidas</h3>
                <p className="text-[#2B2C33]/70 text-sm leading-relaxed">Redigir ATAs, Termos de Conduta e Convocações de Pais toma um tempo precioso que deveria ser focado no aspecto pedagógico.</p>
              </div>
              <div className="bg-[#F4F5F7] rounded-2xl p-8 border border-[#2B2C33]/5 hover:shadow-lg transition-all scroll-reveal opacity-0 translate-y-8 duration-700 delay-200">
                <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center mb-6">
                  <MessageSquareDashed className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#2B2C33] mb-3">Comunicação Tardia</h3>
                <p className="text-[#2B2C33]/70 text-sm leading-relaxed">Avisar responsáveis sobre ocorrências ou acidentes pode demorar dias devido à falta de uma centralização rápida da informação.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3: SOLUÇÃO */}
        <section id="solucao" className="relative py-32 border-t border-[#F4F5F7] bg-[#F4F5F7]">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
                <span className="text-xs font-mono text-[#0052CC] uppercase tracking-widest mb-4 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Inteligência Acadêmica</span>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2B2C33] mb-6">Controle Total e Inteligência a Seu Favor</h2>
                <p className="text-lg text-[#2B2C33]/70 font-light mb-8">O <strong className="orbitron text-[#0052CC]">SIGMILITAR</strong> resolve cada um desses desafios integrando funcionalidades de alta tecnologia desenhadas exclusivamente para a rotina Cívico-Militar.</p>

                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#2B2C33]/10 shadow-sm flex items-center justify-center shrink-0 mt-1">
                      <Zap className="w-5 h-5 text-[#0052CC]" />
                    </div>
                    <div>
                      <h4 className="text-[#2B2C33] font-semibold mb-1">Automação de ATAs com ARI</h4>
                      <p className="text-[#2B2C33]/70 text-sm">A Inteligência Artificial lê o relato, tipifica a infração via Regimento e gera a ATA formal em instantes.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#2B2C33]/10 shadow-sm flex items-center justify-center shrink-0 mt-1">
                      <BarChart2 className="w-5 h-5 text-[#0052CC]" />
                    </div>
                    <div>
                      <h4 className="text-[#2B2C33] font-semibold mb-1">Monitoramento em Tempo Real</h4>
                      <p className="text-[#2B2C33]/70 text-sm">Dashboards gerenciais apontam imediatamente as turmas críticas, faltas graves e a distribuição de ocorrências no mês.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#2B2C33]/10 shadow-sm flex items-center justify-center shrink-0 mt-1">
                      <Award className="w-5 h-5 text-[#0052CC]" />
                    </div>
                    <div>
                      <h4 className="text-[#2B2C33] font-semibold mb-1">Sistema de Pontuação Preciso</h4>
                      <p className="text-[#2B2C33]/70 text-sm">Cada registro atualiza automaticamente o saldo de 10.0 pontos do aluno, classificando-o no ranking comportamental.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="flex-1 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
                <div className="relative bg-white rounded-3xl border border-[#2B2C33]/10 p-2 overflow-hidden shadow-xl">
                  {/* Mock Dashboard Element */}
                  <div className="bg-[#F4F5F7] rounded-2xl border border-[#2B2C33]/5 p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6 border-b border-[#2B2C33]/10 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-[#2B2C33]/70 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Dashboard Executivo</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#0052CC] border border-[#0052CC]/30 px-2 py-1 rounded bg-white" style={{ fontFamily: 'Geist Mono, monospace' }}>LIVE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white border border-[#2B2C33]/5 rounded-xl p-4 shadow-sm">
                        <div className="text-[10px] font-mono text-[#2B2C33]/50 mb-1 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Ocorrências Mês</div>
                        <div className="text-2xl font-bold text-[#2B2C33]">124</div>
                      </div>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
                        <div className="text-[10px] font-mono text-red-600 mb-1 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Casos Graves</div>
                        <div className="text-2xl font-bold text-red-600">12</div>
                      </div>
                    </div>

                    <div className="flex-1 bg-white border border-[#2B2C33]/5 rounded-xl p-4 relative overflow-hidden shadow-sm">
                      <div className="text-[10px] font-mono text-[#2B2C33]/50 mb-3 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Alertas Recentes</div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-600" /><span className="text-[#2B2C33]/90 text-xs font-medium">Reincidência: João P.</span></div>
                          <span className="text-xs text-[#2B2C33]/50">Agora</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><Info className="w-3 h-3 text-[#0052CC]" /><span className="text-[#2B2C33]/90 text-xs font-medium">Elogio Art.50: Maria T.</span></div>
                          <span className="text-xs text-[#2B2C33]/50">10 min</span>
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
        <section id="modulos" className="relative py-32 border-t border-[#F4F5F7] bg-white">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
              <span className="text-xs font-mono text-[#0052CC] uppercase tracking-widest mb-4 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Ecossistema Completo</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2B2C33] mb-6">Gestão de Ponta a Ponta</h2>
              <p className="text-lg text-[#2B2C33]/70 font-light">Tudo que sua instituição precisa em uma única plataforma.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Gavel, title: 'Registro Disciplinar Completo', desc: 'Cadastro de infrações por turmas, atenuantes e detecção instantânea de multi-infratores baseado no regimento interno.' },
                { icon: Bot, title: 'Assistente ARI', desc: 'IA Nativa para geração de atas e relatórios gerenciais automáticos através do chat inteligente acoplado ao sistema.' },
                { icon: TrendingUp, title: 'Rankings e Pontuação', desc: 'Monitoramento do saldo de 10.0 pontos por aluno. Visualização rápida de quem se enquadra como Bom, Regular ou Irregular.' },
                { icon: Shield, title: 'Controle de Acidentes e Xerifes', desc: 'Módulos específicos para gerenciar acidentes escolares, atendimentos, e as escalas semanais de xerifes por turma.' },
                { icon: Building2, title: 'Painel DRE', desc: 'Visão consolidada multi-escola para a Diretoria, medindo o Índice de Disciplina e o nível de risco de cada unidade.' },
                { icon: Users, title: 'Convocações e Termos', desc: 'Criação rápida de termos de conduta e convocações para os pais com formatos prontos para impressão oficial.' },
              ].map((mod, idx) => (
                <div key={idx} className={`bg-[#F4F5F7] border border-[#2B2C33]/5 rounded-2xl p-8 hover:shadow-lg transition-all scroll-reveal opacity-0 translate-y-8 duration-700 delay-${(idx % 3) * 100} group`}>
                  <div className="w-12 h-12 rounded-full bg-white border border-[#2B2C33]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                    <mod.icon className="w-5 h-5 text-[#0052CC]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#2B2C33] mb-3">{mod.title}</h3>
                  <p className="text-[#2B2C33]/70 text-sm font-light leading-relaxed">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 5: PROVA SOCIAL */}
        <section className="relative py-32 border-t border-[#F4F5F7] bg-[#F4F5F7]">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2B2C33] mb-8">Validado no ambiente real.</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border-l-2 border-[#0052CC] pl-6 py-2">
                    <div className="text-4xl font-bold text-[#2B2C33] mb-1">91</div>
                    <div className="text-sm font-mono text-[#2B2C33]/60 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Artigos do Regimento Codificados</div>
                  </div>
                  <div className="border-l-2 border-[#0052CC] pl-6 py-2">
                    <div className="text-4xl font-bold text-[#2B2C33] mb-1">24/7</div>
                    <div className="text-sm font-mono text-[#2B2C33]/60 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Disponibilidade Operacional</div>
                  </div>
                  <div className="border-l-2 border-[#0052CC] pl-6 py-2">
                    <div className="text-4xl font-bold text-[#2B2C33] mb-1">100%</div>
                    <div className="text-sm font-mono text-[#2B2C33]/60 uppercase" style={{ fontFamily: 'Geist Mono, monospace' }}>Das escolas conectadas aprovam</div>
                  </div>
                </div>
              </div>

              <div className="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
                <div className="bg-white p-8 rounded-3xl border border-[#2B2C33]/10 relative shadow-xl">
                  <div className="absolute -top-4 right-8 bg-[#0052CC] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Verified User
                  </div>
                  <div className="flex mb-6 text-[#0052CC]">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-[#2B2C33] font-medium text-lg mb-8 leading-relaxed">
                    [DEPOIMENTO - PREENCHER] "O <strong className="orbitron text-[#0052CC]">SIGMILITAR</strong> mudou a nossa rotina. Antes perdíamos horas transcrevendo ATAs e checando pontuações no Excel. Hoje, a IA resolve a burocracia e nós focamos nos alunos. É indispensável para o modelo Cívico-Militar."
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#2B2C33] font-bold text-lg border border-[#2B2C33]/10">
                      G
                    </div>
                    <div>
                      <div className="text-[#2B2C33] font-bold">[Nome do Gestor]</div>
                      <div className="text-[#2B2C33]/60 text-sm">Direção — EECM [Nome da Escola]</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 6: COMO FUNCIONA */}
        <section className="relative py-32 border-t border-[#F4F5F7] bg-white">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2B2C33] mb-6">Do Registro à Resolução em 3 Passos</h2>
            </div>

            <div className="relative">
              <div className="absolute left-[23px] md:left-1/2 top-0 bottom-0 w-px bg-[#2B2C33]/10 md:-translate-x-1/2"></div>

              <div className="space-y-16">
                {[
                  { step: '01', title: 'Identificação Rápida', desc: 'Pelo celular ou tablet, o Monitor ou Professor relata a ocorrência (ou elogio) selecionando os alunos envolvidos de forma fácil.' },
                  { step: '02', title: 'Processamento via IA (ARI)', desc: 'O assistente analisa o relato, tipifica segundo os 91 artigos, calcula atenuantes, atualiza o saldo e redige automaticamente a ATA Oficial.' },
                  { step: '03', title: 'Ação e Visibilidade', desc: 'Gestores validam, pais recebem as notificações e os painéis (Rankings e DRE) são atualizados ao vivo para acompanhamento.' }
                ].map((item, idx) => (
                  <div key={idx} className="relative flex flex-col md:flex-row items-start md:justify-between scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
                    <div className={`md:w-5/12 ml-16 md:ml-0 pt-2 ${idx % 2 === 0 ? 'order-2 md:order-1 md:text-right' : 'order-2 md:order-3'}`}>
                      <h3 className="text-2xl font-bold text-[#2B2C33] mb-3">{item.title}</h3>
                      <p className="text-[#2B2C33]/70 font-light leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-[#F4F5F7] flex items-center justify-center z-10 text-[#0052CC] font-mono font-bold text-sm shadow-md" style={{ fontFamily: 'Geist Mono, monospace' }}>{item.step}</div>
                    <div className={`md:w-5/12 ${idx % 2 === 0 ? 'order-3 md:order-3' : 'order-1 md:order-1'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 7: DIFERENCIAIS */}
        <section id="diferenciais" className="relative py-32 border-t border-[#F4F5F7] bg-white">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#2B2C33] mb-6">Por que o <strong className="orbitron text-[#0052CC]">SIGMILITAR</strong> é incomparável?</h2>
            </div>

            <div className="bg-white border border-[#2B2C33]/10 rounded-3xl overflow-hidden scroll-reveal opacity-0 translate-y-8 transition-all duration-700 shadow-xl">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-[#2B2C33]/10 bg-white">
                  <h3 className="text-2xl font-bold text-[#2B2C33] mb-6">Arquitetura de Ponta</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#0052CC] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[#2B2C33] font-semibold mb-1">Importação Inteligente com IA</div>
                        <div className="text-[#2B2C33]/70 text-sm">Adicione turmas via planilhas. A IA entende e mapeia as colunas sozinha.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#0052CC] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[#2B2C33] font-semibold mb-1">Segurança Multi-Tenant</div>
                        <div className="text-[#2B2C33]/70 text-sm">Dados 100% isolados entre as escolas e perfis com auditoria total de ações.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#0052CC] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[#2B2C33] font-semibold mb-1">Real-time Sincronizado</div>
                        <div className="text-[#2B2C33]/70 text-sm">As modificações refletem simultaneamente para todos os monitores logados.</div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="p-8 md:p-12 bg-[#F4F5F7]">
                  <h3 className="text-2xl font-bold text-[#2B2C33] mb-6">Sistemas Comuns</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 opacity-70">
                      <X className="w-5 h-5 text-[#2B2C33]/50 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[#2B2C33] font-semibold mb-1">Cadastro Manual Demorado</div>
                        <div className="text-[#2B2C33]/70 text-sm">Dependência pesada de TI para formatar ou importar planilhas.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 opacity-70">
                      <X className="w-5 h-5 text-[#2B2C33]/50 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[#2B2C33] font-semibold mb-1">Redação 100% Manual</div>
                        <div className="text-[#2B2C33]/70 text-sm">A coordenação perde horas tipificando qual regra do regimento foi violada.</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 opacity-70">
                      <X className="w-5 h-5 text-[#2B2C33]/50 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[#2B2C33] font-semibold mb-1">Módulos Desconexos</div>
                        <div className="text-[#2B2C33]/70 text-sm">Um sistema para faltas, planilhas para comportamento e cadernos para ocorrências.</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 8: CTA FINAL */}
        <section id="cta" className="relative py-32 border-t border-[#F4F5F7] overflow-hidden bg-white">
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-[#2B2C33] mb-8">Eleve a <span className="text-[#0052CC]">disciplina</span> e <span className="text-[#0052CC]">gestão</span> da sua instituição hoje.</h2>

            <div className="bg-[#F4F5F7] border border-[#2B2C33]/10 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-xl scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
              <h3 className="text-2xl font-bold text-[#2B2C33] mb-2">Solicite sua implantação guiada</h3>
              <p className="text-[#2B2C33]/70 text-sm mb-8">Nossa equipe realizará o setup do sistema, integração dos alunos e treinamento do seu corpo docente.</p>

              {submitted ? (
                <div className="bg-[#0052CC]/10 border border-[#0052CC]/20 rounded-2xl p-6 text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-[#0052CC] mx-auto" />
                  <h4 className="font-bold text-[#2B2C33]">Demonstração Solicitada!</h4>
                  <p className="text-sm text-[#2B2C33]/70">Entraremos em contato em até 24 horas.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-mono text-[#2B2C33]/60 uppercase tracking-widest mb-2 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Nome da Instituição</label>
                    <input type="text" value={form.school} onChange={e => setForm(v => ({ ...v, school: e.target.value }))} placeholder="Ex: EECM Prof. João Batista" className="w-full bg-white border border-[#2B2C33]/10 rounded-xl px-4 py-3.5 text-[#2B2C33] text-sm placeholder-[#2B2C33]/40 focus:border-[#0052CC] focus:outline-none focus:ring-1 focus:ring-[#0052CC]/30 transition-colors shadow-sm" required />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#2B2C33]/60 uppercase tracking-widest mb-2 block" style={{ fontFamily: 'Geist Mono, monospace' }}>E-mail Profissional</label>
                    <input type="email" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} placeholder="gestao@escola.com.br" className="w-full bg-white border border-[#2B2C33]/10 rounded-xl px-4 py-3.5 text-[#2B2C33] text-sm placeholder-[#2B2C33]/40 focus:border-[#0052CC] focus:outline-none focus:ring-1 focus:ring-[#0052CC]/30 transition-colors shadow-sm" required />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#2B2C33]/60 uppercase tracking-widest mb-2 block" style={{ fontFamily: 'Geist Mono, monospace' }}>Telefone / WhatsApp</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} placeholder="(00) 00000-0000" className="w-full bg-white border border-[#2B2C33]/10 rounded-xl px-4 py-3.5 text-[#2B2C33] text-sm placeholder-[#2B2C33]/40 focus:border-[#0052CC] focus:outline-none focus:ring-1 focus:ring-[#0052CC]/30 transition-colors shadow-sm" required />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 mt-4 rounded-xl text-white font-bold text-lg hover:bg-[#0052CC]/90 transition-colors shadow-lg bg-[#0052CC] flex items-center justify-center gap-2">
                    {loading ? 'Processando...' : 'Agendar Reunião de Implantação'}
                  </button>
                </form>
              )}
              <p className="text-xs text-[#2B2C33]/50 font-mono mt-6 text-center" style={{ fontFamily: 'Geist Mono, monospace' }}>Versão atual: 25.05.26.08:31 · Sem spam · Dados protegidos</p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 9: FOOTER */}
        <footer className="border-t border-[#F4F5F7] bg-[#F4F5F7] pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12">
              <div className="mb-8 md:mb-0">
                <img src="https://i.postimg.cc/rwTsT0rf/LOGO-SIGMILITAR.jpg" alt="SIGMILITAR" className="h-16 md:h-20 w-auto object-contain rounded-xl mb-4" />
                <p className="text-[#2B2C33]/70 text-sm max-w-xs leading-relaxed mt-4">
                  Sistema Integrado de Gestão Cívico Militar. Automação, segurança e eficiência.
                </p>
              </div>
              <div className="flex gap-16">
                <div>
                  <h4 className="text-[#2B2C33] font-bold mb-4 text-sm">Plataforma</h4>
                  <ul className="space-y-2 text-sm text-[#2B2C33]/70">
                    <li><a className="hover:text-[#0052CC] transition-colors" href="#problema">Visão Geral</a></li>
                    <li><a className="hover:text-[#0052CC] transition-colors" href="#modulos">Módulos</a></li>
                    <li><a className="hover:text-[#0052CC] transition-colors" href="#diferenciais">Segurança</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-[#2B2C33] font-bold mb-4 text-sm">Contato</h4>
                  <ul className="space-y-2 text-sm text-[#2B2C33]/70">
                    <li><a className="hover:text-[#0052CC] transition-colors" href="#">Suporte</a></li>
                    <li><a className="hover:text-[#0052CC] transition-colors" href="#cta">Implantação</a></li>
                    <li><a className="hover:text-[#0052CC] transition-colors" href="/login">Acessar Sistema</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-[#2B2C33]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[#2B2C33]/50 text-xs font-mono" style={{ fontFamily: 'Geist Mono, monospace' }}>© 2026 <strong className="orbitron text-[#2B2C33]">SIGMILITAR</strong>. Todos os direitos reservados.</p>
              <div className="flex items-center gap-4 text-[#2B2C33]/50">
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
