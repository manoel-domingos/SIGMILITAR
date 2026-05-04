'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { Search, Plus, X, Edit2, Archive, Video, FileText, Camera, Clock, MapPin, UserPlus, Trash2, MessageSquare, Phone, Printer, Sparkles, AlertTriangle, ChevronDown } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import { Occurrence, StaffMember, Student, AVAILABLE_MEASURES } from '@/lib/data';
import { getSchoolHeaderHTML, getSchoolFooterHTML, SCHOOL_HEADER_CSS, markdownBoldToHtml } from '@/lib/print-header';
import { getLocalDateString, getLocalTimeString, formatDate, formatPhoneForWhatsApp } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { streamAI } from '@/components/AIChat';
import OccurrenceChecklist, {
  OccurrenceTask,
  ChecklistItem,
  addOccurrenceTask,
  loadChecklists,
  autocompleteWhatsapp,
} from '@/components/OccurrenceChecklist';

function RegistroDisciplinarContent() {
  const { 
    students, occurrences, rules, staffMembers, user, isGuest, currentUserRole,
    addOccurrence, updateOccurrence, archiveOccurrence, checkRecidivism, getEscalationStatus,
    addStudent, updateStudent, addStaffMember, uploadFile
  } = useAppContext();
  const searchParams = useSearchParams();

  const paramMonth = searchParams.get('month');
  const paramClass = searchParams.get('class');
  const paramSeverity = searchParams.get('severity');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(paramMonth && paramMonth !== 'Selecionar...' ? paramMonth : 'Todos os meses');
  const [selectedClass, setSelectedClass] = useState(paramClass && paramClass !== 'Todas' ? paramClass : 'Todas as turmas');
  const [selectedSeverity, setSelectedSeverity] = useState(paramSeverity || 'Todas');

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const classes = Array.from(new Set(students.map(s => s.class))).sort();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isGuardianListOpen, setIsGuardianListOpen] = useState(false);
  const [isPrintPanelOpen, setIsPrintPanelOpen] = useState(false);
  const [isAddGuardianModalOpen, setIsAddGuardianModalOpen] = useState(false);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [guardianIgnoredWarning, setGuardianIgnoredWarning] = useState(false);
  const guardianPhoneRef = useRef<HTMLInputElement>(null);
  const [viewOccurrence, setViewOccurrence] = useState<Occurrence | null>(null);
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
  const [ataPreviewMode, setAtaPreviewMode] = useState(false);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [signedDocUrls, setSignedDocUrls] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState(1);
  const [attenuatingFactors, setAttenuatingFactors] = useState<string[]>([]);
  const [aggravatingFactors, setAggravatingFactors] = useState<string[]>([]);
  const [graveMeasureType, setGraveMeasureType] = useState<'Suspensão Escolar' | 'Suspensão de Recreação' | 'Ação Educativa' | 'Transferência Educativa'>('Suspensão Escolar');
  const [measureOverride, setMeasureOverride] = useState<string | null>(null);
  const [measurePanelOpen, setMeasurePanelOpen] = useState<Record<string, boolean>>({});
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);
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
      ? `o(a) aluno(a) ${studentNames[0]}`
      : `os alunos ${studentNames.slice(0, -1).join(', ')} e ${studentNames[studentNames.length - 1]}`;
    const verboStr = studentNames.length === 1 ? 'foi encontrado(a)' : 'foram encontrados';

    // Rule info (use first selected rule)
    const rule = rules.find(r => r.code === parseInt(selectedRules[0], 10));
    const ruleCode = rule?.code ?? selectedRules[0];
    const ruleDesc = rule?.description ?? '';

    // Located by
    const locatedByStr = locatedBy.trim() ? ` pelo(a) ${locatedBy.trim()}` : '';

    // Reincidencia (exclui a propria ocorrencia ao editar)
    const isReincidente = selectedStudents.some(id => {
      const ruleCodesNum = selectedRules.map(r => parseInt(r, 10));
      return ruleCodesNum.some(rc => checkRecidivism(id, rc, editingOccurrence ?? undefined));
    });

    // Agravantes / atenuantes
    const agravantesStr = aggravatingFactors.length
      ? ` Verificaram-se os seguintes fatores agravantes: ${aggravatingFactors.join(', ')}.`
      : '';
    const atenuantesStr = attenuatingFactors.length
      ? ` Foram considerados os seguintes fatores atenuantes: ${attenuatingFactors.join(', ')}.`
      : '';
    const reincidenteStr = isReincidente
      ? ' O(A) aluno(a) já possui registro anterior da mesma infração, caracterizando reincidência.'
      : '';

    const registradoPor = registeredBy.trim() || getLoggedUserName();

    const ata = `Aos ${diaNum} dias do mês de ${mesExtenso} do ano de ${year}, às ${hour}, ${alunoStr} ${verboStr} no(a) ${location}${locatedByStr}, incorrendo em infração ao Art. ${ruleCode} do Regimento Interno (${ruleDesc}).${agravantesStr}${atenuantesStr}${reincidenteStr} O presente registro foi lavrado por ${registradoPor}.`;

    setObservations(ata.trim());
  };

  const handleGetSuggestions = async () => {
    if (!selectedRules.length || !selectedStudents.length) return;
    setIsSuggesting(true);
    setShowSuggestions(true);
    setSuggestions('');
    try {
      const studentNames = selectedStudents.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', ');
      const ruleDescriptions = selectedRules.map(code => {
        const r = rules.find(ru => ru.code === parseInt(code, 10));
        return r ? `Art. ${r.code} — ${r.description} (${r.severity})` : '';
      }).filter(Boolean).join('; ');
      const primaryRule = rules.find(r => r.code === parseInt(selectedRules[0], 10));
      const primaryStudentId = selectedStudents[0];
      const student = students.find(s => s.id === primaryStudentId);
      const studentOccurrences = occurrences.filter(o => o.studentId === primaryStudentId);
      const escalation = selectedStudents.length > 0
        ? getEscalationStatus(primaryStudentId, parseInt(selectedRules[0], 10), editingOccurrence ?? undefined)
        : null;

      await streamAI(
        'sugestao',
        {
          students: studentNames,
          infractions: ruleDescriptions,
          severity: primaryRule?.severity ?? '',
          measure: measureOverride ?? escalation?.measure ?? primaryRule?.measure ?? '',
          isReincidente: escalation?.isEscalated ?? false,
          totalOccurrences: studentOccurrences.length,
          currentPoints: student?.points ?? '',
          ataText: observations,
        },
        (delta) => setSuggestions(prev => prev + delta)
      );
    } catch {
      setSuggestions('Erro ao gerar sugestões. Tente novamente.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleImproveObservations = async () => {
    if (!observations.trim() && selectedRules.length === 0) return;

    setIsImproving(true);
    try {
      const studentNames = selectedStudents.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', ');
      const ruleDescriptions = selectedRules.map(code => rules.find(r => r.code === parseInt(code, 10))?.description).filter(Boolean).join('; ');

      setObservations('');
      await streamAI(
        'ata',
        {
          students: studentNames || 'Não identificado',
          infractions: ruleDescriptions || 'Não especificada',
          dateTime: `${date} ${hour}`,
          location,
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

  // Carregar perfil do Supabase para preencher "Registrado por"
  useEffect(() => {
    if (!user?.email || !supabase) return;
    supabase
      .from('user_profiles')
      .select('name, role')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) {
          setRegisteredBy(buildUserLabel(data.name, data.role));
        } else if (user.email) {
          const staff = staffMembers.find(s => s.name.toLowerCase() === user.email.split('@')[0].toLowerCase());
          setRegisteredBy(staff ? `${staff.role} ${staff.name}` : user.email.split('@')[0]);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Atualizar registeredBy em tempo real quando o perfil for salvo no AppShell
  useEffect(() => {
    const handler = (e: Event) => {
      const { name, role } = (e as CustomEvent).detail || {};
      if (name) setRegisteredBy(buildUserLabel(name, role));
    };
    window.addEventListener('eecm_profile_updated', handler);
    return () => window.removeEventListener('eecm_profile_updated', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredOccurrences = occurrences.filter(o => {
    if (o.archived) return false;
    
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
    
    // Search in all student names
    const searchLower = searchTerm.toLowerCase();
    const anyNameMatch = relatedStudents.some(s => s.name.toLowerCase().includes(searchLower));
    const obsMatch = o.observations?.toLowerCase().includes(searchLower);
    
    return anyNameMatch || obsMatch || false;
  }).sort((a, b) => {
    // Ordenar pelo createdAt do servidor (mais recente primeiro) para refletir ordem real de criação
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Fallback: usar date + hour se createdAt não estiver disponível
    const dateTimeA = new Date(`${a.date}T${a.hour || '00:00'}`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.hour || '00:00'}`).getTime();
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
    const localDate = `${year}-${month}-${day}`;
    
    const localHour = now.toTimeString().split(' ')[0].substring(0, 5);

    setEditingOccurrence(null);
    setSelectedStudents([]);
    setDate(localDate);
    setHour(localHour);
    setLocation('Pátio');
    setLocatedBy('');
    setSelectedRules([]);
    setRuleSearch('');
    setRegisteredBy(getLoggedUserName());
    setObservations('');
    setAtaPreviewMode(false);
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
    setDate(o.date);
    setHour(o.hour || '');
    setLocation(o.location || 'Pátio');
    setLocatedBy(o.locatedBy || '');
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
        <div class="sig-nome-label">Nome:</div>
        <div class="sig-nome">&nbsp;</div>
      </div>
      <div class="sig-item">
        <div class="sig-espaco"></div>
        <div class="sig-line"></div>
        <div class="sig-cargo">Gestor Cívico Militar / Educacional</div>
        <div class="sig-nome-label">Nome:</div>
        <div class="sig-nome">&nbsp;</div>
      </div>
      <div class="sig-item">
        <div class="sig-espaco"></div>
        <div class="sig-line"></div>
        <div class="sig-cargo">Responsável Legal</div>
        <div class="sig-nome-label">Nome:</div>
        <div class="sig-nome">&nbsp;</div>
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
          <div style="font-size: 7pt; color: #555; margin-top: 6pt;">Nome:</div>
          <div style="border-bottom: 1px dotted #999; min-height: 12pt;">&nbsp;</div>
        </td>
        <td style="width:33%; vertical-align: bottom; padding: 0 4pt;">
          <div style="height: 36pt;"></div>
          <div style="border-top: 1px solid #000; padding-top: 4pt; font-size: 8pt; font-weight: bold; text-align: center; text-transform: uppercase;">
            Gestor Cívico Militar / Educacional
          </div>
          <div style="font-size: 7pt; color: #555; margin-top: 6pt;">Nome:</div>
          <div style="border-bottom: 1px dotted #999; min-height: 12pt;">&nbsp;</div>
        </td>
        <td style="width:33%; vertical-align: bottom; padding: 0 0 0 8pt;">
          <div style="height: 36pt;"></div>
          <div style="border-top: 1px solid #000; padding-top: 4pt; font-size: 8pt; font-weight: bold; text-align: center; text-transform: uppercase;">
            Responsável Legal
          </div>
          <div style="font-size: 7pt; color: #555; margin-top: 6pt;">Nome:</div>
          <div style="border-bottom: 1px dotted #999; min-height: 12pt;">&nbsp;</div>
        </td>
      </tr>
    </table>`;

  const handlePrint = (o: any) => {
    const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

    const rule = rules.find(r => r.code === o.ruleCode);

    // Resolve all students for this occurrence
    const relatedStudents = o.studentIds && o.studentIds.length > 0
      ? students.filter(s => o.studentIds.includes(s.id))
      : [students.find(s => s.id === o.studentId)].filter((s): s is Student => Boolean(s));

    const studentNamesHtml = relatedStudents.map(s => `<div>${s.name}</div>`).join('');
    const firstStudent = relatedStudents[0];
    const turmaStr = firstStudent ? `${firstStudent.class || '---'} — ${firstStudent.shift || '---'}` : '---';

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
      ? `o(a) aluno(a) ${relatedStudents[0].name}`
      : `os alunos ${relatedStudents.slice(0,-1).map(s=>s.name).join(', ')} e ${relatedStudents[relatedStudents.length-1].name}`;
    const autoAta = `Aos ${diaNum} dias do mês de ${mesExtenso} do ano de ${year}, às ${o.hour || '---'}, ${alunoStr} foi identificado(a) no(a) ${o.location || '---'}${o.locatedBy ? ` pelo(a) ${o.locatedBy}` : ''}, incorrendo em infração ao Art. ${o.ruleCode} do Regimento Interno (${rule?.description || 'Ocorrência personalizada'}). O presente registro foi lavrado por ${o.registeredBy || '---'}.`;
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
        ${isReincidente ? `<div class="reincidencia-box">⚠ REINCIDÊNCIA — ${reincidenteCount}ª ocorrência nesta infração</div>` : ''}
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

  ${getSchoolHeaderHTML()}

  <div class="ata-layout">

    <!-- SIDEBAR: IDENTIFICAÇÃO / INFRAÇÃO / MEDIDA -->
    <div class="sidebar">
      <div class="sidebar-titulo">IDENTIFICAÇÃO</div>

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
        <span class="sid-label">Registrado por</span>
        <span class="sid-valor">${o.registeredBy || '---'}</span>
      </div>

      <div class="sidebar-secao">INFRAÇÃO</div>
      <div class="sid-item">
        <span class="sid-label">Art. ${o.ruleCode}</span>
        <span class="sid-valor" style="font-weight: normal; font-size: 8.5pt; text-transform: uppercase;">${rule?.description || 'Ocorrência personalizada'}</span>
      </div>

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

      ${isReincidente ? `<div class="reincidencia-tag">REINCIDÊNCIA — ${reincidenteCount}ª vez</div>` : ''}
    </div>

    <!-- COLUNA PRINCIPAL: ATA -->
    <div class="main-col">
      <div class="ata-titulo-grande">ATA</div>
      <div class="ata-subtitulo">Relato do Ocorrido</div>
      <div class="ata-corpo">${markdownBoldToHtml(ataText)}</div>

      ${signaturesHTML()}
    </div>

  </div><!-- /ata-layout -->

  ${getSchoolFooterHTML()}

</body>
</html>\`);
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
      const measureToSave = measureOverride
        ? measureOverride
        : escalation.severity === 'Grave'
          ? (graveMeasureType === 'Suspensão Escolar' ? `Suspensão (${durationDays}d)` : graveMeasureType)
          : escalation.measure;

      if (editingOccurrence) {
        // Ao editar nunca exibe alerta de reincidência — a escalação já foi decidida na criação
        await updateOccurrence(editingOccurrence, {
          studentId: primaryStudentId,
          studentIds: selectedStudents,
          date,
          hour,
          location,
          locatedBy,
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
      } else {
        // Escalation alert for new occurrences
        if (escalation.isEscalated) {
          const student = students.find(s => s.id === primaryStudentId);
          const confirmed = window.confirm(`ATENCAO (${student?.name}): ${escalation.reason}!\n\nA medida sugerida subiu para: ${escalation.measure}.\n\nDeseja confirmar este registro com a medida agravada?`);
          if (!confirmed) return;
        }

        const savedId = await addOccurrence({
          studentId: primaryStudentId,
          studentIds: selectedStudents,
          date,
          hour,
          location,
          locatedBy,
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
          aggravatingFactors
        });

        // Códigos de infrações que envolvem violência física / bullying / agressão
        const VIOLENCIA_CODES = [64, 65, 69, 75, 76, 78, 80, 83, 84, 89];
        const isViolence = ruleCodesInt.some(c => VIOLENCIA_CODES.includes(c));

        const studentName = students.find(s => s.id === primaryStudentId)?.name ?? 'Aluno';
        const occurrenceNum = savedId ?? 'Nova';

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
            label: `Realizar a medida sugerida: ${measureToSave}`,
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

        setPostSaveAlert({
          occurrenceId: savedId ?? occurrenceNum,
          occurrenceNum,
          studentName,
          measure: measureToSave,
          isViolence,
          checklistItems: allItems,
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
            if (v.length <= 2) formatted = `(${v}`;
            else if (v.length <= 6) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            else if (v.length <= 10) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
            else formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
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
        if (v.length <= 2) formatted = `(${v}`;
        else if (v.length <= 6) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        else if (v.length <= 10) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
        else formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
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
      setLocatedBy(`${newStaffRole} ${newStaffName}`);
      setNewStaffName('');
      setIsStaffModalOpen(false);
    } catch (err) {
      console.error("Erro ao adicionar membro da equipe:", err);
    }
  };

  const handleExport = (o: Occurrence) => {
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

    printWindow.document.write(`
      <h${""}tml lang="pt-BR">
        <head>
          <title>${docTitle} - ${primaryStudent?.name}</title>
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
          </style>
        </head>
        <body>
          ${getSchoolHeaderHTML()}

          <div class="ata-layout">
            <div class="sidebar">
              <div class="sidebar-titulo">IDENTIFICAÇÃO</div>
              <div class="sid-item">
                <span class="sid-label">Data do Registro</span>
                <span class="sid-valor">${formatDate(o.date)} ${o.hour || ''}</span>
              </div>
              <div class="sid-item">
                <span class="sid-label">Local</span>
                <span class="sid-valor">${o.location || '---'}</span>
              </div>
              <div class="sid-item">
                <span class="sid-label">${relatedStudents.length > 1 ? 'Alunos' : 'Aluno'}</span>
                <span class="sid-valor">${studentNames}</span>
              </div>
              <div class="sid-item">
                <span class="sid-label">${relatedStudents.length > 1 ? 'Turmas' : 'Turma'}</span>
                <span class="sid-valor">${studentClasses}</span>
              </div>
              <div class="sid-item">
                <span class="sid-label">Localizado por</span>
                <span class="sid-valor">${o.locatedBy || '---'}</span>
              </div>
              <div class="sid-item">
                <span class="sid-label">Registrado por</span>
                <span class="sid-valor">${o.registeredBy || '---'}</span>
              </div>

              <div class="sidebar-secao">INFRAÇÃO</div>
              <div class="sid-item">
                <span class="sid-label">Art. ${rule?.code}</span>
                <span class="sid-valor" style="font-weight: normal; font-size: 8.5pt; text-transform: uppercase;">${rule?.description || 'Ocorrência personalizada'}</span>
              </div>

              <div class="sidebar-secao">MEDIDA</div>
              <div class="sid-medida-row">
                <span class="sid-medida-label">Gravidade</span>
                <span class="sid-medida-valor">${(rule?.severity || '---').toUpperCase()}</span>
              </div>
              <div class="sid-medida-row">
                <span class="sid-medida-label">Medida</span>
                <span class="sid-medida-valor">${exportMeasuresStr.toUpperCase()}${o.durationDays ? ` (${o.durationDays} DIA${o.durationDays > 1 ? 'S' : ''})` : ''}</span>
              </div>
              <div class="sid-medida-row">
                <span class="sid-medida-label">Impacto</span>
                <span class="sid-medida-valor">-${pointsToDeduct.toFixed(2).replace('.', ',')} PONTOS</span>
              </div>
            </div>

            <div class="main-col">
              <div class="ata-titulo-grande">ATA</div>
              <div class="ata-subtitulo">Relato do Ocorrido</div>
              <div class="ata-corpo">${markdownBoldToHtml(o.observations || 'Nenhum relato registrado.')}</div>

              ${signaturesHTML()}
            </div>
          </div>

          ${getSchoolFooterHTML()}
        </body>
      </h${""}tml>
    `);
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
         measure = rule?.severity === 'Leve' ? 'Advertência Escrita (Agravada)' : 'Suspensão (Agravada)';
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

    const headerHtmlDocx = `
      <div style="width: 160%; margin-left: -30%; margin-bottom: 10px;">
        <img src="${window.location.origin}/CABEÇALHO JB.svg" width="100%" style="width: 100%; height: auto;" alt="Cabeçalho">
      </div>
    `;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        ${headerHtmlDocx}
        
        <h1 style="text-align: center; font-size: 22pt; text-decoration: underline; margin-bottom: 15px;">${docTitle}</h1>
        
        <p style="font-size: 14pt;"><strong>DATA DO REGISTRO:</strong> ${formatDate(o.date)} ${o.hour || ''}</p>
        <p style="font-size: 14pt;"><strong>LOCAL:</strong> ${o.location || 'NÃO INFORMADO'}</p>
        <p style="font-size: 14pt;"><strong>${relatedStudents.length > 1 ? 'ALUNOS' : 'ALUNO'}:</strong> ${studentNames.toUpperCase()}</p>
        <p style="font-size: 14pt;"><strong>${relatedStudents.length > 1 ? 'TURMAS' : 'TURMA'}:</strong> ${studentClasses.toUpperCase()}</p>
        <p style="font-size: 14pt;"><strong>LOCALIZADO POR:</strong> ${o.locatedBy?.toUpperCase() || 'NÃO INFORMADO'}</p>
        <p style="font-size: 14pt;"><strong>REGISTRADO POR:</strong> ${o.registeredBy?.toUpperCase() || 'SISTEMA'}</p>
        
        <div style="border: 1px solid #000; padding: 10pt; margin: 20pt 0; font-size: 11pt;">
          <p><strong>INFRAÇÃO (ART. ${rule?.code}):</strong> ${rule?.description?.toUpperCase()}</p>
          <p><strong>GRAVIDADE:</strong> ${rule?.severity?.toUpperCase()}</p>
          <p><strong>MEDIDA ADMINISTRATIVA:</strong> ${measure?.toUpperCase()} ${o.durationDays ? `(${o.durationDays} ${o.durationDays === 1 ? 'DIA' : 'DIAS'})` : ''}</p>
          <p><strong>IMPACTO NA PONTUAÇÃO:</strong> -${pointsToDeduct.toFixed(2)} PONTOS</p>
        </div>
        
        <p><strong>ATA:</strong></p>
        <div style="border: 1px solid #000; min-height: 180pt; padding: 10pt; font-size: 12pt;">
          ${o.observations || 'Nenhum registro de ATA detalhado.'}
        </div>

        ${signaturesDocxHTML()}
      </div>
    `;

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${docTitle}</title></head>
      <body>${htmlContent}</body>
      </html>
    `;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle.replace(/ /g, '_')}_${primaryStudent?.name?.replace(/ /g, '_')}.doc`;
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
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
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
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
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
                            onClick={() => { setViewOccurrence(o); setIsPrintPanelOpen(false); }}
                            className="hover:bg-slate-50 transition cursor-pointer"
                            title="Clique para ver os detalhes ou exportar"
                          >
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
                              <span key={r.code} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                r.severity === 'Leve' ? 'bg-blue-500/10 text-blue-400' :
                                r.severity === 'Media' ? 'bg-yellow-500/10 text-yellow-600' :
                                'bg-red-500/10 text-red-400'
                              }`}>
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
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">
                {editingOccurrence ? 'Editar Ocorrência' : 'Nova Ocorrência'}
              </h2>
              <button 
                onClick={() => { setIsModalOpen(false); setIsGuardianListOpen(false); }}
                className="text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="max-w-md mx-auto space-y-5">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Aluno(s) *</label>
                    <SearchableSelect
                      options={students.filter(s => !selectedStudents.includes(s.id)).map(s => ({ value: s.id, label: `${s.name} - ${s.class} (${s.shift})` }))}
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
                               {s?.name}
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
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition shrink-0"
                    title="Cadastrar novo aluno"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> DATA
                    </label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> HORA
                    </label>
                    <input 
                      type="time" 
                      required
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> LOCAL
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              r.severity === 'Leve' ? 'bg-blue-500/20 text-blue-400' :
                              r.severity === 'Media' ? 'bg-yellow-500/20 text-yellow-600' :
                              'bg-red-500/20 text-red-400'
                            }`}>{r.severity}</span>
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
                        const activeMeasure = measureOverride ?? escalation.measure;
                        const isOverriding = !!measureOverride;

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
                                  <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border-2 ${
                                    isOverriding
                                      ? 'bg-violet-50 border-violet-400 text-violet-700'
                                      : escalation.severity === 'Grave'
                                        ? 'bg-red-50 border-red-400 text-red-700'
                                        : escalation.severity === 'Media'
                                          ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                                          : 'bg-blue-50 border-blue-400 text-blue-700'
                                  }`}>
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
                                  className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                                    isPanelOpen
                                      ? 'bg-slate-100 border-slate-300 text-slate-600'
                                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                  }`}
                                >
                                  Outras medidas
                                  <ChevronDown className={`w-3 h-3 transition-transform ${isPanelOpen ? 'rotate-180' : ''}`} />
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
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs font-medium ${
                                          isChecked
                                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
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
                                'Suspensão Escolar',
                                'Suspensão de Recreação',
                                'Ação Educativa',
                                'Transferência Educativa'
                              ].map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    if (type === 'Transferência Educativa' && !confirm('⚠️ A Transferência Educativa é uma medida extrema que exige aprova��ão do Conselho de Ensino Disciplinar. Deseja prosseguir com a solicitação?')) return;
                                    setGraveMeasureType(type as any);
                                  }}
                                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                    graveMeasureType === type 
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                      : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          {graveMeasureType === 'Suspensão Escolar' && (
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
                      options={staffMembers.map(s => ({ value: `${s.role} ${s.name}`, label: `${s.role} ${s.name}` }))}
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
                        {isImproving ? "Melhorando..." : "Melhorar com IA"}
                      </button>
                      <button
                        type="button"
                        onClick={handleGetSuggestions}
                        disabled={isSuggesting || !selectedRules.length || !selectedStudents.length}
                        className="flex items-center gap-1 text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full hover:bg-violet-100 transition-all disabled:opacity-50 border border-violet-200"
                      >
                        <Sparkles size={10} className={isSuggesting ? "animate-spin" : ""} />
                        {isSuggesting ? "Consultando regimento..." : "Sugestões do Regimento"}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Ajuste o tamanho se necessário</span>
                  </label>
                  {/* Editor ATA com preview de markdown bold */}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    {/* Barra de abas */}
                    <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50 px-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAtaPreviewMode(false)}
                        className={`px-3 py-1 text-[11px] font-medium rounded-t border-b-2 transition-colors ${
                          !ataPreviewMode
                            ? 'border-blue-500 text-blue-700 bg-white'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAtaPreviewMode(true)}
                        className={`px-3 py-1 text-[11px] font-medium rounded-t border-b-2 transition-colors ${
                          ataPreviewMode
                            ? 'border-blue-500 text-blue-700 bg-white'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                    {/* Painel edição */}
                    {!ataPreviewMode && (
                      <textarea
                        rows={4}
                        value={observations}
                        onChange={(e) => {
                          setObservations(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        className="w-full bg-white px-4 py-3 text-slate-800 focus:outline-none resize-y min-h-[120px] text-sm font-mono"
                        placeholder="Descreva o que ocorreu... Use **negrito** para destacar."
                      />
                    )}
                    {/* Painel preview */}
                    {ataPreviewMode && (
                      <div
                        className="w-full bg-white px-4 py-3 text-slate-800 min-h-[120px] text-sm leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: observations
                            ? markdownBoldToHtml(observations)
                            : '<span class="text-slate-400">Nenhum texto ainda...</span>',
                        }}
                      />
                    )}
                  </div>

                  {/* Painel de sugestões baseado no Regimento */}
                  {showSuggestions && (
                    <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-violet-200 bg-violet-100">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">Sugestões do Regimento Interno</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(false)}
                          className="text-violet-400 hover:text-violet-700 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="px-3 py-3">
                        {isSuggesting && !suggestions ? (
                          <div className="flex items-center gap-2 text-violet-600 text-xs">
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            Consultando Regimento Interno e Manual Disciplinar...
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{suggestions}</p>
                        )}
                      </div>
                    </div>
                  )}
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
                      <button
                        type="button"
                        onClick={() => {
                          window.open('https://drive.google.com/drive/folders/1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk', '_blank', 'noopener,noreferrer');
                          setVideoUrls(prev => [...prev, 'https://drive.google.com/drive/folders/1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk']);
                        }}
                        className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-100 hover:border-blue-300 transition-all text-slate-400 hover:text-blue-500"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-center px-1">Adicionar no Drive</span>
                      </button>
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
                      <button
                        type="button"
                        onClick={() => {
                          window.open('https://drive.google.com/drive/folders/1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk', '_blank', 'noopener,noreferrer');
                          setSignedDocUrls(prev => [...prev, 'https://drive.google.com/drive/folders/1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk']);
                        }}
                        className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-100 hover:border-blue-300 transition-all text-slate-400 hover:text-blue-500"
                      >
                        <FileText className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-center px-1">Enviar para o Drive</span>
                      </button>
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
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                  <div className="flex gap-2">
                    <select 
                      required
                      value={newClassName.replace(/ [A-Z]$/i, '') || '6º Ano'}
                      onChange={(e) => {
                        const letter = newClassName.match(/ ([A-Z])$/i)?.[1] || 'A';
                        setNewClassName(`${e.target.value} ${letter}`);
                      }}
                      className="w-2/3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="6º Ano">6º Ano</option>
                      <option value="7º Ano">7º Ano</option>
                      <option value="8º Ano">8º Ano</option>
                      <option value="9º Ano">9º Ano</option>
                      <option value="1º Ano">1º Ano</option>
                      <option value="2º Ano">2º Ano</option>
                      <option value="3º Ano">3º Ano</option>
                    </select>
                    <select 
                      required
                      value={newClassName.match(/ ([A-Z])$/i)?.[1] || 'A'}
                      onChange={(e) => {
                        const prefix = newClassName.replace(/ [A-Z]$/i, '') || '6º Ano';
                        setNewClassName(`${prefix} ${e.target.value}`);
                      }}
                      className="w-1/3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
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
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200">
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

      {/* Modal Visualização de Ocorrência */}
      {_vo && (
          <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="glass-modal max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              {/* Header compacto */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="text-base font-semibold text-slate-800">Detalhes da Ocorrência</h2>
                <button 
                  onClick={() => { setViewOccurrence(null); setIsGuardianListOpen(false); }}
                  className="text-slate-400 hover:text-slate-600 transition p-1 rounded hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto text-sm">
                {/* Aluno + Turma em linha */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-400 font-medium uppercase">
                      {_vo.studentIds && _vo.studentIds.length > 1 ? 'Alunos' : 'Aluno'}
                    </span>
                    {(_vo.studentIds && _vo.studentIds.length > 0 
                      ? students.filter(s => _vo.studentIds?.includes(s.id))
                      : [students.find(s => s.id === _vo.studentId)].filter((s): s is Student => Boolean(s))
                    ).map(s => (
                      <p key={s.id} className="text-slate-800 font-medium truncate">{s.name} <span className="text-slate-400 font-normal">({s.class || '-'})</span></p>
                    ))}
                  </div>
                </div>

                {/* Data + Hora + Registrado em grid compacto */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-2.5">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Data</span>
                    <p className="text-slate-700">{formatDate(_vo.date)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Hora</span>
                    <p className="text-slate-700">{_vo.hour || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Registrado</span>
                    <p className="text-slate-700 truncate">{_vo.registeredBy || 'Sistema'}</p>
                  </div>
                </div>

                {/* Infrações compactas */}
                <div className="space-y-2">
                  {(_voAllRules.length > 0 ? _voAllRules : [_voRule]).map((r: any) => r && (
                    <div key={r.code} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-700">Art. {r.code}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.severity === 'Leve' ? 'bg-blue-100 text-blue-600' :
                          r.severity === 'Media' ? 'bg-amber-100 text-amber-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {r.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{r.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>Medida: <span className="text-slate-700">{r.measure}</span></span>
                        <span>Impacto: <span className="text-red-500 font-medium">-{Math.abs(r.points || 0)} pts</span></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ATA compacta */}
                {_vo.observations && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium uppercase">ATA</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap mt-1 max-h-24 overflow-y-auto">
                      {_vo.observations}
                    </p>
                  </div>
                )}

                {/* Evidencias compactas */}
                {((_vo.videoUrls && _vo.videoUrls.length > 0) || (_vo.videoUrls === undefined && (_vo as any).videoUrl)) && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium uppercase">Evidências</span>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {(_vo.videoUrls || [(_vo as any).videoUrl]).filter(Boolean).map((url: string, index: number) => {
                        const isImage = /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i.test(url);
                        return (
                          <div key={index} className="aspect-square bg-slate-900 rounded overflow-hidden border border-slate-200">
                            {isImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(url, '_blank')} alt={`Evidência ${index + 1}`} />
                            ) : (
                              <video src={url} className="w-full h-full object-cover" controls />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {((_vo.signedDocUrls && _vo.signedDocUrls.length > 0) || (_vo.signedDocUrls === undefined && (_vo as any).signedDocUrl)) && (
                  <div>
                    <span className="text-xs text-slate-400 font-medium uppercase">Docs Assinados</span>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {(_vo.signedDocUrls || [(_vo as any).signedDocUrl]).filter(Boolean).map((url: string, index: number) => (
                        <div key={index} className="aspect-square bg-slate-100 rounded overflow-hidden border border-slate-200">
                          <img src={url} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(url, '_blank')} alt="Assinada" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer reestruturado */}
              <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 mt-auto space-y-2">

                {/* Painel de impressao — expande ao clicar em Imprimir */}
                {isPrintPanelOpen && (
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
                    <span className="text-xs text-slate-500 font-medium mr-auto">Exportar como:</span>
                    <button
                      onClick={() => { handleExport(_vo); setIsPrintPanelOpen(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition text-xs font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => { handleExportDocx(_vo); setIsPrintPanelOpen(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition text-xs font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5" /> DOC
                    </button>
                  </div>
                )}

                {/* Linha principal: Editar + Imprimir */}
                <div className="flex items-center gap-2">
                  {currentUserRole !== 'GUEST' && (
                    <button
                      onClick={(e) => { setViewOccurrence(null); setIsGuardianListOpen(false); setIsPrintPanelOpen(false); openEditModal(e, _vo); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition text-xs font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                  <button
                    onClick={() => setIsPrintPanelOpen(v => !v)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition text-xs font-semibold border ${
                      isPrintPanelOpen
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir
                  </button>
                </div>

                {/* Linha secundaria: WhatsApp + Arquivar + Fechar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setIsGuardianListOpen(!isGuardianListOpen)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition text-xs font-medium"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WhatsApp
                    </button>
                    {isGuardianListOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-[60]">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Responsáveis</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {_voStudent?.contacts?.length ? (
                            _voStudent.contacts.map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleWhatsAppRedirect(c.phone, _voStudent.name, _voStudent.id)}
                                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-50 rounded-lg group transition border border-transparent hover:border-emerald-200 text-left"
                              >
                                <div>
                                  <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">{c.name || 'Responsável'}</p>
                                  <p className="text-xs text-slate-500">{c.phone}</p>
                                </div>
                                <Phone className="w-4 h-4 text-emerald-500" />
                              </button>
                            ))
                          ) : <p className="text-xs text-slate-500 text-center py-4">Sem responsáveis cadastrados</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  {currentUserRole !== 'GUEST' && (
                    <button
                      onClick={(e) => { setViewOccurrence(null); handleArchive(e, _vo.id); }}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-orange-600 hover:bg-orange-50 border border-orange-200 transition text-xs font-medium"
                    >
                      <Archive className="w-3.5 h-3.5" /> Arquivar
                    </button>
                  )}

                  <button
                    onClick={() => { setViewOccurrence(null); setIsGuardianListOpen(false); setIsPrintPanelOpen(false); }}
                    className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 border border-slate-200 transition text-xs font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}

      {/* Modal Add Quick Guardian */}
      {isAddGuardianModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9992] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-4 ${postSaveAlert.isViolence ? 'bg-red-600' : 'bg-blue-600'}`}>
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
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      postSaveAlert.isViolence && ['ficha_ficai','ficha_sigeduca','boletim'].includes(item.id)
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`} />
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
                    };
                    const updated = addOccurrenceTask(userId, task);
                    setChecklistTasks(updated);
                    setPostSaveAlert(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ${
                    postSaveAlert.isViolence
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
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
