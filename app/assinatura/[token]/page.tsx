'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Clock, FileText, ShieldCheck, XCircle } from 'lucide-react';

type SignatureRequest = {
  id: string;
  occurrence_id: string;
  document_type: string;
  recipient_name: string;
  recipient_phone: string;
  status: 'pending' | 'approved' | 'expired' | 'cancelled';
  approved_at?: string | null;
  expires_at: string;
};

export default function SignaturePage() {
  const params = useParams();
  const token = String(params?.token || '');
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [documentHtml, setDocumentHtml] = useState('');
  const [identity, setIdentity] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/signatures/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao carregar solicitacao.');
        setRequest(data.request);
        setDocumentHtml(data.documentHtml || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const approve = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/signatures/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, identityConfirmation: identity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao aprovar assinatura.');
      setRequest(data.request);
    } catch (err: any) {
      setError(err.message || 'Falha ao aprovar assinatura.');
    } finally {
      setSaving(false);
    }
  };

  const canApprove = request?.status === 'pending' && identity.trim().length >= 3 && accepted;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Assinatura digital simples</h1>
            <p className="text-sm text-slate-500">Visualize o documento, confirme sua identidade e aprove a ciência.</p>
          </div>
          {request ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {request.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : request.status === 'pending' ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {request.status === 'approved' ? 'Aprovado' : request.status === 'pending' ? 'Pendente' : 'Indisponível'}
            </span>
          ) : null}
        </section>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">Carregando documento...</div>
        ) : error && !request ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center text-rose-600">{error}</div>
        ) : request ? (
          <>
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 text-sm font-bold text-slate-600">
                <FileText className="w-4 h-4" /> Documento para visualização
              </div>
              <iframe
                title="Documento da ocorrência"
                srcDoc={documentHtml}
                className="w-full h-[620px] bg-white"
                sandbox=""
              />
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
              {request.status === 'approved' ? (
                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <CheckCircle2 className="w-6 h-6" />
                  <div>
                    <p className="font-bold">Documento aprovado/assinado.</p>
                    <p className="text-sm">Registro feito em {request.approved_at ? new Date(request.approved_at).toLocaleString('pt-BR') : 'data não informada'}.</p>
                  </div>
                </div>
              ) : request.status !== 'pending' ? (
                <div className="text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-4">Solicitação expirada ou cancelada.</div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Confirmação de identidade mínima</label>
                    <input
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      placeholder="Digite seu nome completo ou CPF parcial"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <label className="flex items-start gap-3 text-sm text-slate-600">
                    <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
                    <span>Declaro que sou {request.recipient_name} ou responsável autorizado e aprovo/assino digitalmente este documento.</span>
                  </label>
                  {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                  <button
                    type="button"
                    onClick={approve}
                    disabled={!canApprove || saving}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                  >
                    {saving ? 'Registrando...' : 'Aprovar / assinar'}
                  </button>
                </>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
