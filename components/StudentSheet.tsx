'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Camera, BookOpen, Phone, Paperclip, FileText, AlertCircle, CheckCircle2, Clock, MapPin, Archive, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '@/lib/store';
import { useTenantConfig } from '@/lib/useTenantConfig';
import { ClassSelector } from '@/components/ClassSelector';

type Tab = 'atividades' | 'dados' | 'responsaveis' | 'documentos';

interface Props {
  studentId: string;
  onClose: () => void;
  /** Modo somente leitura: oculta botoes de salvar/arquivar */
  readOnly?: boolean;
  /** 'modal' = centrado com overlay (padrao) | 'panel' = drawer lateral direito */
  mode?: 'modal' | 'panel';
}

function formatPhoneForWhatsApp(phone: string, studentName: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const num = digits.startsWith('55') ? digits : '55' + digits;
  const msg = encodeURIComponent(`Olá! Sou da escola e gostaria de falar sobre o(a) aluno(a) ${studentName}.`);
  return `https://wa.me/${num}?text=${msg}`;
}

export default function StudentSheet({ studentId, onClose, readOnly = false, mode = 'modal' }: Props) {
  const {
    students, updateStudent, archiveStudent,
    getStudentPoints, getStudentBehavior, getStudentOccurrences, uploadFile,
  } = useAppContext();

  const { grades, classLetters } = useTenantConfig();
  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const [activeTab, setActiveTab] = useState<Tab>('atividades');

  // Campos editáveis
  const [name, setName] = useState(student.name);
  const [className, setClassName] = useState(student.class);
  const [shift, setShift] = useState(student.shift);
  const [contacts, setContacts] = useState(
    student.contacts && student.contacts.length > 0
      ? student.contacts.map(c => ({ ...c }))
      : [{ name: '', phone: '' }]
  );
  const [observation, setObservation] = useState(student.observation || '');
  const [address, setAddress] = useState(student.address || '');
  const [cpf, setCpf] = useState(student.cpf || '');
  const [registrationNumber, setRegistrationNumber] = useState(student.registrationNumber || '');
  const [birthDate, setBirthDate] = useState(student.birthDate || '');
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [archiveText, setArchiveText] = useState('');
  const [ignoredWarning, setIgnoredWarning] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para disparar a animacao de entrada
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const pts = getStudentPoints(studentId);
  const beh = getStudentBehavior(pts);
  const studentOccs = getStudentOccurrences(studentId);
  const allDocs = studentOccs.flatMap(o => [
    ...(o.videoUrls || []).map(url => ({ url, type: 'video' as const, date: o.date, label: `Vídeo — Oc. ${o.id}` })),
    ...(o.signedDocUrls || []).map(url => ({ url, type: 'doc' as const, date: o.date, label: `Documento — Oc. ${o.id}` })),
  ]);

  const sevColor = (code: number) => {
    if (code >= 300) return {
      bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-500/30', badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300', label: 'Grave',
    };
    if (code >= 200) return {
      bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-500/30', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300', label: 'Media',
    };
    return {
      bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-500/30', badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300', label: 'Leve',
    };
  };

  const handleAddContact = () => setContacts([...contacts, { name: '', phone: '' }]);
  const handleRemoveContact = (i: number) => {
    const c = [...contacts]; c.splice(i, 1);
    setContacts(c.length > 0 ? c : [{ name: '', phone: '' }]);
  };
  const updateContact = (i: number, field: 'name' | 'phone', value: string) => {
    const c = contacts.map((ct, idx) => idx === i ? { ...ct, [field]: value } : ct);
    setContacts(c);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const validContacts = contacts.filter(c => c.name.trim() || c.phone.trim());
    updateStudent(studentId, {
      name, class: className, shift, observation: observation || undefined,
      address: address || undefined, cpf: cpf || undefined,
      registrationNumber: registrationNumber || undefined,
      birthDate: birthDate || undefined,
      contacts: validContacts.length > 0 ? validContacts : undefined,
      photoUrl: photoUrl || undefined,
    });
    onClose();
  };

  const handleArchive = () => {
    if (archiveText.toLowerCase() === 'arquivar') {
      archiveStudent(studentId);
      onClose();
    }
  };

  const tabs = [
    { id: 'atividades' as Tab, label: 'Atividades', Icon: BookOpen, count: studentOccs.length },
    { id: 'dados' as Tab, label: 'Dados', Icon: User, count: null },
    { id: 'responsaveis' as Tab, label: 'Responsaveis', Icon: Phone, count: contacts.filter(c => c.phone).length },
    { id: 'documentos' as Tab, label: 'Documentos', Icon: Paperclip, count: allDocs.length },
  ];

  // Conteudo interno compartilhado entre modal e panel — montado abaixo
  const inner = (<>

          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <label className={`group relative shrink-0 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                <div className="w-14 h-14 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                  {photoUrl
                    ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                    : <User className="w-6 h-6 text-slate-400" />
                  }
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/60 flex items-center justify-center rounded-full">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!readOnly && (
                    <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center rounded-full">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setIsUploadingPhoto(true);
                    const url = await uploadFile(file, studentId);
                    if (url) setPhotoUrl(url);
                    setIsUploadingPhoto(false);
                    e.target.value = '';
                  }} />
                )}
              </label>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Ficha do Aluno</p>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{name}</h2>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{className} · {shift}</span>
                  {registrationNumber && <span className="text-xs text-slate-400 dark:text-slate-500">Mat. {registrationNumber}</span>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pts >= 7 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : pts >= 5 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'}`}>
                    {pts.toFixed(1)} pts · {beh}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Abas */}
          <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <tab.Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas */}
          <div className="flex-1 overflow-y-auto">

            {/* Atividades */}
            {activeTab === 'atividades' && (
              <div className="p-6">
                {studentOccs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                    <CheckCircle2 className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Nenhuma ocorrencia registrada</p>
                    <p className="text-xs mt-1">Este aluno nao possui historico disciplinar</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                    <div className="space-y-4">
                      {studentOccs.map(occ => {
                        const sc = sevColor(occ.ruleCode);
                        return (
                          <div key={occ.id} className="relative flex gap-4">
                            <div className={`relative z-10 w-9 h-9 shrink-0 rounded-full border-2 ${sc.border} ${sc.bg} flex items-center justify-center`}>
                              <AlertCircle className={`w-4 h-4 ${sc.text}`} />
                            </div>
                            <div className={`flex-1 rounded-xl border p-4 ${sc.bg} ${sc.border} mb-1`}>
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.badge}`}>{sc.label}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Art. {occ.ruleCode}</span>
                                    {occ.resolved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">Cumprida</span>}
                                  </div>
                                  <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{occ.observations || 'Sem descricao'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(occ.date).toLocaleDateString('pt-BR')}
                                  </p>
                                  {occ.hour && <p className="text-[10px] text-slate-400 mt-0.5">{occ.hour}</p>}
                                </div>
                              </div>
                              {occ.location && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{occ.location}</p>
                              )}
                              {(occ.measures || (occ.measure ? [occ.measure] : [])).filter(Boolean).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(occ.measures || (occ.measure ? [occ.measure] : [])).map((m, mi) => (
                                    <span key={mi} className="text-[10px] bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">{m}</span>
                                  ))}
                                </div>
                              )}
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Registrado por: {occ.registeredBy}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dados */}
            {activeTab === 'dados' && (
              <form onSubmit={handleSave} id="sheet-form-dados" className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome Completo *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} readOnly={readOnly}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Turma *</label>
                    <ClassSelector required disabled={readOnly} value={className} onChange={setClassName} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Turno *</label>
                    <select required disabled={readOnly} value={shift} onChange={e => setShift(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60">
                      <option>Matutino</option><option>Vespertino</option><option>Noturno</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Matricula</label>
                    <input type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} readOnly={readOnly} placeholder="Ex: 12345"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nascimento</label>
                    <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} readOnly={readOnly}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Endereco</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} readOnly={readOnly} placeholder="Rua, Numero, Bairro"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CPF</label>
                  <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} readOnly={readOnly} placeholder="000.000.000-00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Observacoes</label>
                  <textarea value={observation} onChange={e => setObservation(e.target.value)} readOnly={readOnly} placeholder="Laudos, condicoes de saude, etc..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[72px] text-sm disabled:opacity-60" />
                </div>
              </form>
            )}

            {/* Responsáveis */}
            {activeTab === 'responsaveis' && (
              <form onSubmit={handleSave} id="sheet-form-responsaveis" className="p-6 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Telefones e nomes dos responsaveis pelo aluno.</p>
                {contacts.map((contact, i) => {
                  const waLink = formatPhoneForWhatsApp(contact.phone, name);
                  return (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Responsavel {i + 1}</span>
                        {!readOnly && i > 0 && (
                          <button type="button" onClick={() => handleRemoveContact(i)} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1">
                            <X className="w-3 h-3" /> Remover
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome</label>
                          <input type="text" value={contact.name} onChange={e => updateContact(i, 'name', e.target.value)} readOnly={readOnly} placeholder="Nome"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Telefone</label>
                          <div className="flex gap-2">
                            <input type="tel" value={contact.phone} onChange={e => updateContact(i, 'phone', e.target.value)} readOnly={readOnly} placeholder="(65) 99999-9999"
                              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            {waLink && (
                              <a href={waLink} target="_blank" rel="noopener noreferrer"
                                className="shrink-0 p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg transition" title="WhatsApp">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!readOnly && (
                  <button type="button" onClick={handleAddContact}
                    className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-400 hover:text-blue-500 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Adicionar responsavel
                  </button>
                )}
              </form>
            )}

            {/* Documentos */}
            {activeTab === 'documentos' && (() => {
              const docsOwed = studentOccs.length;
              const docsAttached = allDocs.length;
              const docsMissing = Math.max(0, docsOwed - docsAttached);
              const occsWithDocs = studentOccs.filter(o => (o.videoUrls?.length || 0) + (o.signedDocUrls?.length || 0) > 0);

              return (
                <div className="p-6 space-y-5">
                  {/* Mini-dash */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Docs Devidos</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-0.5">{docsOwed}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">1 por ocorrencia</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Anexados</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-0.5">
                          {docsAttached}
                          <span className="text-sm font-medium text-slate-400 ml-1">/{docsOwed}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{occsWithDocs.length} ocorr. com doc</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${docsMissing > 0 ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5' : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${docsMissing > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                        {docsMissing > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Faltando</p>
                        <p className={`text-2xl font-black leading-none mt-0.5 ${docsMissing > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{docsMissing}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{docsMissing === 0 ? 'Tudo em dia' : 'pendente(s)'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de documentos por ocorrência */}
                  {studentOccs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
                      <FileText className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">Nenhuma ocorrencia registrada</p>
                      <p className="text-xs mt-1">Documentos sao vinculados a ocorrencias</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentOccs.map(occ => {
                        const occDocs = [
                          ...(occ.videoUrls || []).map(url => ({ url, type: 'video' as const })),
                          ...(occ.signedDocUrls || []).map(url => ({ url, type: 'doc' as const })),
                        ];
                        const hasDocs = occDocs.length > 0;
                        return (
                          <div key={occ.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                            {/* Cabecalho da ocorrencia */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {new Date(occ.date).toLocaleDateString('pt-BR')} — Art. {occ.ruleCode}
                                </span>
                                {occ.observations && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{occ.observations}</span>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasDocs ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {hasDocs ? `${occDocs.length} doc` : 'sem doc'}
                              </span>
                            </div>
                            {/* Documentos da ocorrencia */}
                            {hasDocs ? (
                              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {occDocs.map((doc, di) => (
                                  <a key={di} href={doc.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${doc.type === 'video' ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                      {doc.type === 'video' ? <FileText className="w-3.5 h-3.5" /> : <Paperclip className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-300 flex-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                      {doc.type === 'video' ? 'Video' : 'Documento'} {di + 1}
                                    </span>
                                    <span className="text-xs text-blue-500 dark:text-blue-400 font-medium shrink-0">Abrir</span>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 italic">
                                Nenhum documento anexado a esta ocorrencia
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {!readOnly ? (
              <button type="button" onClick={() => setIsArchiveConfirmOpen(true)}
                className="px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 transition font-medium text-sm flex items-center gap-2">
                <Archive className="w-4 h-4" /> Arquivar
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={handleClose}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium text-sm">
                Fechar
              </button>
              {!readOnly && (activeTab === 'dados' || activeTab === 'responsaveis') && (
                <button type="submit" form={activeTab === 'dados' ? 'sheet-form-dados' : 'sheet-form-responsaveis'}
                  disabled={!name || !className}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium text-sm disabled:opacity-50">
                  Salvar Alteracoes
                </button>
              )}
            </div>
          </div>

          {/* Confirmação de arquivamento inline */}
          {isArchiveConfirmOpen && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 flex items-center justify-center p-6">
              <div className="w-full max-w-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Arquivar aluno?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Digite <strong>arquivar</strong> para confirmar.</p>
                <input type="text" value={archiveText} onChange={e => setArchiveText(e.target.value)} placeholder="arquivar"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 text-sm" />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setIsArchiveConfirmOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm">
                    Cancelar
                  </button>
                  <button onClick={handleArchive} disabled={archiveText.toLowerCase() !== 'arquivar'}
                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition text-sm font-medium disabled:opacity-50">
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
  );

  // ── Wrappers por modo ──
  if (mode === 'panel') {
    return (
      <>
        <div
          className={`fixed inset-0 z-[9980] transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={handleClose}
        />
        <div
          className={`fixed top-0 right-0 bottom-0 z-[9990] w-full max-w-[440px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700 transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {inner}
        </div>
      </>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990] flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`bg-white dark:bg-slate-900 w-full max-w-4xl flex flex-col max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden transition-all duration-250 relative ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {inner}
      </div>
    </div>
  );
}
