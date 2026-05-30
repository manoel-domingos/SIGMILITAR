'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { Search, Plus, X, Edit2, Archive, Video, FileText, Camera, Clock, MapPin, UserPlus, Trash2, MessageSquare, Phone, Printer, Sparkles, AlertTriangle, ChevronDown, Paperclip, User, Users, Check } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { Occurrence, StaffMember, Student, AVAILABLE_MEASURES } from '@/lib/data';
import { getSchoolHeaderHTML, getSchoolFooterHTML, SCHOOL_HEADER_CSS, markdownBoldToHtml } from '@/lib/print-header';
import AtaEditor from '@/components/AtaEditor';
import { getLocalDateString, getLocalTimeString, formatDate, formatPhoneForWhatsApp } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useParams } from 'next/navigation';
import { streamAI } from '@/components/AIChat';
import { useTenantConfig, getDbSchoolId } from '@/lib/useTenantConfig';
import { ClassSelector } from '@/components/ClassSelector';
import OccurrenceChecklist, {
  OccurrenceTask,
  ChecklistItem,
  addOccurrenceTask,
  loadChecklists,
  autocompleteWhatsapp,
} from '@/components/OccurrenceChecklist';

function RegistroDisciplinarContent() {
  const { 
    students, occurrences, rules, staffMembers, appUsers, user, isGuest, currentUserRole,
    addOccurrence, updateOccurrence, archiveOccurrence, checkRecidivism, getEscalationStatus,
    addStudent, updateStudent, addStaffMember, uploadFile, activeSchoolContext,
    contextSchools
  } = useAppContext();
  const currentSchool = contextSchools.find(s => s.id === activeSchoolContext);
  const schoolName = currentSchool?.name || 'EECM';
  const { grades, classLetters } = useTenantConfig();

  const params = useParams();
  const schoolSlug = params?.escola as string;
  const resolvedSchoolId = getDbSchoolId(schoolSlug);

  // Filtra e de-duplica membros da equipe por school_id
  const staffOptions = React.useMemo(() => {
    const unique = new Map<string, { value: string; label: string }>();
    staffMembers
      .filter(s => !s.school_id || s.school_id === resolvedSchoolId)
      .forEach(s => {
        const key = s.role + ' ' + s.name;
        unique.set(key, { value: key, label: key });
      });
    return Array.from(unique.values());
  }, [staffMembers, resolvedSchoolId]);

  // Filtra e de-duplica professores por school_id
  const professorOptions = React.useMemo(() => {
    const unique = new Map<string, { value: string; label: string }>();
    appUsers
      .filter(u => u.role === 'PROFESSOR' && (!u.school_id || u.school_id === resolvedSchoolId))
      .forEach(u => {
        const name = 'Professor ' + u.name;
        unique.set(name, { value: name, label: name });
      });
    return Array.from(unique.values());
  }, [appUsers, resolvedSchoolId]);

  // Lista ordenada cronologicamente (do mais antigo para o mais novo) para garantir a numeração estável das ATAs/ocorrências
  const occurrencesChronological = React.useMemo(() => {
    return [...occurrences].sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.hour || '').localeCompare(b.hour || '');
    });
  }, [occurrences]);
  const searchParams = useSearchParams();

  const paramMonth = searchParams.get('month');
  const paramClass = searchParams.get('class');
  const paramSeverity = searchParams.get('severity');

  const [searchTerm, setSearchTerm] = useState('');

  // Remove acentos para busca insensível a acentuação
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };
  const [selectedMonth, setSelectedMonth] = useState(paramMonth && paramMonth !== 'Selecionar...' ? paramMonth : 'Todos os meses');
  const [selectedClass, setSelectedClass] = useState(paramClass && paramClass !== 'Todas' ? paramClass : 'Todas as turmas');
  const [selectedSeverity, setSelectedSeverity] = useState(paramSeverity || 'Todas');

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const classes = Array.from(new Set(students.map(s => s.class))).sort();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [linkedProfessor, setLinkedProfessor] = useState('');
  const [isStaffModalOpenProf, setIsStaffModalOpenProf] = useState(false);
  const [isGuardianListOpen, setIsGuardianListOpen] = useState(false);
  const [isPrintPanelOpen, setIsPrintPanelOpen] = useState(false);
  const [isAddGuardianModalOpen, setIsAddGuardianModalOpen] = useState(false);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [guardianIgnoredWarning, setGuardianIgnoredWarning] = useState(false);
  const guardianPhoneRef = useRef<HTMLInputElement>(null);
  
  // States para o fluxo de resolução e impressão
  const [showPrintBanner, setShowPrintBanner] = useState(false);
  const [showResolucaoModal, setShowResolucaoModal] = useState(false);
  const [resolucaoText, setResolucaoText] = useState('');
  const [resolucaoSaving, setResolucaoSaving] = useState(false);
  
  const [viewOccurrence, setViewOccurrence] = useState<Occurrence | null>(null);
  const [voTab, setVoTab] = useState<'status' | 'detalhes' | 'documentos' | 'responsaveis'>('status');
  const [voUploadingDoc, setVoUploadingDoc] = useState(false);
  const [voUploadingEv, setVoUploadingEv] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<string | null>(null);

  // Modal form state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsGuardianListOpen(false);
  }, [selectedStudents]);

  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [location, setLocation] = useState('Pátio');
  const [locatedBy, setLocatedBy] = useState('');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [ruleSearch, setRuleSearch] = useState('');
  const [registeredBy, setRegisteredBy] = useState('');
  const [observations, setObservations] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [signedDocUrls, setSignedDocUrls] = useState<string[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [durationDays, setDurationDays] = useState(1);
  const [attenuatingFactors, setAttenuatingFactors] = useState<string[]>([]);
  const [aggravatingFactors, setAggravatingFactors] = useState<string[]>([]);
  const [graveMeasureType, setGraveMeasureType] = useState<'Parecer do gestor' | 'Suspensão Escolar' | 'Suspensão de Recreação' | 'Ação Educativa' | 'Transferência Educativa'>('Parecer do gestor');
  const [measureOverride, setMeasureOverride] = useState<string | null>(null);
  const [measurePanelOpen, setMeasurePanelOpen] = useState<Record<string, boolean>>({});
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);

  // Efeito de rotacao sutil ao rolar a tabela
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const tableRotationRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const tiltFrame = useRef<number | null>(null);
  const currentTilt = useRef(0);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    const inner = tableRotationRef.current;
    if (!wrapper || !inner) return;

    let decayTimer: ReturnType<typeof setInterval>;
    let fallbackTimeout: ReturnType<typeof setTimeout>;

    const applyTilt = (val: number) => {
      inner.style.transform = 'perspective(1200px) rotateX(' + val.toFixed(3) + 'deg)';
    };

    const startDecay = () => {
      clearInterval(decayTimer);
      decayTimer = setInterval(() => {
        currentTilt.current *= 0.78;
        if (Math.abs(currentTilt.current) < 0.05) {
          currentTilt.current = 0;
          clearInterval(decayTimer);
        }
        applyTilt(currentTilt.current);
      }, 16);
    };

    const onScroll = () => {
      if (tiltFrame.current) cancelAnimationFrame(tiltFrame.current);
      clearTimeout(fallbackTimeout);
      tiltFrame.current = requestAnimationFrame(() => {
        const scrollY = wrapper.scrollTop;
        const delta = scrollY - lastScrollY.current;
        lastScrollY.current = scrollY;
        const targetTilt = Math.max(-2.5, Math.min(2.5, delta * 0.25));
        currentTilt.current = currentTilt.current * 0.6 + targetTilt * 0.4;
        applyTilt(currentTilt.current);
        fallbackTimeout = setTimeout(startDecay, 80);
      });
    };

    wrapper.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      wrapper.removeEventListener('scroll', onScroll);
      clearInterval(decayTimer);
      clearTimeout(fallbackTimeout);
      if (tiltFrame.current) cancelAnimationFrame(tiltFrame.current);
    };
  }, []);
  const [isImproving, setIsImproving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Checklist flutuante de pendências pós-ocorrência
  const [checklistTasks, setChecklistTasks] = useState<OccurrenceTask[]>([]);
  const userId = user?.email ?? 'guest';

  // Auto-seleciona "Acionar os pais" para infrações Média/Grave
  useEffect(() => {
    if (selectedRules.length === 0) return;
    const primaryRule = rules.find(r => r.code === parseInt(selectedRules[0], 10));
    if (!primaryRule) return;
    if (primaryRule.severity === 'Media' || primaryRule.severity === 'Grave') {
      setSelectedMeasures(prev =>
        prev.includes('Acionar os pais') ? prev : [...prev, 'Acionar os pais']
      );
    }
  }, [selectedRules, rules]);

  // Carrega o checklist do localStorage ao montar (persistência cross-session)
  useEffect(() => {
    setChecklistTasks(loadChecklists(userId));
  }, [userId]);

  // Modal de alerta pós-salvar
  const [postSaveAlert, setPostSaveAlert] = useState<{
    occurrenceId: string;
    occurrenceNum: string;
    studentName: string;
    measure: string;
    isViolence: boolean;
    checklistItems: ChecklistItem[];
    ataNumber?: number;
  } | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const handleGenerateAta = () => {
    const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

    // Validate required fields
    if (!selectedStudents.length || !date || !hour || !location || !selectedRules.length) {
      alert('Preencha aluno(s), data, hora, local e infração antes de gerar a ata.');
      return;
    }

    if (observations.trim()) {
      const confirmOverwrite = confirm('Já existe texto no campo ATA. Deseja substituir pelo texto gerado?');
      if (!confirmOverwrite) return;
    }

    // Date parts
    const [year, month, day] = date.split('-');
    const mesExtenso = MESES[parseInt(month, 10) - 1];
    const diaNum = parseInt(day, 10);

    // Student names
    const studentNames = selectedStudents.map(id => students.find(s => s.id === id)?.name).filter(Boolean) as string[];
    const alunoStr = studentNames.length === 1
      ? 'o(a) aluno(a) ' + studentNames[0]
      : 'os alunos ' + studentNames.slice(0, -1).join(', ') + ' e ' + studentNames[studentNames.length - 1];
    const verboStr = studentNames.length === 1 ? 'foi encontrado(a)' : 'foram encontrados';

    // Rule info (use first selected rule)
    const rule = rules.find(r => r.code === parseInt(selectedRules[0], 10));
    const ruleCode = rule?.code ?? selectedRules[0];
    const ruleDesc = rule?.description ?? '';

    // Located by
    const locatedByStr = locatedBy.trim() ? ' pelo(a) ' + locatedBy.trim() : '';
    const professorStr = linkedProfessor.trim() ? ' / Professor(a) vinculado(a): ' + linkedProfessor.trim() : '';

    // Reincidencia (exclui a propria ocorrencia ao editar)
    const isReincidente = selectedStudents.some(id => {
      const ruleCodesNum = selectedRules.map(r => parseInt(r, 10));
      return ruleCodesNum.some(rc => checkRecidivism(id, rc, editingOccurrence ?? undefined));
    });

    // Agravantes / atenuantes
    const agravantesStr = aggravatingFactors.length
      ? ' Verificaram-se os seguintes fatores agravantes: ' + aggravatingFactors.join(', ') + '.'
      : '';
    const atenuantesStr = attenuatingFactors.length
      ? ' Foram considerados os seguintes fatores atenuantes: ' + attenuatingFactors.join(', ') + '.'
      : '';
    const reincidenteStr = isReincidente
      ? ' O(A) aluno(a) já possui registro anterior da mesma infração, caracterizando reincidência.'
      : '';

    const registradoPor = registeredBy.trim() || getLoggedUserName();

    // Monta o texto no modelo padrão institucional com campos em negrito (markdown)
    const alunoNomesStr = studentNames.join(', ');

    // Classificação da infração com natureza e artigo
    const naturezaMap: Record<string, string> = {
      Leve: 'Leve',
      Media: 'Média',
      Grave: 'Grave',
    };
    const naturezaStr = naturezaMap[rule?.severity ?? ''] ?? (rule?.severity ?? '');
    const classifStr = naturezaStr
      ? `Infração de Natureza ${naturezaStr}, conforme Art. ${ruleCode} (${ruleDesc}) do Regimento Interno.`
      : `Art. ${ruleCode} (${ruleDesc}) do Regimento Interno.`;

    const reincidenciaStr = isReincidente
      ? ` O(A) aluno(a) já possui registro anterior da mesma infração, caracterizando reincidência.`
      : '';
    const agravStr = aggravatingFactors.length
      ? ` Fatores agravantes identificados: ${aggravatingFactors.join(', ')}.`
      : '';
    const atenStr = attenuatingFactors.length
      ? ` Fatores atenuantes considerados: ${attenuatingFactors.join(', ')}.`
      : '';

    const ata = [
      `**Data:** ${diaNum} de ${mesExtenso} de ${year}`,
      `**Hora:** ${hour}`,
      `**Local:** ${location}`,
      ``,
      `**Aluno(s) envolvido(s):** ${alunoNomesStr}`,
      ``,
      `**Relato dos Fatos:**`,
      `No dia ${diaNum} de ${mesExtenso} de ${year}, às ${hour}, ${alunoStr} ${verboStr} no(a) ${location}${locatedByStr}${professorStr}${locatedBy.trim() || linkedProfessor.trim() ? '.' : '.'}${reincidenciaStr}${agravStr}${atenStr} O presente registro foi lavrado por ${registradoPor}.`,
      ``,
      `**Classificação da Infração:**`,
      classifStr,
    ].join('\n');

    setObservations(ata.trim());
  };

  const handleGetSuggestions = () => {
    if (!selectedRules.length || !selectedStudents.length) return;
    
    const student = students.find(s => s.id === selectedStudents[0]);
    const rule = rules.find(ru => ru.code === parseInt(selectedRules[0], 10));
    const escalation = getEscalationStatus(selectedStudents[0], parseInt(selectedRules[0], 10), editingOccurrence ?? undefined);

    const reincidenciaStr = escalation.isEscalated 
      ? `Sim (já possui infração anterior da mesma natureza: ${escalation.reason})` 
      : 'Não';

    const promptText = `Olá ARI! Preciso de uma **Sugestão do Regimento** para esta ocorrência na escola ${schoolName}:
- **Aluno**: ${student?.name || 'Não informado'} (Turma: ${student?.class || 'N/A'})
- **Infração**: Art. ${rule?.code} — ${rule?.description}
- **Natureza/Gravidade**: ${rule?.severity}
- **Reincidente nesta infração?**: ${reincidenciaStr}
- **Medida recomendada padrão**: ${escalation.measure}

Com base no Manual de Conduta e Regimento Interno das Escolas Cívico-Militares brasileiras, sugira de forma direta e em tópicos estruturados quais os procedimentos administrativos e medidas que o gestor deve adotar passo a passo (atenuantes, agravantes e encaminhamentos).`;

    const event = new CustomEvent('trigger-ari', {
      detail: { text: promptText }
    });
    window.dispatchEvent(event);
  };

  const handleImproveObservations = async () => {
    if (!observations.trim() && selectedRules.length === 0) return;

    setIsImproving(true);
    try {
      const studentNames = selectedStudents.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', ');
      const ruleDescriptions = selectedRules.map(code => rules.find(r => r.code === parseInt(code, 10))?.description).filter(Boolean).join('; ');

      const primaryStudentId = selectedStudents[0];
      const escalation = primaryStudentId
        ? getEscalationStatus(primaryStudentId, parseInt(selectedRules[0], 10), editingOccurrence ?? undefined)
        : null;
      const isReincidente = selectedStudents.some(id =>
        selectedRules.map(r => parseInt(r, 10)).some(rc => checkRecidivism(id, rc, editingOccurrence ?? undefined))
      );

      setObservations('');
      await streamAI(
        'ata',
        {
          students: studentNames || 'Não identificado',
          infractions: ruleDescriptions || 'Não especificada',
          dateTime: date + ' ' + hour,
          location,
          locatedBy: (locatedBy || 'não informado') + (linkedProfessor ? ' / Prof: ' + linkedProfessor : ''),
          measure: measureOverride ?? escalation?.measure ?? '',
          isReincidente,
          text: observations,
        },
        (delta) => setObservations(prev => prev + delta)
      );
    } catch (error) {
      console.error("Erro ao melhorar ATA:", error);
      alert("Não foi possível melhorar o texto com IA no momento.");
    } finally {
      setIsImproving(false);
    }
  };

  // Student Form State
  const [newName, setNewName] = useState('');
  const [newClassName, setNewClassName] = useState('6º Ano A');
  const [newShift, setNewShift] = useState<'Matutino' | 'Vespertino' | 'Noturno'>('Matutino');
  const [newContacts, setNewContacts] = useState<{name: string, phone: string}[]>([{ name: '', phone: '' }]);
  const [ignoredWarning, setIgnoredWarning] = useState(false);
  const phoneRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Monitor' | 'Professor' | 'Coord.' | 'Diretora' | 'G1' | 'G2'>('Monitor');

  const locations = ['Pátio', 'Quadra', 'Refeitório', 'Sala'].sort();

  const buildUserLabel = (name: string, role: string) => {
    const parts = [role, name].filter(Boolean);
    return parts.length ? parts.join(' ') : (user?.email?.split('@')[0] || 'Gestor Escolar');
  };

  // Retorna o rotulo do usuario logado: usa registeredBy atual se ja preenchido,
  // senao tenta casar pelo nome em staffMembers, com fallback para email/'Gestor Escolar'.
  const getLoggedUserName = (): string => {
    if (registeredBy && registeredBy.trim()) return registeredBy.trim();
    const emailUser = user?.email?.split('@')[0] || '';
    if (emailUser) {
      const staff = staffMembers.find(s => s.name.toLowerCase() === emailUser.toLowerCase());
      if (staff) return staff.role + ' ' + staff.name;
      return emailUser;
    }
    return 'Gestor Escolar';
  };

  const getLoggedProfessor = (): string => {
    if (currentUserRole !== 'PROFESSOR') return '';
    const match = appUsers.find(u =>
      u.role === 'PROFESSOR' &&
      (u.email === user?.email || u.name.toLowerCase() === getLoggedUserName().toLowerCase())
    );
    if (match) return 'Professor ' + match.name;
    return '';
  };

  // Carregar perfil do Supabase para preencher "Registrado por"
  useEffect(() => {
    if (!user?.email || !supabase) return;
    supabase
      .from('user_profiles')
      .select('name, role')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }: { data: { name: string; role: string } | null }) => {
        if (data?.name) {
          setRegisteredBy(buildUserLabel(data.name, data.role));
          if (data.role === 'PROFESSOR') {
            const appUser = appUsers.find(u =>
              u.role === 'PROFESSOR' && u.name.toLowerCase() === data.name.toLowerCase()
            );
            if (appUser) setLinkedProfessor('Professor ' + appUser.name);
          }
        } else if (user.email) {
          const staff = staffMembers.find(s => s.name.toLowerCase() === user.email.split('@')[0].toLowerCase());
          setRegisteredBy(staff ? staff.role + ' ' + staff.name : user.email.split('@')[0]);
          if (staff && staff.role === 'Professor') {
            setLinkedProfessor(staff.role + ' ' + staff.name);
          }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, staffMembers]);

  // Atualizar registeredBy em tempo real quando o perfil for salvo no AppShell
  useEffect(() => {
    const handler = (e: Event) => {
      const { name, role } = (e as CustomEvent).detail || {};
      if (name) {
        setRegisteredBy(buildUserLabel(name, role));
        if (role === 'PROFESSOR') {
          const appUser = appUsers.find(u =>
            u.role === 'PROFESSOR' && u.name.toLowerCase() === name.toLowerCase()
          );
          if (appUser) setLinkedProfessor('Professor ' + appUser.name);
        }
      }
    };
    window.addEventListener('eecm_profile_updated', handler);
    return () => window.removeEventListener('eecm_profile_updated', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, staffMembers]);

  const filteredOccurrences = occurrences.filter(o => {
    if (o.archived) return false;

    // Filtro de visibilidade para professores
    if (currentUserRole === 'PROFESSOR') {
      const appUser = appUsers.find(u => u.role === 'PROFESSOR' && u.email === user?.email);
      if (!appUser) return false;

      const profLabel = ('professor ' + appUser.name).toLowerCase(); // formato canônico

      const loc  = o.locatedBy?.toLowerCase().trim() || '';
      const reg  = o.registeredBy?.toLowerCase().trim() || '';
      const link = o.linkedProfessor?.toLowerCase().trim() || '';

      const hasMatch =
        loc.includes(appUser.name.toLowerCase()) ||
        reg.includes(appUser.name.toLowerCase()) ||
        link === profLabel;

      if (!hasMatch) return false;
    }
    
    // Get all students associated with this occurrence
    const relatedStudents = o.studentIds && o.studentIds.length > 0 
      ? students.filter(s => o.studentIds?.includes(s.id))
      : students.filter(s => s.id === o.studentId);
    
    const primaryStudent = relatedStudents[0];
    
    // Month filter
    const monthIndex = parseInt(o.date.split('-')[1]) - 1; 
    const month = months[monthIndex];
    if (selectedMonth !== 'Todos os meses' && selectedMonth !== '' && month.toLowerCase() !== selectedMonth.toLowerCase()) {
      return false;
    }

    // Class filter
    if (selectedClass !== 'Todas as turmas' && selectedClass !== '') {
      const anyInClass = relatedStudents.some(s => s.class.toLowerCase() === selectedClass.toLowerCase());
      if (!anyInClass) return false;
    }

    // Severity filter
    if (selectedSeverity !== 'Todas') {
      const rule = rules.find(r => r.code === o.ruleCode);
      if (rule?.severity !== selectedSeverity) return false;
    }

    if (!searchTerm) return true;
    
    // Search in all student names com insensibilidade a acentos
    const searchNormalized = normalizeText(searchTerm);
    const anyNameMatch = relatedStudents.some(s => normalizeText(s.name).includes(searchNormalized));
    const obsMatch = o.observations ? normalizeText(o.observations).includes(searchNormalized) : false;
    
    return anyNameMatch || obsMatch || false;
  }).sort((a, b) => {
    // Ordenar pelo createdAt do servidor (mais recente primeiro) para refletir ordem real de criação
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Fallback: usar date + hour se createdAt não estiver disponível
        const dateTimeA = new Date(a.date + 'T' + (a.hour || '00:00')).getTime();
        const dateTimeB = new Date(b.date + 'T' + (b.hour || '00:00')).getTime();
    if (dateTimeB !== dateTimeA) return dateTimeB - dateTimeA;
    // Se tudo mais for igual, por ID (mais recente ID primeiro)
    return b.id.localeCompare(a.id);
  });

  const matchedRules = rules
    .filter(r => 
      r.description.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.code.toString().includes(ruleSearch)
    )
    .sort((a, b) => a.code - b.code)
    .slice(0, 10); // show top 10

  const activeRule = selectedRules.length > 0 ? rules.find(r => r.code.toString() === selectedRules[0]) : undefined;

  const openAddModal = () => {
    const now = new Date();
    
    // Get date in YYYY-MM-DD format based on local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localDate = year + '-' + month + '-' + day;
    
    const localHour = now.toTimeString().split(' ')[0]; // Pega HH:MM:SS completo

    setEditingOccurrence(null);
    setSelectedStudents([]);
    setDate(localDate);
    setHour(localHour);
    setLocation('Pátio');
    setLocatedBy('');
    setLinkedProfessor(getLoggedProfessor());
    setSelectedRules([]);
    setRuleSearch('');
    setRegisteredBy(getLoggedUserName());
    setObservations('');
    setVideoUrls([]);
    setSignedDocUrls([]);
    setDurationDays(1);
    setAttenuatingFactors([]);
    setAggravatingFactors([]);
    setGraveMeasureType('Suspensão Escolar');
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, o: Occurrence) => {
    e.stopPropagation();
    setEditingOccurrence(o.id);
    setSelectedStudents(o.studentIds && o.studentIds.length > 0 ? o.studentIds : [o.studentId]);
    // Garante formato YYYY-MM-DD para o input type="date"
    const normalizedDate = o.date ? o.date.substring(0, 10) : '';
    setDate(normalizedDate);
    setHour(o.hour || '');
    setLocation(o.location || 'Pátio');
    setLocatedBy(o.locatedBy || '');
    setLinkedProfessor(o.linkedProfessor || '');
    const allCodes = o.ruleCodes && o.ruleCodes.length > 0 ? o.ruleCodes : [o.ruleCode];
    setSelectedRules(allCodes.map(String));
    const firstRule = rules.find(r => r.code === allCodes[0]);
    setRuleSearch(firstRule ? firstRule.description : '');
    setRegisteredBy(o.registeredBy || getLoggedUserName());
    setObservations(o.observations || '');
    setVideoUrls(o.videoUrls || []);
    setSignedDocUrls(o.signedDocUrls || []);
    setDurationDays(o.durationDays || 1);
    setAttenuatingFactors(o.attenuatingFactors || []);
    setAggravatingFactors(o.aggravatingFactors || []);
    setIsModalOpen(true);
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja realmente arquivar este registro disciplinar?')) {
      archiveOccurrence(id);
    }
  };

  // -------------------------------------------------------
  // Bloco de assinaturas — HTML compartilhado (print/export)
  // -------------------------------------------------------
  const signaturesHTML = () => `
    <div class="assinaturas-bloco">
      <div class="sig-item">
        <div class="sig-espaco"></div>
        <div class="sig-line"></div>
        <div class="sig-cargo">Diretora / Coord. Pedagógico</div>
      </div>
      <div class="sig-item">
        <div class="sig-espaco"></div>
        <div class="sig-line"></div>
        <div class="sig-cargo">Gestor Cívico Militar / Educacional</div>
      </div>
      <div class="sig-item">
        <div class="sig-espaco"></div>
        <div class="sig-line"></div>
        <div class="sig-cargo">Responsável Legal</div>
      </div>
    </div>`;

  // Versão DOCX — mesma estrutura via <table> (compatível com Word)
  const signaturesDocxHTML = () => `
    <br/><br/>
    <table style="width:100%; border-collapse: collapse; margin-top: 32pt;">
      <tr>
        <td style="width:33%; vertical-align: bottom; padding: 0 8pt 0 0;">
          <div style="height: 36pt;"></div>
          <div style="border-top: 1px solid #000; padding-top: 4pt; font-size: 8pt; font-weight: bold; text-align: center; text-transform: uppercase;">
            Diretora / Coord. Pedagógico
          </div>
        </td>
        <td style="width:33%; vertical-align: bottom; padding: 0 4pt;">
          <div style="height: 36pt;"></div>
          <div style="border-top: 1px solid #000; padding-top: 4pt; font-size: 8pt; font-weight: bold; text-align: center; text-transform: uppercase;">
            Gestor Cívico Militar / Educacional
          </div>
        </td>
        <td style="width:33%; vertical-align: bottom; padding: 0 0 0 8pt;">
          <div style="height: 36pt;"></div>
          <div style="border-top: 1px solid #000; padding-top: 4pt; font-size: 8pt; font-weight: bold; text-align: center; text-transform: uppercase;">
            Responsável Legal
          </div>
        </td>
      </tr>
    </table>`;

  const handleResolver = async () => {
    if (!_vo || resolucaoText.length < 20) return;
    setResolucaoSaving(true);
    try {
      await updateOccurrence(_vo.id, { 
        status: 'resolvida', 
        solucao_acao: resolucaoText,
        resolved: true,
        resolvedAt: new Date().toISOString()
      });
      setViewOccurrence({ ..._vo, status: 'resolvida', solucao_acao: resolucaoText });
      setShowResolucaoModal(false);
      setResolucaoText('');
      // Abre direto o painel de exportar
      setIsPrintPanelOpen(true);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar resolução.');
    } finally {
      setResolucaoSaving(false);
    }
  };

  const handlePrint = (o: any) => {
    const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

    // Usa o número fixo da ATA armazenado no banco; fallback pela posição na lista total
    const _pIdx = occurrencesChronological.findIndex((x: any) => x.id === o.id);
    const occurrenceNum = o.ataNumber ?? (_pIdx >= 0 ? _pIdx + 1 : '—');

    const rule = rules.find(r => r.code === o.ruleCode);

    // Resolve all students for this occurrence
    const relatedStudents = o.studentIds && o.studentIds.length > 0
      ? students.filter(s => o.studentIds.includes(s.id))
      : [students.find(s => s.id === o.studentId)].filter((s): s is Student => Boolean(s));

    const studentNamesHtml = relatedStudents.map(s => '<div>' + s.name + '</div>').join('');
    const firstStudent = relatedStudents[0];
    const turmaStr = firstStudent ? (firstStudent.class || '---') + ' \u2014 ' + (firstStudent.shift || '---') : '---';

    // Reincidence check
    const reincidenteCount = occurrences.filter(oc =>
      oc.ruleCode === o.ruleCode &&
      (oc.studentId === o.studentId || (oc.studentIds && oc.studentIds.includes(o.studentId))) &&
      new Date(oc.date) <= new Date(o.date)
    ).length;
    const isReincidente = reincidenteCount > 1;

    // Auto-generate ATA text if empty
    const [year, month, day] = (o.date || '').split('-');
    const mesExtenso = MESES[parseInt(month, 10) - 1] ?? '';
    const diaNum = parseInt(day, 10);
    const alunoStr = relatedStudents.length === 1
      ? 'o(a) aluno(a) ' + relatedStudents[0].name
      : 'os alunos ' + relatedStudents.slice(0,-1).map(s=>s.name).join(', ') + ' e ' + relatedStudents[relatedStudents.length-1].name;
    const autoAta = 'ATA N\u00ba ' + occurrenceNum + '. Aos ' + diaNum + ' dias do m\u00eas de ' + mesExtenso + ' do ano de ' + year + ', \u00e0s ' + (o.hour || '---') + ', ' + alunoStr + ' foi identificado(a) no(a) ' + (o.location || '---') + (o.locatedBy ? ' pelo(a) ' + o.locatedBy : '') + ', incorrendo em infra\u00e7\u00e3o ao Art. ' + o.ruleCode + ' do Regimento Interno (' + (rule?.description || 'Ocorr\u00eancia personalizada') + '). O presente registro foi lavrado por ' + (o.registeredBy || '---') + '.';
    const ataText = (o.observations || '').trim() || autoAta;

    // Factors
    const atenuantes = Array.isArray(o.attenuatingFactors) && o.attenuatingFactors.length ? o.attenuatingFactors.join(', ') : 'Nenhum';
    const agravantes = Array.isArray(o.aggravatingFactors) && o.aggravatingFactors.length ? o.aggravatingFactors.join(', ') : 'Nenhum';
    const hasFactors = atenuantes !== 'Nenhum' || agravantes !== 'Nenhum' || isReincidente;

    const factorsBlock = hasFactors ? `
      <div class="bloco">
        <div class="bloco-titulo">BLOCO 4 — FATORES</div>
        <table class="info-table">
          <tr><td class="label-cell">Fatores Atenuantes</td><td>${atenuantes}</td></tr>
          <tr><td class="label-cell">Fatores Agravantes</td><td>${agravantes}</td></tr>
        </table>
        ${isReincidente ? '<div class="reincidencia-box">REINCID\u00caNCIA \u2014 ' + reincidenteCount + '\u00aa ocorr\u00eancia nesta infra\u00e7\u00e3o</div>' : ''}
      </div>
      <div class="page-break"></div>
    ` : '<div class="page-break"></div>';

    const printWindow = window.open('', '_blank', 'width=850,height=700');
    if (!printWindow) return;

    const measuresStr = Array.isArray(o.measures) && o.measures.length > 0
      ? o.measures.join(' / ')
      : (o.measure || 'A definir');

    const impactoStr =
      o.severity === 'Leve' ? '-0,10 PONTOS'
      : o.severity === 'Media' ? '-0,30 PONTOS'
      : o.severity === 'Grave' ? '-0,50 PONTOS'
      : '---';

    printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>ATA de Ocorrência Disciplinar</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      color: #000;
      background: #fff;
      line-height: 1.5;
    }
    ${SCHOOL_HEADER_CSS}
    .reincidencia-tag {
      margin-top: 12px;
      padding: 4px 8px;
      border: 1px solid #c00;
      color: #c00;
      font-weight: bold;
      font-size: 8pt;
      border-radius: 2px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>

  ${getSchoolHeaderHTML(activeSchoolContext)}

  <div class="ata-layout">

    <!-- SIDEBAR: IDENTIFICAÇÃO / INFRAÇÃO / MEDIDA -->
    <div class="sidebar">
      <div class="sidebar-titulo">IDENTIFICAÇÃO</div>

      <div class="sid-item">
        <span class="sid-label">Nº ATA</span>
        <span class="sid-valor">${occurrenceNum}</span>
      </div>
      <div class="sid-item">
        <span class="sid-label">Data do Registro</span>
        <span class="sid-valor">${formatDate(o.date)} ${o.hour || ''}</span>
      </div>
      <div class="sid-item">
        <span class="sid-label">Local</span>
        <span class="sid-valor">${o.location || '---'}</span>
      </div>
      <div class="sid-item">
        <span class="sid-label">Aluno</span>
        <span class="sid-valor">${studentNamesHtml}</span>
      </div>
      <div class="sid-item">
        <span class="sid-label">Turma</span>
        <span class="sid-valor">${turmaStr}</span>
      </div>
      <div class="sid-item">
        <span class="sid-label">Localizado por</span>
        <span class="sid-valor">${o.locatedBy || '---'}</span>
      </div>
      <div class="sid-item">
        <span class="sid-label">Professor Vinculado</span>
        <span class="sid-valor">${o.linkedProfessor || '---'}</span>
      </div>
      <div class="sid-item">
        <span class="sid-label">Registrado por</span>
        <span class="sid-valor">${o.registeredBy || '---'}</span>
      </div>

      <div class="sidebar-divisor"></div>
      <div class="sidebar-secao">INFRA\u00c7\u00c3O</div>
      <div class="sid-item">
        <span class="sid-label">Art. ${o.ruleCode}</span>
        <span class="sid-valor" style="font-weight: normal; font-size: 8.5pt; text-transform: uppercase;">${rule?.description || 'Ocorr\u00eancia personalizada'}</span>
      </div>

      <div class="sidebar-divisor"></div>
      <div class="sidebar-secao">MEDIDA</div>
      <div class="sid-medida-row">
        <span class="sid-medida-label">Gravidade</span>
        <span class="sid-medida-valor">${(o.severity || '---').toUpperCase()}</span>
      </div>
      <div class="sid-medida-row">
        <span class="sid-medida-label">Medida</span>
        <span class="sid-medida-valor">${measuresStr.toUpperCase()}</span>
      </div>
      <div class="sid-medida-row">
        <span class="sid-medida-label">Impacto</span>
        <span class="sid-medida-valor">${impactoStr}</span>
      </div>

      ${isReincidente ? '<div class="reincidencia-tag">REINCID\u00caNCIA \u2014 ' + reincidenteCount + '\u00aa vez</div>' : ''}
    </div>

    <!-- COLUNA PRINCIPAL: ATA -->
    <div class="main-col">
      <div class="ata-subtitulo">Relato do Ocorrido</div>
      <div class="ata-corpo">${markdownBoldToHtml(ataText)}</div>

      ${signaturesHTML()}
    </div>

  </div><!-- /ata-layout -->

  ${getSchoolFooterHTML(activeSchoolContext)}

</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || selectedRules.length === 0) return;

    try {
      const primaryStudentId = selectedStudents[0];
      const ruleCodesInt = selectedRules.map(r => parseInt(r, 10));
      const primaryRuleCode = ruleCodesInt[0];
      // Ao editar, exclui a própria ocorrência do cálculo de reincidência
      const escalation = getEscalationStatus(primaryStudentId, primaryRuleCode, editingOccurrence ?? undefined);
      const suspensaoLabel = 'Suspens\u00e3o Escolar';
      const suspensaoValue = 'Suspens\u00e3o (' + durationDays + 'd)';
      const measureToSave = measureOverride
        ? measureOverride
        : escalation.severity === 'Grave'
          ? (graveMeasureType === suspensaoLabel ? suspensaoValue : graveMeasureType)
          : escalation.measure;

      if (editingOccurrence) {
        // Identifica alunos que já estavam na ocorrência original
        const originalOccurrence = occurrences.find(o => o.id === editingOccurrence);
        const originalStudentIds: string[] = originalOccurrence?.studentIds ?? (originalOccurrence?.studentId ? [originalOccurrence.studentId] : []);

        // Alunos novos adicionados durante a edição
        const newStudentIds = selectedStudents.filter(id => !originalStudentIds.includes(id));

        // Atualiza a ocorrência original com os dados editados (mantém apenas alunos originais)
        await updateOccurrence(editingOccurrence, {
          studentId: primaryStudentId,
          studentIds: originalStudentIds.length > 0 ? originalStudentIds : selectedStudents,
          date,
          hour,
          location,
          locatedBy,
          linkedProfessor,
          ruleCode: primaryRuleCode,
          ruleCodes: ruleCodesInt,
          registeredBy,
          observations,
          measure: measureToSave,
          videoUrls,
          signedDocUrls,
          durationDays: escalation.severity === 'Grave' ? durationDays : undefined,
          attenuatingFactors,
          aggravatingFactors
        });

        // Para cada aluno novo, cria uma ocorrência clonada
        if (newStudentIds.length > 0) {
          console.log('[v0] Criando ocorrências clonadas para novos alunos:', newStudentIds);
          for (const studentId of newStudentIds) {
            const result = await addOccurrence({
              studentId,
              studentIds: [studentId],
              date,
              hour,
              location,
              locatedBy,
              linkedProfessor,
              ruleCode: primaryRuleCode,
              ruleCodes: ruleCodesInt,
              registeredBy,
              observations,
              measure: measureToSave,
              measures: [measureToSave],
              videoUrls,
              signedDocUrls,
              durationDays: escalation.severity === 'Grave' ? durationDays : undefined,
              attenuatingFactors,
              aggravatingFactors,
              status: 'iniciada'
            });
            if (result && result.id) {
              await updateOccurrence(result.id, { status: 'em tratamento' });
            }
          }
          console.log('[v0] Ocorrências clonadas criadas com sucesso para', newStudentIds.length, 'aluno(s)');
        }
      } else {
        // Escalation alert for new occurrences
        if (escalation.isEscalated) {
          const student = students.find(s => s.id === primaryStudentId);
          const confirmMsg = 'ATEN\u00c7\u00c3O (' + (student?.name ?? '') + '): ' + escalation.reason + '!\n\nA medida sugerida subiu para: ' + escalation.measure + '.\n\nDeseja confirmar este registro com a medida agravada?';
          const confirmed = window.confirm(confirmMsg);
          if (!confirmed) return;
        }

        // Cria UMA ocorrência por aluno selecionado
        const savedIds: string[] = [];
        let ataNumber: number | undefined;
        for (const studentId of selectedStudents) {
          const result = await addOccurrence({
            studentId,
            studentIds: [studentId],
            date,
            hour,
            location,
            locatedBy,
            linkedProfessor,
            ruleCode: primaryRuleCode,
            ruleCodes: ruleCodesInt,
            registeredBy,
            observations,
            measure: measureToSave,
            measures: selectedMeasures.length > 0 ? selectedMeasures : [measureToSave],
            videoUrls,
            signedDocUrls,
            durationDays: escalation.severity === 'Grave' ? durationDays : undefined,
            attenuatingFactors,
            aggravatingFactors,
            status: 'iniciada'
          });
          if (result && result.id) {
            savedIds.push(result.id);
            if (!ataNumber && result.ataNumber) ataNumber = result.ataNumber;
            // Avança status automático após submit final
            await updateOccurrence(result.id, { status: 'em tratamento' });
          }
        }

        const savedId = savedIds[0];

        // Códigos de infrações que envolvem violência física / bullying / agressão
        const VIOLENCIA_CODES = [64, 65, 69, 75, 76, 78, 80, 83, 84, 89];
        const isViolence = ruleCodesInt.some(c => VIOLENCIA_CODES.includes(c));

        const studentName = students.find(s => s.id === primaryStudentId)?.name ?? 'Aluno';
        // Usa o ataNumber retornado do banco
        const occurrenceNum = ataNumber
          ? 'ATA Nº ' + ataNumber
          : (savedId ? 'ATA Nº ...' : 'Nova');

        // Monta os itens do checklist
        const baseItems: ChecklistItem[] = [
          {
            id: 'comunicar_pais',
            label: 'Comunicar os responsáveis / pais',
            done: false,
            autoCompleteTrigger: 'whatsapp',
          },
          {
            id: 'realizar_medida',
            label: 'Realizar a medida sugerida: ' + measureToSave,
            done: false,
          },
          {
            id: 'importar_doc',
            label: 'Importar foto do documento assinado',
            done: false,
          },
        ];

        const violenceItems: ChecklistItem[] = isViolence
          ? [
              { id: 'ficha_ficai', label: 'Preencher Ficha FICAI', done: false },
              { id: 'ficha_sigeduca', label: 'Preencher Ficha SIGEDUCA', done: false },
              { id: 'boletim', label: 'Registrar Boletim de Ocorrência (BO)', done: false },
            ]
          : [];

        const allItems = [...baseItems, ...violenceItems];

        // Fecha o modal de criação e exibe o alerta pós-salvar
        setIsModalOpen(false);
        setEditingOccurrence(null);
        setMeasureOverride(null);
        setMeasurePanelOpen({});
        setSelectedMeasures([]);
        setSuggestions('');
        setShowSuggestions(false);
        setSelectedStudents([]);
        setSelectedRules([]);
        setLinkedProfessor('');

        setPostSaveAlert({
          occurrenceId: savedId ?? occurrenceNum,
          occurrenceNum,
          studentName,
          measure: measureToSave,
          isViolence,
          checklistItems: allItems,
          ataNumber: ataNumber,
        });
        return; // sai cedo — reset já feito acima
      }

      // Reset do form para o caminho de edição
      setIsModalOpen(false);
      setEditingOccurrence(null);
      setMeasureOverride(null);
      setMeasurePanelOpen({});
      setSuggestions('');
      setShowSuggestions(false);
      setSelectedStudents([]);
      setSelectedRules([]);
      setRuleSearch('');
      setObservations('');
      setVideoUrls([]);
      setSignedDocUrls([]);
      setLinkedProfessor('');
    } catch (err) {
      console.error("Erro ao salvar ocorrência:", err);
      // Do not close the modal if there's an error
    }
  };

  const handleAddContact = () => {
    setNewContacts([...newContacts, { name: '', phone: '' }]);
  };

  const handleRemoveContact = (index: number) => {
    const contacts = [...newContacts];
    contacts.splice(index, 1);
    setNewContacts(contacts.length > 0 ? contacts : [{ name: '', phone: '' }]);
  };

  const updateContact = (index: number, field: 'name' | 'phone', value: string) => {
    const contacts = [...newContacts];
    if (field === 'phone') {
        let v = value.replace(/\D/g, '');
        if (v.length > 0 && (v === '9' || v === '8')) v = '65' + v;
        if (v.length > 11) v = v.slice(0, 11);

        let formatted = v;
        if (v.length > 0) {
            if (v.length <= 2) formatted = '(' + v;
            else if (v.length <= 6) formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2);
            else if (v.length <= 10) formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
            else formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
        }
        contacts[index][field] = formatted;
        setIgnoredWarning(false);
        const inputRef = phoneRefs.current[index];
        if (inputRef) inputRef.setCustomValidity('');
    } else {
        contacts[index][field] = value;
    }
    setNewContacts(contacts);
  };

  const handleAddQuickGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudentId = selectedStudents[0];
    if (!targetStudentId || !newGuardianName || !newGuardianPhone) return;

    const currentStudent = students.find(s => s.id === targetStudentId);
    if (!currentStudent) return;

    if (!guardianIgnoredWarning) {
      const nums = newGuardianPhone.replace(/\D/g, '');
      if (nums.length === 10) {
        if (guardianPhoneRef.current) {
          guardianPhoneRef.current.setCustomValidity('Falta um "9" na frente deste número. Clique em Confirmar novamente se quiser salvar assim mesmo.');
          guardianPhoneRef.current.reportValidity();
          setGuardianIgnoredWarning(true);
          return;
        }
      }
    }

    setGuardianIgnoredWarning(false);

    const updatedContacts = [
      ...(currentStudent.contacts || []),
      { name: newGuardianName, phone: newGuardianPhone }
    ];

    try {
      await updateStudent(targetStudentId, { contacts: updatedContacts });
      setNewGuardianName('');
      setNewGuardianPhone('');
      setIsAddGuardianModalOpen(false);
      setIsGuardianListOpen(true);
    } catch (err) {
      console.error("Erro ao adicionar responsável:", err);
    }
  };

  const handleQuickGuardianPhoneChange = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 0 && (v === '9' || v === '8')) v = '65' + v;
    if (v.length > 11) v = v.slice(0, 11);

    let formatted = v;
    if (v.length > 0) {
        if (v.length <= 2) formatted = '(' + v;
        else if (v.length <= 6) formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2);
        else if (v.length <= 10) formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
        else formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
    }
    setNewGuardianPhone(formatted);
    setGuardianIgnoredWarning(false);
    if (guardianPhoneRef.current) guardianPhoneRef.current.setCustomValidity('');
  };

  const handleQuickAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newClassName) return;

    // Filter valid contacts
    const validContacts = newContacts.filter(c => c.name.trim() !== '' || c.phone.trim() !== '');

    if (!ignoredWarning) {
      let firstInvalidIndex = -1;
      const hasMissingNine = validContacts.some((c, idx) => {
         const nums = c.phone.replace(/\D/g, '');
         if (nums.length === 10) {
            firstInvalidIndex = idx;
            return true;
         }
         return false;
      });

      if (hasMissingNine && firstInvalidIndex !== -1 && phoneRefs.current[firstInvalidIndex]) {
         const input = phoneRefs.current[firstInvalidIndex];
         if (input) {
           input.setCustomValidity('Falta um "9" na frente deste número. Clique em Confirmar novamente se quiser salvar assim mesmo.');
           input.reportValidity();
           setIgnoredWarning(true);
           return;
         }
      }
    }

    setIgnoredWarning(false);

    try {
      await addStudent({
        name: newName,
        class: newClassName,
        shift: newShift,
        points: 8.0,
        contacts: validContacts.length > 0 ? validContacts : undefined
      });
      setNewName('');
      setNewContacts([{ name: '', phone: '' }]);
      setIsStudentModalOpen(false);
    } catch (err) {
      console.error("Erro ao adicionar aluno:", err);
    }
  };

  const handleWhatsAppRedirect = (phone: string, studentName: string, studentId?: string) => {
    const url = formatPhoneForWhatsApp(phone, studentName);
    if (!url) return;

    // Autocompleta "Comunicar pais" no checklist para ocorrências pendentes deste aluno
    if (studentId) {
      const pending = checklistTasks.filter(t =>
        occurrences.find(o => o.id === t.occurrenceId && o.studentId === studentId)
      );
      let updated = checklistTasks;
      pending.forEach(t => {
        updated = autocompleteWhatsapp(userId, t.occurrenceId);
      });
      if (pending.length > 0) setChecklistTasks(updated);
    }

    // If we are in the main modal (new/edit), auto-save before redirecting
    if (isModalOpen && selectedStudents.length > 0 && selectedRules.length > 0) {
      if (editingOccurrence) {
        const studentId = selectedStudents[0];
        const ruleCodeInt = parseInt(selectedRules[0], 10);
        updateOccurrence(editingOccurrence, {
          studentId,
          studentIds: selectedStudents,
          date,
          hour,
          location,
          locatedBy,
          ruleCode: ruleCodeInt,
          registeredBy,
          observations,
          videoUrls,
          signedDocUrls,
          durationDays: rules.find(r => r.code === ruleCodeInt)?.severity === 'Grave' ? durationDays : undefined
        });
      } else {
        for (const ruleCodeStr of selectedRules) {
          const ruleCodeInt = parseInt(ruleCodeStr, 10);
          addOccurrence({
            studentId: selectedStudents[0],
            studentIds: selectedStudents,
            date,
            hour,
            location,
            locatedBy,
            ruleCode: ruleCodeInt,
            registeredBy,
            observations,
            videoUrls,
            signedDocUrls,
            durationDays: rules.find(r => r.code === ruleCodeInt)?.severity === 'Grave' ? durationDays : undefined
          });
        }
      }
      setIsModalOpen(false);
      setEditingOccurrence(null);
      setSelectedStudents([]);
      setSelectedRules([]);
      setRuleSearch('');
      setObservations('');
      setVideoUrls([]);
      setSignedDocUrls([]);
      setIsGuardianListOpen(false);
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleQuickAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;
    try {
      await addStaffMember({
        name: newStaffName,
        role: newStaffRole
      });
      setLocatedBy(newStaffRole + ' ' + newStaffName);
      setNewStaffName('');
      setIsStaffModalOpen(false);
    } catch (err) {
      console.error("Erro ao adicionar membro da equipe:", err);
    }
  };

  const handleQuickAddStaffProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;
    try {
      await addStaffMember({
        name: newStaffName,
        role: 'Professor'
      });
      setLinkedProfessor('Professor ' + newStaffName);
      setNewStaffName('');
      setIsStaffModalOpenProf(false);
    } catch (err) {
      console.error("Erro ao adicionar professor:", err);
    }
  };

  const handleExport = (o: Occurrence) => {
    // Usa o número fixo da ATA armazenado no banco; fallback pela posição na lista total
    const _eIdx = occurrencesChronological.findIndex((x: any) => x.id === o.id);
    const occurrenceNum = o.ataNumber ?? (_eIdx >= 0 ? _eIdx + 1 : '—');

    const relatedStudents = o.studentIds && o.studentIds.length > 0
      ? students.filter(s => o.studentIds?.includes(s.id))
      : [students.find(s => s.id === o.studentId)].filter((s): s is Student => Boolean(s));
    
    const primaryStudent = relatedStudents[0];
    const studentNames = relatedStudents.map(s => s.name).join(', ');
    const studentClasses = Array.from(new Set(relatedStudents.map(s => s.class))).join(', ');
    
    const rule = rules.find(r => r.code === o.ruleCode);
    
    // Calculate if it was escalated at the time
    const studentOccurrences = occurrences.filter(oc => oc.studentId === o.studentId && new Date(oc.date) <= new Date(o.date));
    const sameRuleCount = studentOccurrences.filter(oc => oc.ruleCode === o.ruleCode).length;
    let isEscalated = sameRuleCount > 1;
    let measure = rule?.measure || '';
    if (isEscalated) {
         measure = rule?.severity === 'Leve' ? 'Advertência Escrita (Agravada)' : 'Suspensão (Agravada)';
    } else if (rule?.severity === 'Leve' && studentOccurrences.filter(oc => rules.find(r => r.code === oc.ruleCode)?.severity === 'Leve').length >= 3) {
         isEscalated = true;
         measure = 'Advertência Escrita (Agravada por acúmulo)';
    }

    const docTitle = measure.includes('Escrita') ? 'TERMO DE ADVERTÊNCIA ESCRITA' : 
                     measure.includes('Suspensão') ? 'TERMO DE SUSPENSÃO' : 
                     'REGISTRO DISCIPLINAR';

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const pointsToDeduct = rule?.severity === 'Grave' && measure.includes('Suspensão') 
      ? 0.50 * (o.durationDays || 1) 
      : Math.abs(rule?.points || 0);

    const exportMeasuresStr = Array.isArray(o.measures) && o.measures.length > 0
      ? o.measures.join(' / ')
      : (o.measure || measure || 'A definir');

    const resetCSS = '* { box-sizing: border-box; margin: 0; padding: 0; }';
    const bodyCSS = "body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; background: #fff; line-height: 1.5; }";

    const sidebarHTML =
      '<div class="sidebar">' +
        '<div class="sidebar-titulo">IDENTIFICA\u00c7\u00c3O</div>' +
        '<div class="sid-item"><span class="sid-label">Data do Registro</span><span class="sid-valor">' + formatDate(o.date) + ' ' + (o.hour || '') + '</span></div>' +
        '<div class="sid-item"><span class="sid-label">Local</span><span class="sid-valor">' + (o.location || '---') + '</span></div>' +
        '<div class="sid-item"><span class="sid-label">' + (relatedStudents.length > 1 ? 'Alunos' : 'Aluno') + '</span><span class="sid-valor">' + studentNames + '</span></div>' +
        '<div class="sid-item"><span class="sid-label">' + (relatedStudents.length > 1 ? 'Turmas' : 'Turma') + '</span><span class="sid-valor">' + studentClasses + '</span></div>' +
        '<div class="sid-item"><span class="sid-label">Localizado por</span><span class="sid-valor">' + (o.locatedBy || '---') + '</span></div>' +
        '<div class="sid-item"><span class="sid-label">Professor Vinculado</span><span class="sid-valor">' + (o.linkedProfessor || '---') + '</span></div>' +
        '<div class="sid-item"><span class="sid-label">Registrado por</span><span class="sid-valor">' + (o.registeredBy || '---') + '</span></div>' +
        '<div class="sidebar-divisor"></div>' +
        '<div class="sidebar-secao">INFRA\u00c7\u00c3O</div>' +
        '<div class="sid-item"><span class="sid-label">Art. ' + rule?.code + '</span><span class="sid-valor" style="font-weight:normal;font-size:8.5pt;text-transform:uppercase;">' + (rule?.description || 'Ocorr\u00eancia personalizada') + '</span></div>' +
        '<div class="sidebar-divisor"></div>' +
        '<div class="sidebar-secao">MEDIDA</div>' +
        '<div class="sid-medida-row"><span class="sid-medida-label">Gravidade</span><span class="sid-medida-valor">' + (rule?.severity || '---').toUpperCase() + '</span></div>' +
        '<div class="sid-medida-row"><span class="sid-medida-label">Medida</span><span class="sid-medida-valor">' + exportMeasuresStr.toUpperCase() + (o.durationDays ? ' (' + o.durationDays + ' DIA' + (o.durationDays > 1 ? 'S' : '') + ')' : '') + '</span></div>' +
        '<div class="sid-medida-row"><span class="sid-medida-label">Impacto</span><span class="sid-medida-valor">-' + pointsToDeduct.toFixed(2).replace('.', ',') + ' PONTOS</span></div>' +
      '</div>';

    const mainColHTML =
      '<div class="main-col">' +
        '<div class="ata-titulo-grande">ATA N\u00ba ' + occurrenceNum + '</div>' +
        '<div class="ata-subtitulo">Relato do Ocorrido</div>' +
        '<div class="ata-corpo">' + markdownBoldToHtml(o.observations || 'Nenhum relato registrado.') + '</div>' +
        signaturesHTML() +
      '</div>';

    const printHTML =
      '<html lang="pt-BR">' +
        '<head>' +
          '<title>' + docTitle + ' - ' + (primaryStudent?.name ?? '') + '</title>' +
          '<style>' + resetCSS + ' ' + bodyCSS + ' ' + SCHOOL_HEADER_CSS + '</style>' +
        '</head>' +
        '<body>' +
          getSchoolHeaderHTML(activeSchoolContext) +
          '<div class="ata-layout">' + sidebarHTML + mainColHTML + '</div>' +
          getSchoolFooterHTML(activeSchoolContext) +
        '</body>' +
      '</html>';

    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportDocx = (o: Occurrence) => {
    const relatedStudents = o.studentIds && o.studentIds.length > 0
      ? students.filter(s => o.studentIds?.includes(s.id))
      : [students.find(s => s.id === o.studentId)].filter((s): s is Student => Boolean(s));
    
    const primaryStudent = relatedStudents[0];
    const studentNames = relatedStudents.map(s => s.name).join(', ');
    const studentClasses = Array.from(new Set(relatedStudents.map(s => s.class))).join(', ');
    
    const rule = rules.find(r => r.code === o.ruleCode);
    
    // Logic similar to handleExport
    const studentOccurrences = occurrences.filter(oc => oc.studentId === o.studentId && new Date(oc.date) <= new Date(o.date));
    const sameRuleCount = studentOccurrences.filter(oc => oc.ruleCode === o.ruleCode).length;
    let isEscalated = sameRuleCount > 1;
    let measure = rule?.measure || '';
    if (isEscalated) {
         measure = rule?.severity === 'Leve' ? 'Advert����ncia Escrita (Agravada)' : 'Suspensão (Agravada)';
    } else if (rule?.severity === 'Leve' && studentOccurrences.filter(oc => rules.find(r => r.code === oc.ruleCode)?.severity === 'Leve').length >= 3) {
         isEscalated = true;
         measure = 'Advertência Escrita (Agravada por acúmulo)';
    }

    const docTitle = measure.includes('Escrita') ? 'TERMO DE ADVERTÊNCIA ESCRITA' : 
                     measure.includes('Suspensão') ? 'TERMO DE SUSPENSÃO' : 
                     'REGISTRO DISCIPLINAR';

    const pointsToDeduct = rule?.severity === 'Grave' && measure.includes('Suspensão') 
      ? 0.50 * (o.durationDays || 1) 
      : Math.abs(rule?.points || 0);

    const isHeliodoro = activeSchoolContext === 'heliodoro';
    const headerHtmlDocx = isHeliodoro
      ? '<table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">' +
          '<tr>' +
            '<td style="width: 70px; vertical-align: middle;">' +
              '<img src="' + window.location.origin + '/logo-seduc-mt.svg" width="70" height="70" style="width:70px;height:70px;" alt="SEDUC">' +
            '</td>' +
            '<td style="text-align: center; vertical-align: middle; font-family: Arial, sans-serif;">' +
              '<div style="font-size: 10pt; font-weight: bold; color: #1a237e;">GOVERNO DO ESTADO DE MATO GROSSO</div>' +
              '<div style="font-size: 10pt; font-weight: bold; color: #1a237e;">SECRETARIA DE ESTADO DE EDUCAÇÃO</div>' +
              '<div style="font-size: 12pt; font-weight: bold; color: #1a237e; margin-top: 2px;">ESCOLA ESTADUAL CÍVICO-MILITAR</div>' +
              '<div style="font-size: 14pt; font-weight: bold; color: #1a237e; letter-spacing: 1px;">HELIODORO CAPISTRANO</div>' +
            '</td>' +
            '<td style="width: 75px; text-align: right; vertical-align: middle;">' +
              '<img src="' + window.location.origin + '/schools/heliodoro/nova_logo.svg" width="75" height="75" style="width:75px;height:75px;" alt="Logo Escola">' +
            '</td>' +
          '</tr>' +
        '</table>'
      : '<div style="width:160%;margin-left:-30%;margin-bottom:10px;">' +
          '<img src="' + window.location.origin + '/CABE\u00c7ALHO JB.svg" width="100%" style="width:100%;height:auto;" alt="Cabe\u00e7alho">' +
        '</div>';

    const htmlContent =
      '<div style="font-family:Arial,sans-serif;">' +
        headerHtmlDocx +
        '<h1 style="text-align:center;font-size:22pt;text-decoration:underline;margin-bottom:15px;">' + docTitle + '</h1>' +
        '<p style="font-size:14pt;"><strong>DATA DO REGISTRO:</strong> ' + formatDate(o.date) + ' ' + (o.hour || '') + '</p>' +
        '<p style="font-size:14pt;"><strong>LOCAL:</strong> ' + (o.location || 'N\u00c3O INFORMADO') + '</p>' +
        '<p style="font-size:14pt;"><strong>' + (relatedStudents.length > 1 ? 'ALUNOS' : 'ALUNO') + ':</strong> ' + studentNames.toUpperCase() + '</p>' +
        '<p style="font-size:14pt;"><strong>' + (relatedStudents.length > 1 ? 'TURMAS' : 'TURMA') + ':</strong> ' + studentClasses.toUpperCase() + '</p>' +
        '<p style="font-size:14pt;"><strong>LOCALIZADO POR:</strong> ' + (o.locatedBy?.toUpperCase() || 'N\u00c3O INFORMADO') + '</p>' +
        '<p style="font-size:14pt;"><strong>PROFESSOR VINCULADO:</strong> ' + (o.linkedProfessor?.toUpperCase() || 'N\u00c3O INFORMADO') + '</p>' +
        '<p style="font-size:14pt;"><strong>REGISTRADO POR:</strong> ' + (o.registeredBy?.toUpperCase() || 'SISTEMA') + '</p>' +
        '<div style="border:1px solid #000;padding:10pt;margin:20pt 0;font-size:11pt;">' +
          '<p><strong>INFRA\u00c7\u00c3O (ART. ' + rule?.code + '):</strong> ' + (rule?.description?.toUpperCase() || '') + '</p>' +
          '<p><strong>GRAVIDADE:</strong> ' + (rule?.severity?.toUpperCase() || '') + '</p>' +
          '<p><strong>MEDIDA ADMINISTRATIVA:</strong> ' + (measure?.toUpperCase() || '') + ' ' + (o.durationDays ? '(' + o.durationDays + ' ' + (o.durationDays === 1 ? 'DIA' : 'DIAS') + ')' : '') + '</p>' +
          '<p><strong>IMPACTO NA PONTUA\u00c7\u00c3O:</strong> -' + pointsToDeduct.toFixed(2) + ' PONTOS</p>' +
        '</div>' +
        '<p><strong>ATA:</strong></p>' +
        '<div style="border:1px solid #000;min-height:180pt;padding:10pt;font-size:12pt;">' + (o.observations || 'Nenhum registro de ATA detalhado.') + '</div>' +
        signaturesDocxHTML() +
      '</div>';

    const fullHtml =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + docTitle + '</title></head>' +
      '<body>' + htmlContent + '</body>' +
      '</html>';

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docTitle.replace(/ /g, '_') + '_' + (primaryStudent?.name?.replace(/ /g, '_') || '') + '.doc';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Variaveis pre-computadas para o modal de visualizacao (substitui IIFE)
  const _vo = viewOccurrence;
  const _voStudent = _vo ? students.find(s => s.id === _vo.studentId) : null;
  const _voAllRuleCodes = _vo ? (_vo.ruleCodes && _vo.ruleCodes.length > 0 ? _vo.ruleCodes : [_vo.ruleCode]) : [];
  const _voRule = _vo ? rules.find(r => r.code === _voAllRuleCodes[0]) : null;
  const _voAllRules = _vo ? _voAllRuleCodes.map(rc => rules.find(r => r.code === rc)).filter(Boolean) : [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Registro Disciplinar</h1>
            <p className="text-slate-500 text-sm">Gerenciamento de ocorrências dos alunos.</p>
          </div>
          {currentUserRole !== 'GUEST' && (
            <button 
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" /> Nova Ocorrência
            </button>
          )}
        </div>

        {/* List Card */}
        <div className="glass-card overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Buscar por aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 text-sm text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <SearchableSelect
                  options={[
                    { value: 'Todas as turmas', label: 'Todas as turmas' },
                    ...classes.map(c => ({ value: c, label: c }))
                  ]}
                  value={selectedClass}
                  onChange={setSelectedClass}
                  placeholder="Pesquisar Turma..."
                  heightClass="py-2 text-sm"
                />
              </div>
              <div className="relative w-full md:w-48">
                <SearchableSelect
                  options={[
                    { value: 'Todos os meses', label: 'Todos os meses' },
                    ...months.map(m => ({ value: m, label: m }))
                  ]}
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  placeholder="Pesquisar Mês..."
                  heightClass="py-2 text-sm"
                />
              </div>
              <div className="relative w-full md:w-40">
                <SearchableSelect
                  options={[
                    { value: 'Todas', label: 'Todas Gravidades' },
                    { value: 'Leve', label: 'Leve' },
                    { value: 'Media', label: 'Média' },
                    { value: 'Grave', label: 'Grave' }
                  ]}
                  value={selectedSeverity}
                  onChange={setSelectedSeverity}
                  placeholder="Gravidade..."
                  heightClass="py-2 text-sm"
                />
              </div>
            </div>
          </div>
          
          <div
            ref={tableWrapperRef}
            className="overflow-x-auto overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0 scroll-smooth-mobile"
            style={{ maxHeight: '70vh' }}
          >
            <div
              ref={tableRotationRef}
              style={{ transition: 'transform 0.05s linear', willChange: 'transform', transformOrigin: 'center top' }}
            >
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3 font-medium w-12 text-center">N\u00ba</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Horário</th>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Turma</th>
                  <th className="px-6 py-3 font-medium">Infração</th>
                  <th className="px-6 py-3 font-medium">Gravidade</th>
                  <th className="px-6 py-3 font-medium">Medida</th>
                  <th className="px-6 py-3 font-medium w-12 text-center">
                    <Printer className="w-3.5 h-3.5 mx-auto text-slate-400" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredOccurrences.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma ocorrência encontrada.
                    </td>
                  </tr>
                ) : (
                      filteredOccurrences.map((o) => {
                        const relatedStudents = o.studentIds && o.studentIds.length > 0
                          ? students.filter(s => o.studentIds?.includes(s.id))
                          : [students.find(s => s.id === o.studentId)].filter((s): s is Student => Boolean(s));
                        
                        const names = relatedStudents.map(s => s.name).join(', ');
                        const classes_occur = Array.from(new Set(relatedStudents.map(s => s.class))).join(', ');
                        const allOccRuleCodes = o.ruleCodes && o.ruleCodes.length > 0 ? o.ruleCodes : [o.ruleCode];
                        const allOccRules = allOccRuleCodes.map(rc => rules.find(r => r.code === rc)).filter(Boolean);
                        const rule = allOccRules[0];
                        
                        return (
                          <tr 
                            key={o.id} 
                            onClick={() => { setViewOccurrence(o); setIsPrintPanelOpen(false); setVoTab('detalhes'); }}
                            className="hover:bg-slate-50 transition cursor-pointer"
                            title="Clique para ver os detalhes ou exportar"
                          >
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                {(() => { const i = occurrencesChronological.findIndex((x: any) => x.id === o.id); return o.ataNumber ?? (i >= 0 ? i + 1 : '—'); })()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span>{formatDate(o.date)}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {o.hour || '—'}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800 max-w-[200px] truncate">{names || 'Nenhum aluno'}</td>
                            <td className="px-6 py-4 max-w-[120px] truncate">{classes_occur || '-'}</td>
                        <td className="px-6 py-4 max-w-[200px]">
                          {allOccRules.map((r: any) => (
                            <div key={r.code} className="truncate text-xs">{r.code} - {r.description}</div>
                          ))}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            {allOccRules.map((r: any) => (
                              <span key={r.code} className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + (r.severity === 'Leve' ? 'bg-blue-500/10 text-blue-400' : r.severity === 'Media' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-400')}>
                                {r.severity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {allOccRules.map((r: any) => <div key={r.code} className="text-xs">{r.measure}</div>)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExport(o); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                            title="Imprimir / Exportar PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>{/* fim div rotação */}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="glass-modal w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 rounded-t-3xl sm:rounded-2xl safe-area-bottom">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 sticky top-0 bg-white z-10 safe-area-top">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                {editingOccurrence ? 'Editar Ocorrência' : 'Nova Ocorrência'}
              </h2>
              <button 
                onClick={() => { setIsModalOpen(false); setIsGuardianListOpen(false); }}
                className="w-10 h-10 flex items-center justify-center text-slate-500 active:text-slate-800 transition rounded-xl active:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 pb-6 sm:pb-5">
              <div className="max-w-md mx-auto space-y-4 sm:space-y-5">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Aluno(s) *</label>
                    <SearchableSelect
                      options={students.filter(s => !selectedStudents.includes(s.id)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(s => ({ value: s.id, label: s.name + ' - ' + s.class + ' (' + s.shift + ')' }))}
                      value=""
                      onChange={(val) => {
                        if (val && !selectedStudents.includes(val)) {
                          setSelectedStudents(prev => [...prev, val]);
                        }
                      }}
                      placeholder="Adicionar aluno(s)"
                    />
                    {selectedStudents.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedStudents.map(id => {
                          const s = students.find(x => x.id === id);
                          return (
                            <div key={id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm flex items-center gap-1 border border-blue-200">
                               <span>{s?.name}{s?.class ? <span className="font-normal opacity-75"> - {s.class}</span> : ''}</span>
                               <button type="button" onClick={() => setSelectedStudents(prev => prev.filter(x => x !== id))} className="text-blue-500 hover:text-blue-800 ml-1 translate-y-px">
                                  <X className="w-3 h-3 border border-transparent rounded hover:border-blue-400 bg-white bg-opacity-0 hover:bg-opacity-50 transition" />
                               </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsStudentModalOpen(true)}
                    className="bg-blue-600 active:bg-blue-700 text-white w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition shrink-0"
                    title="Cadastrar novo aluno"
                    aria-label="Cadastrar novo aluno"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> DATA
                    </label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> HORA
                    </label>
                    <input 
                      type="text"
                      placeholder="HH:MM:SS"
                      required
                      value={hour}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Permite digitação incremental de hora (aceita parcial)
                        if (/^[\d:]*$/.test(val) && val.length <= 8) {
                          setHour(val);
                        }
                      }}
                      onBlur={() => {
                        // Completa formato se necessário
                        if (hour && /^\d{2}:\d{2}$/.test(hour)) {
                          setHour(hour + ':00');
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> LOCAL
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
                    >
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Ocorrência (Artigo) *</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      placeholder="Busque por 'boné', 'celular', etc..."
                      value={ruleSearch}
                      onChange={(e) => setRuleSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                  </div>
                  
                  {ruleSearch && (editingOccurrence ? selectedRules.length === 0 : true) && (
                    <div className="bg-white border border-slate-200 rounded-lg max-h-40 overflow-y-auto mt-1 mb-3">
                      {matchedRules.filter(r => !selectedRules.includes(r.code.toString())).map(r => (
                        <div 
                          key={r.code}
                          onClick={() => { 
                             if (editingOccurrence) {
                               setSelectedRules([r.code.toString()]); 
                             } else {
                               setSelectedRules(prev => [...prev, r.code.toString()]);
                             }
                             setRuleSearch(''); 
                          }}
                          className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-200/50 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-slate-800 text-sm font-medium">Cód. {r.code}</span>
                            <span className={'text-xs px-2 py-0.5 rounded ' + (r.severity === 'Leve' ? 'bg-blue-500/20 text-blue-400' : r.severity === 'Media' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-red-400')}>{r.severity}</span>
                          </div>
                          <p className="text-slate-500 text-xs mt-1">{r.description}</p>
                        </div>
                      ))}
                      {matchedRules.filter(r => !selectedRules.includes(r.code.toString())).length === 0 && (
                        <div className="p-3 text-sm text-slate-500">Nenhuma infração encontrada.</div>
                      )}
                    </div>
                  )}
                  
                  {selectedRules.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {selectedRules.map(ruleCode => {
                        const r = rules.find(x => x.code.toString() === ruleCode);
                        if (!r) return null;
                        
                        const escalation = selectedStudents.length > 0
                          ? getEscalationStatus(selectedStudents[0], r.code, editingOccurrence ?? undefined)
                          : { isEscalated: false, reason: '', measure: r.measure, severity: r.severity };

                        const isPanelOpen = !!measurePanelOpen[ruleCode];
                        // Para infrações graves, usa graveMeasureType em vez da medida padrão
                        const activeMeasure = measureOverride ?? (escalation.severity === 'Grave' ? graveMeasureType : escalation.measure);
                        const isOverriding = !!measureOverride || (escalation.severity === 'Grave' && graveMeasureType !== 'Suspensão Escolar');

                        const ALTERNATIVE_MEASURES = [
                          { label: 'Atividade Pedagógica', color: 'emerald' },
                          { label: 'Retenção do Recreio', color: 'amber' },
                          { label: 'Suspensão', color: 'red' },
                        ] as const;

                        return (
                          <div key={ruleCode} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            {/* Cabeçalho do card */}
                            <div className="p-4 relative">
                              <button
                                type="button"
                                onClick={() => setSelectedRules(prev => prev.filter(x => x !== ruleCode))}
                                className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <p className="text-slate-800 text-sm font-medium pr-6">Cód. {r.code} — {r.description}</p>

                              {escalation.isEscalated && selectedStudents.length === 1 && (
                                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-[11px] text-orange-700 font-bold flex items-center gap-1.5">
                                  <span>⚠</span> ATENÇÃO: {escalation.reason}!
                                </div>
                              )}

                              {/* Medida ativa em destaque */}
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className={'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border-2 ' + (isOverriding ? 'bg-violet-50 border-violet-400 text-violet-700' : escalation.severity === 'Grave' ? 'bg-red-50 border-red-400 text-red-700' : escalation.severity === 'Media' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-blue-50 border-blue-400 text-blue-700')}>
                                    {isOverriding && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Alterada</span>
                                    )}
                                    {activeMeasure}
                                  </div>
                                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-lg">
                                    {Math.abs(r.points).toFixed(2)} pts
                                  </span>
                                  {isOverriding && (
                                    <button
                                      type="button"
                                      onClick={() => { setMeasureOverride(null); setMeasurePanelOpen(p => ({ ...p, [ruleCode]: false })); }}
                                      className="text-[11px] text-slate-400 hover:text-slate-600 underline transition-colors"
                                    >
                                      restaurar recomendação
                                    </button>
                                  )}
                                </div>

                                {/* Botão outras medidas */}
                                <button
                                  type="button"
                                  onClick={() => setMeasurePanelOpen(p => ({ ...p, [ruleCode]: !p[ruleCode] }))}
                                  className={'flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ' + (isPanelOpen ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700')}
                                >
                                  Outras medidas
                                  <ChevronDown className={'w-3 h-3 transition-transform ' + (isPanelOpen ? 'rotate-180' : '')} />
                                </button>
                              </div>
                            </div>

                            {/* Painel colapsável — multi-select de medidas */}
                            {isPanelOpen && (
                              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-150">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Medidas aplicadas (pode selecionar várias)</p>
                                <div className="space-y-1.5">
                                  {AVAILABLE_MEASURES.map((label) => {
                                    const isChecked = selectedMeasures.includes(label);
                                    const isRecommended = label === escalation.measure;
                                    return (
                                      <label
                                        key={label}
                                        className={'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium ' + (isChecked ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() =>
                                            setSelectedMeasures(prev =>
                                              prev.includes(label)
                                                ? prev.filter(m => m !== label)
                                                : [...prev, label]
                                            )
                                          }
                                          className="w-3.5 h-3.5 accent-blue-600"
                                        />
                                        {label}
                                        {isRecommended && (
                                          <span className="ml-auto text-[9px] font-bold text-blue-500 uppercase tracking-wider">Recomendada</span>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {selectedRules.length > 1 && (
                         <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-3">
                           <span className="text-sm font-bold text-slate-700">Total de Pontos (somados):</span>
                           <span className="text-sm font-bold text-red-600">
                             {Math.abs(selectedRules.reduce((sum, code) => sum + (rules.find(r => r.code === parseInt(code, 10))?.points || 0), 0)).toFixed(1)} pts
                           </span>
                         </div>
                      )}
                    </div>
                  )}

                  {selectedRules.some(c => rules.find(x => x.code.toString() === c)?.severity === 'Grave') && (() => {
                    const worstRule = selectedRules.map(c => rules.find(r => r.code.toString() === c)).filter(Boolean).sort((a,b) => (a!.points - b!.points))[0];
                    if (worstRule!.severity !== 'Grave') return null;
                    return (
                     <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-2 mb-3">
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-600">
                              Gravidade: Grave
                          </span>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
                          <div>
                            <label className="block text-[11px] font-bold text-blue-700 uppercase mb-2 tracking-wider">Tipo de Resposta Educativa (Grave)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                'Parecer do gestor',
                                'Ação Educativa',
                                'Suspensão de Recreação',
                                'Suspensão Escolar',
                                'Transferência Educativa'
                              ].map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    if (type === 'Transferência Educativa' && !confirm('⚠️ A Transferência Educativa é uma medida extrema que exige aprova��ão do Conselho de Ensino Disciplinar. Deseja prosseguir com a solicitação?')) return;
                                    setGraveMeasureType(type as any);
                                  }}
                                  className={'px-3 py-2 rounded-lg text-xs font-medium border transition-all ' + (graveMeasureType === type ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50')}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          {(graveMeasureType === 'Suspensão Escolar' || graveMeasureType === 'Suspensão de Recreação') && (
                            <div className="animate-in fade-in slide-in-from-top-1">
                              <label className="block text-[10px] font-bold text-blue-700 uppercase mb-2">Duração (Dias Letivos)</label>
                              <div className="flex items-center gap-4">
                                <input 
                                  type="range" 
                                  min="1" 
                                  max="3" 
                                  value={durationDays}
                                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm font-bold text-blue-700 w-12 text-center bg-white px-2 py-1 rounded border border-blue-200">
                                  {durationDays} {durationDays === 1 ? 'dia' : 'dias'}
                                </span>
                              </div>
                            </div>
                          )}

                          {graveMeasureType === 'Ação Educativa' && (
                            <div className="p-2 bg-white/50 rounded border border-blue-100 text-[10px] text-blue-600 italic">
                              * Envolve reparação de dano, ação social ou preservação ambiental.
                            </div>
                          )}

                          {graveMeasureType === 'Transferência Educativa' && (
                            <div className="p-2 bg-red-100 rounded border border-red-200 text-[10px] text-red-700 font-bold">
                              ⚠️ BLOQUEADO: Exige deliberação do Conselho de Ensino Disciplinar.
                            </div>
                          )}
                        </div>
                     </div>
                    )
                  })()}
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Localizado por</label>
                    <SearchableSelect
                      options={staffOptions}
                      value={locatedBy}
                      onChange={setLocatedBy}
                      placeholder="Quem localizou a infração?"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsStaffModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition shrink-0"
                    title="Cadastrar novo membro da equipe"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Professor Vinculado</label>
                  <SearchableSelect
                    options={professorOptions}
                    value={linkedProfessor}
                    onChange={setLinkedProfessor}
                    placeholder="Professor da aula ou turma?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Registrado por</label>
                  <input 
                    type="text" 
                    value={registeredBy}
                    onChange={(e) => setRegisteredBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      ATA
                      <button
                        type="button"
                        onClick={handleGenerateAta}
                        disabled={!selectedStudents.length || !date || !hour || !location || !selectedRules.length}
                        className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-all disabled:opacity-50"
                      >
                        <FileText size={10} />
                        Gerar Ata Automática
                      </button>
                      <button
                        type="button"
                        onClick={handleImproveObservations}
                        disabled={isImproving || (!observations.trim() && selectedRules.length === 0)}
                        className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        <Sparkles size={10} className={isImproving ? "animate-spin" : ""} />
                        {isImproving ? "Aprimorando..." : "Aprimorar com IA"}
                      </button>
                      <button
                        type="button"
                        onClick={handleGetSuggestions}
                        disabled={!selectedRules.length || !selectedStudents.length}
                        className="flex items-center gap-1 text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full hover:bg-violet-100 transition-all disabled:opacity-50 border border-violet-200"
                      >
                        <Sparkles size={10} />
                        Sugestão do Regimento
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Ajuste o tamanho se necessário</span>
                  </label>
                  {/* Campo ATA com negrito em tempo real: **texto** → bold */}
                  <AtaEditor value={observations} onChange={setObservations} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-700 uppercase mb-2 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Fatores Atenuantes
                    </label>
                    <div className="space-y-1.5">
                      {[
                        'Primeira infração',
                        'Aluno novato',
                        'Arrependimento eficaz',
                        'Bom comportamento anterior',
                        'Colaboração imediata'
                      ].map(factor => (
                        <label key={factor} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={attenuatingFactors.includes(factor)}
                            onChange={(e) => {
                              if (e.target.checked) setAttenuatingFactors([...attenuatingFactors, factor]);
                              else setAttenuatingFactors(attenuatingFactors.filter(f => f !== factor));
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-slate-600 group-hover:text-emerald-700 transition">{factor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-red-700 uppercase mb-2 tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Fatores Agravantes
                    </label>
                    <div className="space-y-1.5">
                      {[
                        'Premeditação',
                        'Chefia de turma/grêmio',
                        'Recidiva específica',
                        'Praticado em público',
                        'Coação de colegas'
                      ].map(factor => (
                        <label key={factor} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={aggravatingFactors.includes(factor)}
                            onChange={(e) => {
                              if (e.target.checked) setAggravatingFactors([...aggravatingFactors, factor]);
                              else setAggravatingFactors(aggravatingFactors.filter(f => f !== factor));
                            }}
                            className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-slate-600 group-hover:text-red-700 transition">{factor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">FOTOS/VÍDEOS (PROVAS)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {videoUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          {url.startsWith('blob:') || url.includes('video') || url.endsWith('.mp4') ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                              <Video className="w-8 h-8 text-white/50" />
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} className="w-full h-full object-cover" alt="Anexo" />
                          )}
                          <button 
                            type="button"
                            onClick={() => setVideoUrls(videoUrls.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-lg"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-100 hover:border-blue-300 transition-all text-slate-400 hover:text-blue-500 cursor-pointer relative group">
                        {uploadingVideo && (
                          <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-medium text-blue-600">Enviando...</span>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          disabled={uploadingVideo}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || selectedStudents.length === 0) return;
                            setUploadingVideo(true);
                            console.log("[v0] Iniciando upload de vídeo/foto:", file.name);
                            const url = await uploadFile(file, selectedStudents[0]);
                            console.log("[v0] Upload concluído, URL:", url);
                            if (url) {
                              setVideoUrls(prev => [...prev, url]);
                              console.log("[v0] Vídeo/foto adicionado com sucesso");
                            } else {
                              alert('Falha ao fazer upload do arquivo. Verifique o console para mais detalhes.');
                            }
                            setUploadingVideo(false);
                            e.target.value = '';
                          }}
                        />
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-center px-1">Adicionar Foto/Vídeo</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">DOCUMENTOS ASSINADOS</label>
                    <div className="grid grid-cols-2 gap-2">
                      {signedDocUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} className="w-full h-full object-cover" alt="Documento" />
                          <button 
                            type="button"
                            onClick={() => setSignedDocUrls(signedDocUrls.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-lg"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-100 hover:border-blue-300 transition-all text-slate-400 hover:text-blue-500 cursor-pointer relative group">
                        {uploadingDoc && (
                          <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-medium text-blue-600">Enviando...</span>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf,.doc,.docx"
                          className="hidden"
                          disabled={uploadingDoc}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || selectedStudents.length === 0) return;
                            setUploadingDoc(true);
                            console.log("[v0] Iniciando upload de documento:", file.name);
                            const url = await uploadFile(file, selectedStudents[0]);
                            console.log("[v0] Upload concluído, URL:", url);
                            if (url) {
                              setSignedDocUrls(prev => [...prev, url]);
                              console.log("[v0] Documento adicionado com sucesso");
                            } else {
                              alert('Falha ao fazer upload do documento. Verifique o console para mais detalhes.');
                            }
                            setUploadingDoc(false);
                            e.target.value = '';
                          }}
                        />
                        <FileText className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-center px-1">Enviar Documento</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRules.includes('84') && (
                <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 dark:text-amber-200 text-base">
                        Procedimentos Obrigatórios: Infração de Briga
                      </h4>
                      <p className="text-amber-800 dark:text-amber-300/80 mt-1 text-sm leading-relaxed">
                        Conforme o regimento, para casos de briga ou luta corporal, os seguintes passos são <strong>imprescindíveis</strong>:
                      </p>
                      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { label: 'Ficha FICAI', desc: 'Comunicação de Aluno Infrator' },
                          { label: 'Sistema EDUCASEG', desc: 'Registro de Segurança Escolar' },
                          { label: 'Boletim de Ocorrência', desc: 'Registro na Delegacia (B.O.)' },
                          { label: 'Acionar os Pais', desc: 'Contato imediato e registro' }
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg border border-amber-200/50 dark:border-amber-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-xs text-amber-900 dark:text-amber-100 font-bold">{item.label}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-amber-700 dark:text-amber-400 mt-3 text-[11px] italic">
                        * Anexe os protocolos e registros de contato nos campos de documentos acima.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between sticky bottom-0 border-t border-slate-200 p-5 -mx-5 -mb-5 mt-4 bg-white">
                <div className="relative">
                  <button
                    type="button"
                    disabled={selectedStudents.length === 0}
                    onClick={() => setIsGuardianListOpen(!isGuardianListOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition text-xs font-semibold disabled:opacity-50"
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-4 h-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Falar com responsável
                  </button>

                  {isGuardianListOpen && selectedStudents.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-[60]">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <h4 className="text-sm font-bold text-slate-800">Responsáveis</h4>
                        {selectedStudents.length === 1 && (
                          <button 
                            type="button"
                            onClick={() => { setIsGuardianListOpen(false); setIsAddGuardianModalOpen(true); }}
                            className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
                            title="Cadastrar responsável"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {selectedStudents.map(studentId => {
                          const student = students.find(s => s.id === studentId);
                          if (!student) return null;
                          return (
                             <div key={student.id} className="mb-2">
                               {selectedStudents.length > 1 && (
                                 <p className="text-xs font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">{student.name}</p>
                               )}
                               <div className="space-y-1 mt-1">
                                  {student.contacts?.length ? (
                                    student.contacts.map((c, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleWhatsAppRedirect(c.phone, student.name, student.id)}
                                        className="w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-emerald-50 rounded-lg group transition border border-transparent hover:border-emerald-200 text-left"
                                      >
                                        <div>
                                          <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">{c.name || 'Responsável'}</p>
                                          <p className="text-[10px] text-slate-500">{c.phone}</p>
                                        </div>
                                        <Phone className="w-3 h-3 text-emerald-500" />
                                      </button>
                                    ))
                                  ) : (
                                    <p className="text-[10px] text-slate-500 italic pb-2">Sem responsáveis cadastrados.</p>
                                  )}
                               </div>
                             </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {editingOccurrence && (
                    <button 
                      type="button" 
                      onClick={(e) => { setIsModalOpen(false); handleArchive(e, editingOccurrence); }}
                      className="px-3 py-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" /> Arquivar
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setIsGuardianListOpen(false); }}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={selectedStudents.length === 0 || selectedRules.length === 0}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingOccurrence ? 'Salvar Alterações' : 'Confirmar Registro'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isStudentModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsStudentModalOpen(false); }}>
          <div className="glass-modal max-w-md w-full flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                Cadastrar Aluno Manualmente
              </h2>
              <button 
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleQuickAddStudent} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: João da Silva..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Turma *</label>
                  <ClassSelector required value={newClassName} onChange={setNewClassName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Turno *</label>
                  <select 
                    required
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-600">Contatos dos Responsáveis</label>
                {newContacts.map((contact, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContact(index, 'name', e.target.value)}
                      placeholder="Responsável"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      ref={(el) => { phoneRefs.current[index] = el; }}
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                      placeholder="Telefone"
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {index === 0 ? (
                      <button
                        type="button"
                        onClick={handleAddContact}
                        className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shrink-0 flex items-center justify-center"
                        title="Adicionar mais um contato"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(index)}
                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shrink-0 flex items-center justify-center"
                        title="Remover contato"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-5 pt-5">
                <button 
                  type="button" 
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white transition font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!newName || !newClassName}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Add Staff */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsStaffModalOpen(false); }}>
          <div className="glass-modal max-w-sm w-full p-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Cadastrar Membro da Equipe</h3>
                <button onClick={() => setIsStaffModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                   <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleQuickAddStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
                      <select 
                        value={newStaffRole} 
                        onChange={e => setNewStaffRole(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                         <option value="Monitor">Monitor</option>
                         <option value="Professor">Professor</option>
                         <option value="Coord.">Coord.</option>
                         <option value="Diretora">Diretora</option>
                         <option value="G1">G1</option>
                         <option value="G2">G2</option>
                      </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                      <input 
                         type="text" 
                         required 
                         autoFocus
                         value={newStaffName} 
                         onChange={e => setNewStaffName(e.target.value)}
                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                   </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm mt-2">
                   Confirmar Cadastro
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Quick Add Professor */}
      {isStaffModalOpenProf && (
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsStaffModalOpenProf(false); }}>
          <div className="glass-modal max-w-sm w-full p-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Cadastrar Professor</h3>
                <button onClick={() => setIsStaffModalOpenProf(false)} className="text-slate-400 hover:text-slate-600">
                   <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleQuickAddStaffProf} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
                      <select 
                        disabled
                        value="Professor" 
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none text-slate-500 cursor-not-allowed"
                      >
                         <option value="Professor">Professor</option>
                      </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                      <input 
                         type="text" 
                         required 
                         autoFocus
                         value={newStaffName} 
                         onChange={e => setNewStaffName(e.target.value)}
                         className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                   </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm mt-2">
                   Confirmar Cadastro
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Visualização de Ocorrência — largo com abas */}
      {_vo && (() => {
        const voStudents = _vo.studentIds && _vo.studentIds.length > 0
          ? students.filter(s => _vo.studentIds?.includes(s.id))
          : [students.find(s => s.id === _vo.studentId)].filter((s): s is Student => Boolean(s));
        const voRules = (_voAllRules.length > 0 ? _voAllRules : [_voRule]).filter(Boolean);
        const hasVideos = (_vo.videoUrls && _vo.videoUrls.length > 0) || (!_vo.videoUrls && (_vo as any).videoUrl);
        const hasDocs   = (_vo.signedDocUrls && _vo.signedDocUrls.length > 0) || (!_vo.signedDocUrls && (_vo as any).signedDocUrl);
        const videoList = (_vo.videoUrls || [(_vo as any).videoUrl]).filter(Boolean) as string[];
        const docList   = (_vo.signedDocUrls || [(_vo as any).signedDocUrl]).filter(Boolean) as string[];

        const totalContacts = voStudents.reduce((sum, s) => sum + (s.contacts?.length ?? 0), 0);

        type TabDef = { id: 'status' | 'detalhes' | 'documentos' | 'responsaveis'; label: string; count?: number };
        const tabs: TabDef[] = [
          { id: 'status',       label: 'Status' },
          { id: 'detalhes',     label: 'Detalhes' },
          { id: 'responsaveis', label: 'Responsaveis', count: totalContacts || undefined },
          { id: 'documentos',   label: 'Documentos', count: (docList.length + videoList.length) || undefined },
        ];

        return (
          <div
            className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onMouseDown={(e) => { if (e.target === e.currentTarget) { setViewOccurrence(null); setIsGuardianListOpen(false); setIsPrintPanelOpen(false); setShowPrintBanner(false); } }}
          >
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">

              {/* ── Cabeçalho ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Ocorrencia</p>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight truncate">
                      {voStudents.map(s => s.name).join(', ')}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatDate(_vo.date)}{_vo.hour ? ` · ${_vo.hour}` : ''} · {voStudents[0]?.class || '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setViewOccurrence(null); setIsGuardianListOpen(false); setIsPrintPanelOpen(false); setShowPrintBanner(false); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Tabs ── */}
              <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setVoTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                      voTab === tab.id
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                    {tab.count ? (
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* ── Corpo com scroll ── */}
              <div className="flex-1 overflow-y-auto">

                {/* Tab: Status */}
                {voTab === 'status' && (
                  <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-4">Progresso da Ocorrência</p>
                      <div className="flex items-center gap-2 mb-8 relative z-10">
                        {['iniciada', 'em tratamento', 'resolvida'].map((step, idx) => {
                          const statusList = ['iniciada', 'em tratamento', 'resolvida'];
                          const currentIdx = statusList.indexOf(_vo.status || 'iniciada');
                          const isActive = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={step} className="flex-1 flex flex-col items-center relative">
                              {idx > 0 && (
                                <div className={`absolute top-4 left-[-50%] w-full h-1 -z-10 transition-colors duration-500 ${isActive ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                              )}
                              <button 
                                onClick={() => {
                                  updateOccurrence(_vo.id, { status: step as any });
                                  setViewOccurrence({ ..._vo, status: step as any });
                                }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 shadow-sm ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 hover:border-blue-400'}`}
                              >
                                {isActive ? <Check className="w-5 h-5" /> : (idx + 1)}
                              </button>
                              <span className={`text-[10px] mt-3 font-bold uppercase tracking-wider transition-colors duration-300 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : (isActive ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400')}`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Solução / Ação Tomada</label>
                        <textarea
                          value={_vo.solucao_acao || ''}
                          onChange={(e) => setViewOccurrence({..._vo, solucao_acao: e.target.value})}
                          onBlur={(e) => updateOccurrence(_vo.id, { solucao_acao: e.target.value })}
                          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Descreva a ação tomada ou a solução para esta ocorrência..."
                        />
                        <p className="text-xs text-slate-400 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Salvo automaticamente ao sair do campo.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Detalhes */}
                {voTab === 'detalhes' && (
                  <div className="p-6 space-y-5">

                    {/* Grid de metadados */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Data',       value: formatDate(_vo.date) },
                        { label: 'Hora',       value: _vo.hour || '—' },
                        { label: 'Local',      value: _vo.location || '—' },
                        { label: 'Localizado por', value: _vo.locatedBy || '—' },
                        { label: 'Professor Vinculado', value: _vo.linkedProfessor || '—' },
                        { label: 'Registrado por', value: _vo.registeredBy || 'Sistema' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Alunos envolvidos */}
                    {voStudents.length > 1 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Alunos Envolvidos</p>
                        <div className="flex flex-wrap gap-2">
                          {voStudents.map(s => (
                            <span key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 font-medium">
                              <span className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                {s.name.charAt(0)}
                              </span>
                              {s.name} <span className="text-slate-400 font-normal">· {s.class}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Infracoes */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                        {voRules.length > 1 ? 'Infracoes' : 'Infracao'}
                      </p>
                      <div className="space-y-3">
                        {voRules.map((r: any) => (
                          <div key={r.code} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Art. {r.code}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${r.severity === 'Leve' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : r.severity === 'Media' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                                  {r.severity}
                                </span>
                                <span className="text-xs font-bold text-red-500 dark:text-red-400">-{Math.abs(r.points || 0)} pts</span>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.description}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Medida: <span className="font-medium text-slate-600 dark:text-slate-300">{r.measure}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ATA */}
                    {_vo.observations && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">ATA / Observacoes</p>
                        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{_vo.observations}</p>
                        </div>
                      </div>
                    )}

                    {/* Responsaveis */}
                    {_voStudent?.contacts && _voStudent.contacts.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Responsaveis</p>
                        <div className="space-y-2">
                          {_voStudent.contacts.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.name || 'Responsavel'}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{c.phone}</p>
                              </div>
                              <button
                                onClick={() => handleWhatsAppRedirect(c.phone, _voStudent.name, _voStudent.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg transition text-xs font-semibold"
                              >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                WhatsApp
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Responsaveis */}
                {voTab === 'responsaveis' && (
                  <div className="p-6 space-y-4">
                    {voStudents.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Nenhum aluno vinculado.</p>
                    ) : voStudents.map(student => {
                      const contacts = student.contacts ?? [];
                      return (
                        <div key={student.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          {/* Cabeçalho do aluno */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{student.name}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{student.class || '—'}</p>
                            </div>
                          </div>

                          {/* Lista de contatos */}
                          {contacts.length === 0 ? (
                            <div className="px-4 py-5 flex items-center gap-3 text-slate-400 dark:text-slate-500">
                              <Users className="w-4 h-4 shrink-0" />
                              <p className="text-sm">Nenhum responsavel cadastrado para este aluno.</p>
                            </div>
                          ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
                              {contacts.map((c, idx) => (
                                <li key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                      <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{c.name || '—'}</p>
                                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{c.phone || 'Sem telefone'}</p>
                                    </div>
                                  </div>
                                  {c.phone && (
                                    <button
                                      type="button"
                                      onClick={() => handleWhatsAppRedirect(c.phone, student.name, student.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors shrink-0"
                                    >
                                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                      </svg>
                                      WhatsApp
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab: Documentos (evidencias + docs assinados unificados) */}
                {voTab === 'documentos' && (
                  <div className="p-6 space-y-6">

                    {/* ── Evidencias (fotos/videos) ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Evidencias</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Fotos e videos da ocorrencia</p>
                        </div>
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer ${voUploadingEv ? 'opacity-60 pointer-events-none' : ''}`}>
                          {voUploadingEv ? (
                            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )}
                          {voUploadingEv ? 'Enviando...' : 'Adicionar'}
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            disabled={voUploadingEv}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setVoUploadingEv(true);
                              const studentId = _vo.studentIds?.[0] ?? _vo.studentId ?? '';
                              const url = await uploadFile(file, studentId);
                              if (url) {
                                updateOccurrence(_vo.id, { videoUrls: [...videoList, url] });
                                setViewOccurrence({ ..._vo, videoUrls: [...videoList, url] });
                              }
                              setVoUploadingEv(false);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {videoList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600">
                          <Camera className="w-7 h-7 mb-2 opacity-40" />
                          <p className="text-xs font-medium">Nenhuma evidencia anexada</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {videoList.map((url, index) => {
                            const isImage = /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i.test(url);
                            return (
                              <div key={index} className="aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition">
                                {isImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={url} className="w-full h-full object-cover" onClick={() => window.open(url, '_blank')} alt={`Evidencia ${index + 1}`} />
                                ) : (
                                  <video src={url} className="w-full h-full object-cover" controls />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-700" />

                    {/* ── Documentos Assinados ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Documentos Assinados</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">Termos, protocolos e registros</p>
                        </div>
                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer ${voUploadingDoc ? 'opacity-60 pointer-events-none' : ''}`}>
                          {voUploadingDoc ? (
                            <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Paperclip className="w-3.5 h-3.5" />
                          )}
                          {voUploadingDoc ? 'Enviando...' : 'Adicionar'}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            disabled={voUploadingDoc}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setVoUploadingDoc(true);
                              const studentId = _vo.studentIds?.[0] ?? _vo.studentId ?? '';
                              const url = await uploadFile(file, studentId);
                              if (url) {
                                updateOccurrence(_vo.id, { signedDocUrls: [...docList, url] });
                                setViewOccurrence({ ..._vo, signedDocUrls: [...docList, url] });
                              }
                              setVoUploadingDoc(false);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {docList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600">
                          <FileText className="w-7 h-7 mb-2 opacity-40" />
                          <p className="text-xs font-medium">Nenhum documento assinado</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {docList.map((url, index) => (
                            <div key={index} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} className="w-full h-full object-cover" onClick={() => window.open(url, '_blank')} alt={`Documento ${index + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/60 shrink-0">
                {isPrintPanelOpen && !showPrintBanner && (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-3">
                    <span className="text-xs text-slate-500 font-medium mr-auto">Exportar como:</span>
                    <button onClick={() => { handleExport(_vo); setIsPrintPanelOpen(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition text-xs font-semibold">
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => { handleExportDocx(_vo); setIsPrintPanelOpen(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition text-xs font-semibold">
                      <FileText className="w-3.5 h-3.5" /> DOC
                    </button>
                  </div>
                )}
                
                {showPrintBanner && (
                  <div className="flex items-center flex-wrap gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl mb-3 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm mr-auto">
                      <AlertTriangle className="w-4 h-4" />
                      Ocorrência ainda não foi resolvida
                    </div>
                    <button onClick={() => { setShowPrintBanner(false); setIsPrintPanelOpen(true); }} className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition text-xs font-semibold">
                      Só imprimir
                    </button>
                    <button onClick={() => { setShowPrintBanner(false); setShowResolucaoModal(true); setResolucaoText(_vo.solucao_acao || ''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow transition text-xs font-bold">
                      <Check className="w-3.5 h-3.5" /> Resolver e Imprimir
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {currentUserRole !== 'GUEST' && (
                    <button
                      onClick={(e) => { setViewOccurrence(null); setIsGuardianListOpen(false); setIsPrintPanelOpen(false); setShowPrintBanner(false); openEditModal(e, _vo); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition text-sm font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (_vo.status !== 'resolvida') {
                        setIsPrintPanelOpen(false);
                        setShowPrintBanner(v => !v);
                      } else {
                        setShowPrintBanner(false);
                        setIsPrintPanelOpen(v => !v);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition text-sm font-semibold border ${isPrintPanelOpen || showPrintBanner ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir
                  </button>
                  {currentUserRole !== 'GUEST' && (
                    <button
                      onClick={(e) => { setViewOccurrence(null); handleArchive(e, _vo.id); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 transition text-sm font-semibold"
                    >
                      <Archive className="w-3.5 h-3.5" /> Arquivar
                    </button>
                  )}
                  <button
                    onClick={() => { setViewOccurrence(null); setIsGuardianListOpen(false); setIsPrintPanelOpen(false); setShowPrintBanner(false); }}
                    className="ml-auto px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition text-sm font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Resolução (Resolver e Imprimir) */}
      {showResolucaoModal && viewOccurrence && (
        <div className="fixed inset-0 z-[9995] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowResolucaoModal(false); }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-500" /> Resolver Ocorrência
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Descreva a solução ou ação tomada para finalizar este registro antes de imprimir.
            </p>
            <textarea 
              value={resolucaoText}
              onChange={(e) => setResolucaoText(e.target.value)}
              className="w-full min-h-[120px] p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Digite a resolução (mínimo de 20 caracteres)..."
            />
            <div className="flex justify-between items-center text-xs">
              <span className={`${resolucaoText.length < 20 ? 'text-rose-500' : 'text-emerald-500'} font-medium`}>
                {resolucaoText.length} / 20 caracteres
              </span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowResolucaoModal(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleResolver}
                disabled={resolucaoText.length < 20 || resolucaoSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-50"
              >
                {resolucaoSaving ? 'Salvando...' : 'Confirmar e Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Quick Guardian */}
      {isAddGuardianModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9992] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsAddGuardianModalOpen(false); }}>
          <div className="glass-modal max-w-sm w-full p-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Adicionar Responsável</h3>
                <button onClick={() => setIsAddGuardianModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                   <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleAddQuickGuardian} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Responsável</label>
                   <input 
                      type="text" 
                      required 
                      autoFocus
                      value={newGuardianName} 
                      onChange={e => setNewGuardianName(e.target.value)}
                      placeholder="Ex: Maria Souza"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone/WhatsApp</label>
                  <input 
                    ref={guardianPhoneRef}
                    type="tel" 
                    required 
                    value={newGuardianPhone} 
                    onChange={e => handleQuickGuardianPhoneChange(e.target.value)}
                    placeholder="(65) 9..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm mt-2">
                   Confirmar Cadastro
                </button>
             </form>
          </div>
        </div>
      )}
      {/* Modal de alerta pós-salvar */}
      {postSaveAlert && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150" onMouseDown={(e) => { if (e.target === e.currentTarget) setPostSaveAlert(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className={'px-5 py-4 ' + (postSaveAlert.isViolence ? 'bg-red-600' : 'bg-blue-600')}>
              <p className="text-white font-bold text-sm">
                {postSaveAlert.isViolence ? 'Atencao — Caso de Violencia' : 'Ocorrencia Registrada'}
              </p>
              <p className="text-white/80 text-xs mt-0.5">
                {postSaveAlert.occurrenceNum} — {postSaveAlert.studentName}
              </p>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-700 font-medium">
                As seguintes acoes sao necessarias:
              </p>
              <ul className="space-y-2">
                {postSaveAlert.checklistItems.map(item => (
                  <li key={item.id} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className={'mt-0.5 w-2 h-2 rounded-full shrink-0 ' + (postSaveAlert.isViolence && ['ficha_ficai','ficha_sigeduca','boletim'].includes(item.id) ? 'bg-red-500' : 'bg-blue-500')} />
                    {item.label}
                  </li>
                ))}
              </ul>
              {postSaveAlert.isViolence && (
                <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                  Por se tratar de caso de violencia, briga ou bullying, e obrigatorio registrar Ficha FICAI, Ficha SIGEDUCA e Boletim de Ocorrencia.
                </div>
              )}
            </div>

            {/* Footer — pergunta de cumprimento */}
            <div className="px-5 pb-5 space-y-2">
              <p className="text-xs text-slate-500 font-medium text-center">Esta medida já foi cumprida?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Cumprida: marca como resolved sem entrar na To-Do
                    updateOccurrence(postSaveAlert.occurrenceId, {
                      resolved: true,
                      resolvedAt: new Date().toISOString(),
                    });
                    setPostSaveAlert(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
                >
                  Sim, já foi
                </button>
                <button
                  onClick={() => {
                    // Não cumprida: entra na To-Do
                    const task: OccurrenceTask = {
                      occurrenceId: postSaveAlert.occurrenceId,
                      occurrenceNum: postSaveAlert.occurrenceNum,
                      studentName: postSaveAlert.studentName,
                      items: postSaveAlert.checklistItems,
                      createdAt: new Date().toISOString(),
                      ataNumber: postSaveAlert.ataNumber,
                    };
                    const updated = addOccurrenceTask(userId, task);
                    setChecklistTasks(updated);
                    setPostSaveAlert(null);
                  }}
                  className={'flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ' + (postSaveAlert.isViolence ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700')}
                >
                  Nao, adicionar pendencias
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklist flutuante persistente */}
      <OccurrenceChecklist
        userId={userId}
        tasks={checklistTasks}
        onUpdate={setChecklistTasks}
      />

    </AppShell>

  );
}

export default function RegistroDisciplinar() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div></AppShell>}>
      <RegistroDisciplinarContent />
    </Suspense>
  );
}
