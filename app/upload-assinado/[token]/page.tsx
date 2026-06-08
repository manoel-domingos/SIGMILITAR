'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Camera, FileText, Upload, XCircle, ScanLine } from 'lucide-react';

type UploadStatus = 'carregando' | 'pendente' | 'enviado' | 'expirado' | 'invalido' | 'erro';

interface OccurrenceSummary {
  ata_number: string | null;
  student_name: string;
  student_class: string;
  infractions: string[];
}

export default function UploadAssinadoPage() {
  const params = useParams();
  const token = String(params?.token || '');
  const [status, setStatus] = useState<UploadStatus>('carregando');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [occurrence, setOccurrence] = useState<OccurrenceSummary | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Pré-visualização local do arquivo selecionado (antes e depois do envio).
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
        setOccurrence(data.occurrence || null);
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
      // Mantém o arquivo para exibir a pré-visualização do que foi enviado.
    } catch (error: any) {
      setMessage(error.message || 'Falha ao enviar documento.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusCard = {
    carregando: { icon: Clock, title: 'Consultando link...', text: 'Aguarde.', color: 'text-slate-500' },
    pendente: { icon: Upload, title: 'Enviar documento assinado', text: 'Tire uma foto, escolha um arquivo ou escaneie o documento.', color: 'text-blue-600' },
    enviado: { icon: CheckCircle, title: 'Documento enviado', text: 'Recebemos o arquivo assinado.', color: 'text-emerald-600' },
    expirado: { icon: XCircle, title: 'Link expirado', text: 'Solicite novo QR Code à escola.', color: 'text-amber-600' },
    invalido: { icon: XCircle, title: 'Link inválido', text: 'Token não encontrado.', color: 'text-red-600' },
    erro: { icon: XCircle, title: 'Erro', text: message || 'Tente novamente.', color: 'text-red-600' },
  }[status];
  const Icon = statusCard.icon;

  const ACCEPT = 'application/pdf,image/jpeg,image/png';

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

        {/* Dados da ocorrência */}
        {occurrence && (status === 'pendente' || status === 'enviado') && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Ocorrência</h2>
            <dl className="space-y-1.5">
              {occurrence.ata_number && (
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-slate-500">Nº ATA</dt>
                  <dd className="text-right font-bold text-slate-800">{occurrence.ata_number}</dd>
                </div>
              )}
              {occurrence.student_name && (
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-slate-500">Aluno</dt>
                  <dd className="text-right font-bold text-slate-800">
                    {occurrence.student_name}
                    {occurrence.student_class ? ` (${occurrence.student_class})` : ''}
                  </dd>
                </div>
              )}
              {occurrence.infractions?.length > 0 && (
                <div>
                  <dt className="font-semibold text-slate-500">Infração</dt>
                  <dd className="mt-1 space-y-1">
                    {occurrence.infractions.map((inf, i) => (
                      <p key={i} className="rounded-lg bg-white px-2 py-1 text-xs text-slate-700">{inf}</p>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {status === 'pendente' && (
          <div className="space-y-3">
            {/* Tirar foto (abre a câmera no celular) */}
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50">
              <Camera className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Tirar foto</span>
              <input
                className="hidden"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            {/* Escolher arquivo do celular */}
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Escolher arquivo</span>
              <input
                className="hidden"
                type="file"
                accept={ACCEPT}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            {/* Escanear documento — no iPhone/iPad o seletor oferece "Digitalizar Documentos" */}
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50">
              <ScanLine className="h-5 w-5 text-blue-600" />
              <div>
                <span className="block text-sm font-bold text-slate-700">Escanear documento</span>
                <span className="block text-xs text-slate-400">No iPhone, toque em &quot;Digitalizar Documentos&quot;.</span>
              </div>
              <input
                className="hidden"
                type="file"
                accept={ACCEPT}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            {file && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Pré-visualização" className="mb-2 max-h-56 w-full rounded-xl object-contain" />
                ) : (
                  <div className="mb-2 flex items-center justify-center gap-2 py-4 text-blue-600">
                    <FileText className="h-7 w-7" />
                    <span className="text-sm font-bold">{file.type === 'application/pdf' ? 'PDF' : 'Arquivo'} pronto para envio</span>
                  </div>
                )}
                <p className="truncate text-center text-xs font-semibold text-blue-700">{file.name}</p>
              </div>
            )}

            <button
              type="button"
              onClick={submitFile}
              disabled={!file || submitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar documento'}
            </button>
            <p className="text-center text-xs text-slate-400">PDF, JPG ou PNG até 10MB.</p>
          </div>
        )}

        {status === 'enviado' && file && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Documento enviado" className="mb-2 max-h-56 w-full rounded-xl object-contain" />
            ) : (
              <div className="mb-2 flex items-center justify-center gap-2 py-4 text-emerald-600">
                <FileText className="h-7 w-7" />
                <span className="text-sm font-bold">{file.type === 'application/pdf' ? 'PDF' : 'Arquivo'} enviado</span>
              </div>
            )}
            <p className="truncate text-center text-xs font-semibold text-emerald-700">{file.name}</p>
          </div>
        )}

        {message && status !== 'erro' && (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-center text-sm font-semibold text-slate-600">{message}</p>
        )}
      </section>
    </main>
  );
}
