'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  FolderPlus, 
  ChevronRight, 
  Folder, 
  File as FileIcon, 
  MoreVertical, 
  Pencil, 
  Move, 
  Trash2, 
  Loader2, 
  ArrowRight,
  FolderOpen,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { DriveFile } from './DriveModal';

const ROOT_FOLDER = '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA';

type BreadcrumbItem = { id: string; name: string };

interface DrivePanelProps {
  initialFolderId?: string;
  onSelect?: (file: DriveFile) => void;
  title?: string;
  schoolId?: string;
}

export function DrivePanel({ initialFolderId = ROOT_FOLDER, onSelect, title, schoolId }: DrivePanelProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: initialFolderId, name: 'Meu Drive' }
  ]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuFile, setMenuFile] = useState<DriveFile | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [moving, setMoving] = useState<DriveFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    fileName: string;
    loaded: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [errorAlert, setErrorAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const currentFolder = breadcrumbs[breadcrumbs.length - 1];

  const loadFiles = useCallback(async (folderId: string) => {
    setLoading(true);
    setErrorAlert(null);
    try {
      const params = new URLSearchParams({ folderId });
      if (schoolId) params.set('schoolId', schoolId);
      const res = await fetch(`/api/drive/files?${params}`);
      if (!res.ok) throw new Error('Falha ao obter lista de arquivos do servidor');
      const data = await res.json();
      setFiles(data);
    } catch (error: any) {
      console.error(error);
      setErrorAlert({
        title: 'Erro de Sincronização',
        message: error.message || 'Não foi possível carregar os arquivos do Google Drive.'
      });
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadFiles(currentFolder.id);
  }, [currentFolder.id, loadFiles]);

  const navigateTo = (folder: DriveFile) => {
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (idx: number) => {
    setBreadcrumbs(prev => prev.slice(0, idx + 1));
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    setErrorAlert(null);
    try {
      for (const file of Array.from(fileList)) {
        // 1. Obter URI de upload resumível do servidor
        const sessionRes = await fetch('/api/drive/upload-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId: currentFolder.id,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            schoolId,
          })
        });

        if (!sessionRes.ok) {
          const errData = await sessionRes.json().catch(() => ({}));
          throw new Error(errData.error || `Falha ao iniciar sessão de upload (${sessionRes.status})`);
        }

        const { uploadUri } = await sessionRes.json();

        const proxyUri = uploadUri;

        // 2. Upload para o Google Drive via proxy local
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', proxyUri, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              setUploadProgress({
                fileName: file.name,
                loaded: event.loaded,
                total: event.total,
                percentage,
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Erro HTTP ${xhr.status}: ${xhr.statusText || 'Erro interno no upload direto'}`));
            }
          };

          xhr.onerror = () => reject(new Error('Erro de conexão com o servidor do Google'));
          xhr.send(file);
        });
      }
      toast.success('Upload concluído!');
      loadFiles(currentFolder.id);
    } catch (error: any) {
      console.error(error);
      setErrorAlert({
        title: 'Falha no Upload',
        message: error.message || 'Ocorreu um erro ao subir um ou mais arquivos. Verifique a credencial do Google Drive.'
      });
      toast.error(error.message || 'Erro no upload');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleRename = async () => {
    if (!renaming) return;
    if (!renaming.name.trim()) {
      toast.error('Nome não pode ser vazio');
      return;
    }
    const toastId = toast.loading('Renomeando item...');
    setErrorAlert(null);
    try {
      const res = await fetch('/api/drive/rename', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: renaming.id, newName: renaming.name, schoolId }),
      });
      if (!res.ok) throw new Error('Não foi possível renomear o item no Google Drive');
      toast.success('Renomeado com sucesso!', { id: toastId });
      setRenaming(null);
      loadFiles(currentFolder.id);
    } catch (error: any) {
      console.error(error);
      setErrorAlert({
        title: 'Falha ao Renomear',
        message: error.message || 'Não foi possível alterar o nome do arquivo.'
      });
      toast.error('Erro ao renomear arquivo', { id: toastId });
    }
  };

  const handleDelete = async (file: DriveFile) => {
    if (!confirm(`Deletar permanentemente "${file.name}"?`)) return;
    const toastId = toast.loading('Deletando item...');
    setErrorAlert(null);
    try {
      const res = await fetch('/api/drive/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, schoolId }),
      });
      if (!res.ok) throw new Error('Falha ao excluir o item no Google Drive');
      toast.success('Item deletado com sucesso!', { id: toastId });
      loadFiles(currentFolder.id);
    } catch (error: any) {
      console.error(error);
      setErrorAlert({
        title: 'Falha ao Excluir',
        message: error.message || 'Ocorreu um erro ao tentar apagar o arquivo do Google Drive.'
      });
      toast.error('Erro ao deletar arquivo', { id: toastId });
    }
  };

  const handleMove = async (targetFolderId: string) => {
    if (!moving) return;
    const toastId = toast.loading('Movendo item...');
    setErrorAlert(null);
    try {
      const res = await fetch('/api/drive/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: moving.id,
          newParentId: targetFolderId,
          oldParentId: currentFolder.id,
          schoolId,
        }),
      });
      if (!res.ok) throw new Error('Falha ao mover o item no Google Drive');
      toast.success('Item movido com sucesso!', { id: toastId });
      setMoving(null);
      loadFiles(currentFolder.id);
    } catch (error: any) {
      console.error(error);
      setErrorAlert({
        title: 'Falha ao Mover',
        message: error.message || 'Ocorreu um erro ao tentar mover o arquivo.'
      });
      toast.error('Erro ao mover arquivo', { id: toastId });
    }
  };

  const handleNewFolder = async () => {
    const name = prompt('Nome da nova pasta:');
    if (!name) return;
    const toastId = toast.loading('Criando pasta...');
    setErrorAlert(null);
    try {
      const res = await fetch('/api/drive/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: currentFolder.id, name, schoolId }),
      });
      if (!res.ok) throw new Error('Falha ao criar pasta no Google Drive');
      toast.success('Pasta criada com sucesso!', { id: toastId });
      loadFiles(currentFolder.id);
    } catch (error: any) {
      console.error(error);
      setErrorAlert({
        title: 'Falha ao Criar Pasta',
        message: error.message || 'Não foi possível criar a pasta no Google Drive.'
      });
      toast.error('Erro ao criar pasta', { id: toastId });
    }
  };

  const isFolder = (f: DriveFile) => f.mimeType === 'application/vnd.google-apps.folder';

  return (
    <div className="w-full flex flex-col flex-1 bg-white dark:bg-slate-950 rounded-2xl overflow-hidden min-h-[500px]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 gap-4">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap font-semibold">
          {title && (
            <span className="text-slate-800 dark:text-slate-100 font-extrabold mr-2 uppercase tracking-wider text-xs">
              {title}
            </span>
          )}
          {breadcrumbs.map((b, i) => (
            <span key={b.id} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-slate-300 dark:text-slate-700" />}
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                  i === breadcrumbs.length - 1 
                    ? 'font-bold text-slate-800 dark:text-slate-200' 
                    : ''
                }`}
              >
                {b.name}
              </button>
            </span>
          ))}
        </div>
        
        {/* Actions buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <button
            onClick={() => loadFiles(currentFolder.id)}
            disabled={loading}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-105 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200/40 dark:border-slate-800/40 shadow-sm cursor-pointer"
            title="Atualizar pasta"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>

          <button 
            onClick={handleNewFolder} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200/40 dark:border-slate-800/40"
          >
            <FolderPlus size={13} /> Nova pasta
          </button>
          
          <label className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer">
            {uploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Upload size={13} />
            )}
            <span>Upload</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={e => handleUpload(e.target.files)} 
            />
          </label>

          <a
            href={`https://drive.google.com/drive/folders/${currentFolder.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-500 hover:underline border border-slate-250/20 px-3 py-1.5 rounded-xl transition-all"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Grid view / Drop zone */}
      <div
        className={`flex-1 overflow-y-auto p-6 transition-colors min-h-[380px] relative ${
          dragging 
            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-500 border-dashed m-3 rounded-xl' 
            : ''
        }`}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          handleUpload(e.dataTransfer.files);
        }}
      >
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 dark:bg-slate-950/80 z-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-xs font-semibold text-slate-400">Obtendo itens do Google Drive...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-650 gap-4 p-8">
            <div className="p-4 bg-indigo-50/50 dark:bg-slate-900 rounded-2xl text-indigo-500 dark:text-indigo-400 animate-pulse">
              <FolderOpen size={36} />
            </div>
            <div className="text-center max-w-[280px]">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum documento nesta pasta</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Arraste seus arquivos regulamentares aqui para iniciar o upload</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {files.map(file => {
              const isFolderItem = isFolder(file);
              return (
                <div
                  key={file.id}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100/60 dark:border-slate-900/60 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-md dark:hover:bg-slate-900/60 transition-all cursor-pointer select-none text-center"
                  onDoubleClick={() => isFolderItem ? navigateTo(file) : onSelect?.(file)}
                  onClick={() => {
                    if (!isFolderItem && onSelect) {
                      onSelect(file);
                    }
                  }}
                >
                  {/* Icon */}
                  <div className="mb-2.5 p-2 rounded-xl transition-transform group-hover:scale-105">
                    {isFolderItem ? (
                      <Folder 
                        size={40} 
                        className="text-amber-400 fill-amber-100 dark:fill-amber-950/40" 
                      />
                    ) : (
                      <FileIcon 
                        size={40} 
                        className="text-indigo-400 dark:text-indigo-500" 
                      />
                    )}
                  </div>
                  
                  {/* File/Folder Name Input */}
                  {renaming?.id === file.id ? (
                    <input
                      autoFocus
                      className="text-xs text-center border border-indigo-300 dark:border-indigo-800 outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1.5 py-0.5 w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      value={renaming.name}
                      onChange={e => setRenaming({ ...renaming, name: e.target.value })}
                      onBlur={handleRename}
                      onKeyDown={e => e.key === 'Enter' && handleRename()}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate w-full px-1">
                      {file.name}
                    </span>
                  )}

                  {/* Size info */}
                  {!isFolderItem && file.size && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                      {(parseInt(file.size) / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}

                  {/* Menu Button */}
                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 transition-all"
                    onClick={e => {
                      e.stopPropagation();
                      setMenuFile(menuFile?.id === file.id ? null : file);
                    }}
                  >
                    <MoreVertical size={13} />
                  </button>

                  {/* Menu Context dropdown */}
                  <AnimatePresence>
                    {menuFile?.id === file.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={e => {
                            e.stopPropagation();
                            setMenuFile(null);
                          }}
                        />
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.1 }}
                          className="absolute top-9 right-2 z-50 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-xl rounded-xl py-1.5 w-36 text-left overflow-hidden"
                          onClick={e => e.stopPropagation()}
                        >
                          <button 
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 w-full font-bold transition-colors"
                            onClick={() => {
                              setRenaming({ id: file.id, name: file.name });
                              setMenuFile(null);
                            }}
                          >
                            <Pencil size={12} className="text-slate-400" /> 
                            <span>Renomear</span>
                          </button>
                          <button 
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 w-full font-bold transition-colors"
                            onClick={() => {
                              setMoving(file);
                              setMenuFile(null);
                            }}
                          >
                            <Move size={12} className="text-slate-400" /> 
                            <span>Mover</span>
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-900 my-1" />
                          <button 
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full font-bold transition-colors"
                            onClick={() => {
                              handleDelete(file);
                              setMenuFile(null);
                            }}
                          >
                            <Trash2 size={12} className="text-red-500" /> 
                            <span>Excluir</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Move Panel */}
      <AnimatePresence>
        {moving && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t border-slate-100 dark:border-slate-900 bg-amber-50/40 dark:bg-amber-950/10 px-6 py-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Move size={14} />
              <p className="text-[11px] font-bold">
                Mover <span className="text-amber-950 dark:text-amber-100">"{moving.name}"</span> para subpasta de destino:
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {files.filter(isFolder).length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">Nenhuma subpasta neste diretório.</p>
              ) : (
                files.filter(isFolder).map(f => (
                  <button 
                    key={f.id} 
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-amber-100/60 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-800 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                    onClick={() => handleMove(f.id)}
                  >
                    <Folder size={11} className="text-amber-500" /> 
                    <span>{f.name}</span>
                  </button>
                ))
              )}
              
              {breadcrumbs.length > 1 && (
                <button 
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all font-bold text-indigo-700 dark:text-indigo-300 shadow-sm"
                  onClick={() => {
                    const parentFolder = breadcrumbs[breadcrumbs.length - 2];
                    handleMove(parentFolder.id);
                  }}
                >
                  <ArrowRight size={11} className="rotate-180" /> 
                  <span>Subir para ({breadcrumbs[breadcrumbs.length - 2].name})</span>
                </button>
              )}

              <button 
                className="text-[11px] px-2.5 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline font-bold transition-colors cursor-pointer" 
                onClick={() => setMoving(null)}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress indicator - bottom left */}
      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-6 left-6 z-50 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 shadow-2xl border border-slate-850 dark:border-slate-800 flex flex-col gap-3 min-w-[280px] max-w-[320px] select-none"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-hidden">
                <Loader2 className="animate-spin text-indigo-400 shrink-0 animate-duration-1000" size={14} />
                <span className="text-[11px] font-bold truncate max-w-[180px]">
                  {uploadProgress.fileName}
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-indigo-400">
                {uploadProgress.percentage}%
              </span>
            </div>

            {/* Progress bar container */}
            <div className="w-full bg-slate-800 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-150"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            {/* Megabytes detail */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold">
              <span>
                {(uploadProgress.loaded / (1024 * 1024)).toFixed(2)} MB de {(uploadProgress.total / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span>
                Faltam: {((uploadProgress.total - uploadProgress.loaded) / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error alert indicator - bottom left */}
      <AnimatePresence>
        {errorAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-6 left-6 z-50 bg-red-950/95 text-white rounded-2xl p-4 shadow-2xl border border-red-800/80 flex flex-col gap-3 min-w-[300px] max-w-[350px] select-none backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="text-red-400 shrink-0" size={18} />
                <span className="text-xs font-bold text-red-200 uppercase tracking-wider">
                  {errorAlert.title}
                </span>
              </div>
              <button 
                onClick={() => setErrorAlert(null)}
                className="text-red-400 hover:text-red-200 transition-colors p-0.5 rounded-lg hover:bg-red-900/30"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[11px] text-red-200 leading-relaxed font-medium">
              {errorAlert.message}
            </p>
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => setErrorAlert(null)}
                className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg text-[10px] font-bold transition-all border border-red-800/40 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
