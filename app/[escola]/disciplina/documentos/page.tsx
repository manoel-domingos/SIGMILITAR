'use client';

import AppShell from '@/components/AppShell';
import { FolderOpen, ExternalLink, Upload, RefreshCw, FileText, Image, Video, File, X, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

const DRIVE_FOLDER_ID = '1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk';
const DRIVE_EMBED_URL = `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}#list`;
const DRIVE_OPEN_URL = `https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`;
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'done' | 'error';
  driveId?: string;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
    tokenClient: any;
  }
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  if (type.startsWith('video/')) return <Video className="w-4 h-4 text-purple-500" />;
  if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-slate-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentosPage() {
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const dragCounter = useRef(0);

  // Carrega gapi e gis scripts
  useEffect(() => {
    // GAPI (Picker)
    if (!document.getElementById('gapi-script')) {
      const s = document.createElement('script');
      s.id = 'gapi-script';
      s.src = 'https://apis.google.com/js/api.js';
      s.onload = () => {
        window.gapi.load('picker', () => setGapiReady(true));
      };
      document.body.appendChild(s);
    } else if (window.gapi) {
      window.gapi.load('picker', () => setGapiReady(true));
    }

    // GIS (OAuth2)
    if (!document.getElementById('gis-script')) {
      const s = document.createElement('script');
      s.id = 'gis-script';
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = () => {
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (resp: any) => {
            if (resp.access_token) {
              setAccessToken(resp.access_token);
              setAuthLoading(false);
            }
          },
        });
        setGisReady(true);
      };
      document.body.appendChild(s);
    } else if (window.google) {
      setGisReady(true);
    }
  }, []);

  // Obter token OAuth2
  const ensureToken = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (accessToken) { resolve(accessToken); return; }
      if (!gisReady || !window.tokenClient) { reject('GIS não carregado'); return; }
      setAuthLoading(true);
      window.tokenClient.callback = (resp: any) => {
        if (resp.access_token) {
          setAccessToken(resp.access_token);
          setAuthLoading(false);
          resolve(resp.access_token);
        } else {
          setAuthLoading(false);
          reject('Falha na autenticação');
        }
      };
      window.tokenClient.requestAccessToken({ prompt: '' });
    });
  }, [accessToken, gisReady]);

  // Abrir Google Picker (modal nativo do Drive)
  const openPicker = useCallback(async () => {
    if (!gapiReady) return;
    try {
      const token = await ensureToken();
      const picker = new window.gapi.picker.PickerBuilder()
        .addView(
          new window.gapi.picker.DocsView()
            .setParent(DRIVE_FOLDER_ID)
            .setIncludeFolders(true)
        )
        .addView(new window.gapi.picker.DocsUploadView().setParent(DRIVE_FOLDER_ID))
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setCallback((data: any) => {
          if (data.action === window.gapi.picker.Action.PICKED) {
            // Recarrega iframe após seleção
            setIframeKey(k => k + 1);
            setIframeLoading(true);
          }
        })
        .build();
      picker.setVisible(true);
    } catch {
      // Se token falhou, abre no Drive como fallback
      window.open(DRIVE_OPEN_URL, '_blank', 'noopener,noreferrer');
    }
  }, [gapiReady, ensureToken]);

  // Upload de arquivo via Drive API
  const uploadToDrive = useCallback(async (file: File) => {
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setUploads(prev => [...prev, { id: uid, name: file.name, size: file.size, type: file.type, status: 'uploading' }]);

    try {
      const token = await ensureToken();

      const metadata = {
        name: file.name,
        parents: [DRIVE_FOLDER_ID],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setUploads(prev => prev.map(u => u.id === uid ? { ...u, status: 'done', driveId: data.id } : u));
      setIframeKey(k => k + 1);
      setIframeLoading(true);
    } catch {
      setUploads(prev => prev.map(u => u.id === uid ? { ...u, status: 'error' } : u));
    }
  }, [ensureToken]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadToDrive);
  }, [uploadToDrive]);

  const removeUpload = (id: string) => setUploads(prev => prev.filter(u => u.id !== id));

  const ready = gapiReady && gisReady;

  return (
    <AppShell>
      <div
        className="flex flex-col h-full min-h-screen bg-background relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-primary" />
              <p className="text-base font-bold text-primary">Solte para enviar ao Drive</p>
              <p className="text-xs text-muted-foreground">O arquivo sera salvo diretamente na pasta disciplinar</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Documentos</h1>
              <p className="text-xs text-muted-foreground">
                Repositorio disciplinar — Google Drive
                {!ready && <span className="ml-2 text-amber-500">Carregando integracao...</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIframeKey(k => k + 1); setIframeLoading(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-medium transition-colors"
              title="Recarregar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recarregar
            </button>

            {/* Enviar arquivo — abre Google Picker */}
            <button
              onClick={openPicker}
              disabled={authLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              {authLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Upload className="w-3.5 h-3.5" />
              }
              {authLoading ? 'Autenticando...' : 'Enviar arquivo'}
            </button>

            <a
              href={DRIVE_OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir no Drive
            </a>
          </div>
        </div>

        {/* Dica drag-and-drop */}
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center gap-2">
          <Upload className="w-3 h-3 shrink-0" />
          <span>Arraste arquivos para qualquer area desta pagina para enviar diretamente ao Drive. Clique em <strong>Enviar arquivo</strong> para abrir o seletor do Google Drive.</span>
        </div>

        {/* Fila de uploads */}
        {uploads.length > 0 && (
          <div className="px-6 py-3 border-b border-border bg-card space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Envios recentes</p>
            {uploads.map(u => (
              <div key={u.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                {fileIcon(u.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(u.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.status === 'uploading' && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                    </span>
                  )}
                  {u.status === 'done' && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle className="w-3 h-3" /> Enviado
                    </span>
                  )}
                  {u.status === 'error' && (
                    <span className="text-[10px] text-red-600 font-medium">Erro no envio</span>
                  )}
                  {u.status !== 'uploading' && (
                    <button onClick={() => removeUpload(u.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Iframe do Google Drive */}
        <div className="relative flex-1">
          {iframeLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Carregando pasta do Drive...</p>
              </div>
            </div>
          )}
          <iframe
            key={iframeKey}
            src={DRIVE_EMBED_URL}
            title="Pasta de Documentos — Google Drive"
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 160px)' }}
            onLoad={() => setIframeLoading(false)}
            allow="autoplay"
          />
        </div>
      </div>
    </AppShell>
  );
}
