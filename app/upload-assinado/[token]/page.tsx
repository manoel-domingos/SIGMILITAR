'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Clock, FileText, Upload, XCircle } from 'lucide-react';

type UploadStatus = 'carregando' | 'pendente' | 'enviado' | 'expirado' | 'invalido' | 'erro';

export default function UploadAssinadoPage() {
  const params = useParams();
  const token = String(params?.token || '');
  const [status, setStatus] = useState<UploadStatus>('carregando');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/signed-documents/upload?token=${encodeURIComponent(token)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus(data.status === 'invalido' ? 'invalido' : 'erro');
          setMessage(data.error || 'Link inválido.');
          return;
        }
        setStatus(data.status || 'pendente');
        setExpiresAt(data.expires_at || null);
      } catch (error: any) {
        setStatus('erro');
        setMessage(error.message || 'Erro ao consultar link.');
      }
    };

    loadStatus();
  }, [token]);

  const submitFile = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setMessage('');

    try {
      const form = new FormData();
      form.append('token', token);
      form.append('file', file);

      const response = await fetch('/api/signed-documents/upload', {
        method: 'POST',
        body: form,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || 'Falha ao enviar documento.');
        if (response.status === 410) setStatus('expirado');
        if (response.status === 409) setStatus('enviado');
        return;
      }

      setStatus('enviado');
      setMessage('Documento enviado com sucesso.');
      setFile(null);
    } catch (error: any) {
      setMessage(error.message || 'Falha ao enviar documento.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusCard = {
    carregando: { icon: Clock, title: 'Consultando link...', text: 'Aguarde.', color: 'text-slate-500' },
    pendente: { icon: Upload, title: 'Enviar documento assinado', text: 'Selecione PDF, JPG ou PNG até 10MB.', color: 'text-blue-600' },
    enviado: { icon: CheckCircle, title: 'Documento enviado', text: 'Recebemos o arquivo assinado.', color: 'text-emerald-600' },
    expirado: { icon: XCircle, title: 'Link expirado', text: 'Solicite novo QR Code à escola.', color: 'text-amber-600' },
    invalido: { icon: XCircle, title: 'Link inválido', text: 'Token não encontrado.', color: 'text-red-600' },
    erro: { icon: XCircle, title: 'Erro', text: message || 'Tente novamente.', color: 'text-red-600' },
  }[status];
  const Icon = statusCard.icon;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 ${statusCard.color}`}>
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black">{statusCard.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{statusCard.text}</p>
          {expiresAt && status === 'pendente' && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Expira em {new Date(expiresAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        {status === 'pendente' && (
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50">
              <FileText className="mb-3 h-8 w-8 text-slate-400" />
              <span className="text-sm font-bold text-slate-700">{file ? file.name : 'Escolher arquivo'}</span>
              <span className="mt-1 text-xs text-slate-400">PDF, JPG ou PNG</span>
              <input
                className="hidden"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              onClick={submitFile}
              disabled={!file || submitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar documento'}
            </button>
          </div>
        )}

        {message && status !== 'erro' && (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-center text-sm font-semibold text-slate-600">{message}</p>
        )}
      </section>
    </main>
  );
}
