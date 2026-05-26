'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ShieldCheck, Cpu, FileText, Clock, MessageSquare, 
  Zap, BarChart2, Award, Gavel, Brain, TrendingUp, Shield, Users, Star, 
  CheckCircle, X, AlertTriangle, Info, Play, ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const [form, setForm] = useState({ school: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans scroll-smooth">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[180px] opacity-[0.07] bg-blue-600 pointer-events-none z-0" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 z-0" style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)' }} />

      {/* Header / Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-wider font-mono text-blue-500">SIG<span className="text-white">MILITAR</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#problema" className="hover:text-white transition-colors">Problema</a>
            <a href="#solucao" className="hover:text-white transition-colors">Solução</a>
            <a href="#modulos" className="hover:text-white transition-colors">Módulos</a>
            <a href="#cta" className="hover:text-white transition-colors">Demonstração</a>
          </div>
          <a href="#cta" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            Agendar Demonstração
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Text */}
          <div className="text-left flex flex-col items-start">
            <div className="inline-flex text-xs font-semibold text-blue-400 tracking-wide bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 px-4 py-1.5 items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-blue-400"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              GESTÃO DISCIPLINAR DE ALTO DESEMPENHO
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Controle <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-blue-400">Inteligente</span> e<br />Monitoramento Escolar
            </h1>

            <p className="text-lg md:text-xl text-white/60 font-light mb-10 max-w-2xl leading-relaxed">
              Centralize ocorrências, automatize a redação de atas com o assistente ARIA e gerencie o ranking comportamental em tempo real. O sistema definitivo para as Escolas Cívico-Militares.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="#cta" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-base font-semibold transition shadow-lg shadow-blue-500/25 active:scale-95">
                Solicitar Demonstração
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#modulos" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/10 transition-colors">
                Ver Funcionalidades
              </a>
            </div>

            <div className="mt-16 flex flex-wrap gap-8">
              <div className="flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-blue-500" /> DRE Multi-Escola
              </div>
              <div className="w-px h-6 bg-white/10 hidden md:block"></div>
              <div className="flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-widest">
                <Cpu className="w-4 h-4 text-blue-500" /> IA Nativo (ARIA)
              </div>
            </div>
          </div>

          {/* Right Preview Images */}
          <div className="relative w-full flex flex-col gap-4 max-w-[550px] ml-auto">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-[10px] font-mono text-white/40 tracking-wider"># DASHBOARD_EXECUTIVO</span>
                <span className="text-[9px] text-emerald-400 font-mono tracking-widest">LIVE</span>
              </div>
              <div className="bg-white/5 rounded-xl border border-white/5 h-48 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="z-10 text-center space-y-2">
                  <BarChart2 className="w-8 h-8 text-blue-500 mx-auto animate-pulse" />
                  <p className="text-xs text-white/40 font-mono">Carregando painel disciplinar...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problema" className="relative py-32 border-t border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">A gestão disciplinar manual está esgotando sua coordenação?</h2>
            <p className="text-lg text-white/60 font-light">Os métodos tradicionais de registro limitam a eficiência da escola e ocultam dados vitais sobre o comportamento dos alunos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Registros em Papel</h3>
              <p className="text-white/60 text-sm leading-relaxed">Fichas disciplinares acumuladas em pastas dificultam a análise de reincidências e a contagem precisa da pontuação do aluno.</p>
            </div>
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Horas Perdidas</h3>
              <p className="text-white/60 text-sm leading-relaxed">Redigir ATAs, Termos de Conduta e Convocações de Pais toma um tempo precioso que deveria ser focado no aspecto pedagógico.</p>
            </div>
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition duration-300">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Comunicação Tardia</h3>
              <p className="text-white/60 text-sm leading-relaxed">Avisar responsáveis sobre ocorrências ou acidentes pode demorar dias devido à falta de uma centralização rápida da informação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucao" className="relative py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <span className="text-xs font-mono text-blue-500 uppercase tracking-widest mb-4 block">Inteligência Acadêmica</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">Controle Total e Inteligência a Seu Favor</h2>
              <p className="text-lg text-white/60 font-light mb-8">O SIGMILITAR resolve cada um desses desafios integrando funcionalidades de alta tecnologia desenhadas exclusivamente para a rotina Cívico-Militar.</p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Automação de ATAs com ARIA</h4>
                    <p className="text-white/50 text-sm">A Inteligência Artificial lê o relato, tipifica a infração via Regimento e gera a ATA formal em instantes.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <BarChart2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Monitoramento em Tempo Real</h4>
                    <p className="text-white/50 text-sm">Dashboards gerenciais apontam imediatamente as turmas críticas, faltas graves e a distribuição de ocorrências no mês.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <Award className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Sistema de Pontuação Preciso</h4>
                    <p className="text-white/50 text-sm">Cada registro atualiza automaticamente o saldo de 10.0 pontos do aluno, classificando-o no ranking comportamental.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="flex-1">
              <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 p-6 h-[380px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-white/50 uppercase">Dashboard Executivo</span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-500 border border-blue-500/30 px-2 py-1 rounded">LIVE</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] font-mono text-white/40 mb-1 uppercase">Ocorrências Mês</div>
                    <div className="text-2xl font-medium text-white">124</div>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                    <div className="text-[10px] font-mono text-red-400 mb-1 uppercase">Casos Graves</div>
                    <div className="text-2xl font-medium text-red-500">12</div>
                  </div>
                </div>

                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-4 relative overflow-hidden">
                  <div className="text-[10px] font-mono text-white/40 mb-3 uppercase">Alertas Recentes</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-500" /><span className="text-white/80">Reincidência: João P.</span></div>
                      <span className="text-white/30">Agora</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2"><Info className="w-3 h-3 text-blue-500" /><span className="text-white/80">Elogio Art.50: Maria T.</span></div>
                      <span className="text-white/30">10 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modulos" className="relative py-32 border-t border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-mono text-blue-500 uppercase tracking-widest mb-4 block">Ecossistema Completo</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">Gestão de Ponta a Ponta</h2>
            <p className="text-lg text-white/60 font-light">Tudo que sua instituição precisa em uma única plataforma.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Gavel className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Registro Disciplinar</h3>
              <p className="text-white/60 text-sm font-light">Cadastro de infrações por turmas, atenuantes e detecção instantânea de multi-infratores baseado no regimento interno.</p>
            </div>
            
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Assistente ARIA</h3>
              <p className="text-white/60 text-sm font-light">IA Nativa para geração de atas e relatórios gerenciais automáticos através do chat inteligente acoplado ao sistema.</p>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Rankings e Pontuação</h3>
              <p className="text-white/60 text-sm font-light">Comportamento do saldo de 10.0 pontos por aluno. Visualização rápida de quem se enquadra como Bom, Regular ou Irregular.</p>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Acidentes e Xerifes</h3>
              <p className="text-white/60 text-sm font-light">Módulos específicos para gerenciar acidentes escolares, atendimentos, e as escalas semanais de xerifes por turma.</p>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <BarChart2 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Painel DRE</h3>
              <p className="text-white/60 text-sm font-light">Visão consolidada multi-escola para a Diretoria, medindo o Índice de Disciplina e o nível de risco de cada unidade.</p>
            </div>

            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/15 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Convocações e Termos</h3>
              <p className="text-white/60 text-sm font-light">Criação rápida de termos de conduta e convocações para os pais com formatos prontos para impressão oficial.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative py-32 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8">Eleve a <span className="text-blue-500">disciplina</span> e <span className="text-blue-500">gestão</span> da sua instituição hoje.</h2>
          
          <div className="bg-black border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
            <h3 className="text-xl font-medium text-white mb-2">Solicite sua implantação guiada</h3>
            <p className="text-white/50 text-sm mb-8">Nossa equipe realizará o setup do sistema, integração dos alunos e treinamento do seu corpo docente.</p>
            
            {submitted ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-300">
                <CheckCircle className="w-12 h-12 text-blue-500 mx-auto" />
                <h4 className="font-bold text-white">Demonstração Solicitada!</h4>
                <p className="text-xs text-white/60">Entraremos em contato via telefone/e-mail profissional em até 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5 block">Nome da Instituição</label>
                  <input 
                    type="text" 
                    value={form.school}
                    onChange={e => setForm(v => ({ ...v, school: e.target.value }))}
                    placeholder="Ex: EECM Prof. João Batista" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none transition" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5 block">E-mail Profissional</label>
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                    placeholder="gestao@escola.com.br" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none transition" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5 block">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    value={form.phone}
                    onChange={e => setForm(v => ({ ...v, phone: e.target.value }))}
                    placeholder="(00) 00000-0000" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none transition" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 mt-4 rounded-xl text-white font-semibold text-base hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 bg-blue-600 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processando...' : 'Agendar Reunião de Implantação'}
                </button>
              </form>
            )}
            <p className="text-[10px] text-white/30 font-mono mt-6 text-center">v.25.05.26.08:31 · Sem spam · Dados protegidos</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12">
            <div className="mb-8 md:mb-0">
              <span className="text-xl font-bold tracking-wider font-mono text-blue-500">SIG<span className="text-white">MILITAR</span></span>
              <p className="text-white/40 text-sm max-w-xs leading-relaxed mt-4">
                Sistema Integrado de Gestão Cívico Militar. Automação, segurança e eficiência.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-white font-medium mb-4 text-sm">Plataforma</h4>
                <ul className="space-y-2 text-sm text-white/40">
                  <li><a className="hover:text-white transition-colors" href="#problema">Visão Geral</a></li>
                  <li><a className="hover:text-white transition-colors" href="#modulos">Módulos</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-4 text-sm">Contato</h4>
                <ul className="space-y-2 text-sm text-white/40">
                  <li><a className="hover:text-white transition-colors" href="#cta">Implantação</a></li>
                  <li><a className="hover:text-white transition-colors" href="/login">Acessar Sistema</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-xs font-mono">© 2026 SIGMILITAR. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 text-white/30">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-mono">SECURED BY SUPABASE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
