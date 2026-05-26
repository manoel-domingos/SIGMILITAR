'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Database,
  Cpu,
  Server,
} from 'lucide-react';

type ServerStatus = {
  deepseek: { configured: boolean; reachable: boolean; models: string[]; error: string | null };
  supabase: {
    configured: boolean;
    hasServiceKey: boolean;
    reachable: boolean;
    queryTest: { success: boolean; error?: string } | null;
    error: string | null;
  };
  server: { nodeEnv: string; timestamp: string };
};

type CheckState = 'loading' | 'ok' | 'warn' | 'error';

function StatusBadge({ state }: { state: CheckState }) {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        <Loader2 className="w-3 h-3 animate-spin" /> verificando
      </span>
    );
  }
  if (state === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" /> conectado
      </span>
    );
  }
  if (state === 'warn') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <AlertCircle className="w-3 h-3" /> não configurado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
      <XCircle className="w-3 h-3" /> erro
    </span>
  );
}

type Card = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  state: CheckState;
  detail: React.ReactNode;
  hint?: string;
};

export default function StatusPage() {
  const [server, setServer] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ServerStatus;
      setServer(json);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // --- Supabase card ---
  const supaState: CheckState = loading
    ? 'loading'
    : !server
    ? 'error'
    : !server.supabase.configured
    ? 'warn'
    : !server.supabase.reachable
    ? 'error'
    : server.supabase.queryTest?.success === false
    ? 'warn'
    : 'ok';

  const supaDetail = loading
    ? 'Verificando…'
    : !server
    ? fetchError || 'Servidor indisponível.'
    : !server.supabase.configured
    ? 'Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.'
    : !server.supabase.reachable
    ? server.supabase.error || 'Não foi possível alcançar o Supabase.'
    : server.supabase.queryTest?.success === false
    ? 'Conex\u00e3o OK, mas consulta falhou: ' + server.supabase.queryTest.error
    : 'Conex\u00e3o e consulta bem-sucedidas.' + (server.supabase.hasServiceKey ? ' Service key presente.' : '');

  const supaCard: Card = {
    icon: <Database className="w-5 h-5" />,
    title: 'Supabase',
    subtitle: 'Banco de dados e autenticação',
    state: supaState,
    detail: supaDetail,
    hint:
      supaState === 'warn' && !server?.supabase.configured
        ? 'Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no painel de Vars.'
        : undefined,
  };

  // --- DeepSeek card ---
  const deepseekState: CheckState = loading
    ? 'loading'
    : !server
    ? 'error'
    : !server.deepseek.configured
    ? 'warn'
    : server.deepseek.reachable
    ? 'ok'
    : 'error';

  const deepseekDetail = loading
    ? 'Verificando…'
    : !server
    ? fetchError || 'Servidor indisponível.'
    : !server.deepseek.configured
    ? 'A variável DEEPSEEK_API_KEY não foi configurada.'
    : server.deepseek.reachable
    ? 'Chave v\u00e1lida. Modelos dispon\u00edveis: ' + (server.deepseek.models.join(', ') || '\u2014')
    : server.deepseek.error || 'Chave configurada, mas a API recusou a conexão.';

  const deepseekCard: Card = {
    icon: <Cpu className="w-5 h-5" />,
    title: 'DeepSeek API',
    subtitle: 'IA para ATA, análise de comportamento e relatórios',
    state: deepseekState,
    detail: deepseekDetail,
    hint:
      deepseekState === 'warn'
        ? 'Adicione DEEPSEEK_API_KEY no painel de Vars para liberar as funcionalidades de IA.'
        : undefined,
  };

  // --- Server card ---
  const serverCard: Card = {
    icon: <Server className="w-5 h-5" />,
    title: 'Servidor',
    subtitle: 'Ambiente de execução Next.js',
    state: loading ? 'loading' : server ? 'ok' : 'error',
    detail: loading
      ? 'Verificando…'
      : server
      ? `Ambiente: ${server.server.nodeEnv}`
      : fetchError || 'Não foi possível consultar o servidor.',
  };

  const cards = [supaCard, deepseekCard, serverCard];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> voltar
          </Link>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> atualizar
          </button>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Status das integrações</h1>
          <p className="text-sm text-slate-500 mt-1">
            Diagnóstico rápido das conexões externas usadas pelo sistema.
          </p>
        </header>

        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
                      <StatusBadge state={card.state} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{card.subtitle}</p>
                    {card.detail && (
                      <p className="text-sm text-slate-600 mt-2 break-words">{card.detail}</p>
                    )}
                    {card.hint && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mt-2 inline-block">
                        {card.hint}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {server?.server && (
          <p className="mt-8 text-xs text-slate-400 text-center">
            Última verificação: {new Date(server.server.timestamp).toLocaleTimeString('pt-BR')}
          </p>
        )}

        <div className="mt-10 p-5 rounded-xl bg-slate-100 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Como adicionar as chaves</h3>
          <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
            <li>
              Abra o painel <strong>Vars</strong> nas configurações do projeto.
            </li>
            <li>Adicione, uma por uma, as chaves marcadas como não configurado acima.</li>
            <li>
              Volte aqui e clique em <strong>atualizar</strong> para conferir.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
