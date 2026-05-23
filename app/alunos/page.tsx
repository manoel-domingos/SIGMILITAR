'use client';

import React, { useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { Users, Plus, Upload, Download, Search, X, Edit2, Archive, Trash2, ChevronDown, Camera, FileText, Phone, BookOpen, Paperclip, AlertCircle, CheckCircle2, Clock, MapPin, User, PanelRight, Rows3 } from 'lucide-react';
import StudentSheet from '@/components/StudentSheet';
import * as XLSX from 'xlsx';
import { GoogleGenAI, Type } from "@google/genai";

const analyzeSheetWithAI = async (csvSnippet: string) => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    
    // Limit to prevent huge JSON hallucination loops
    const limitedCsv = csvSnippet.substring(0, 1500);

    const prompt = `Analise as primeiras linhas dessa planilha escolar (formato CSV) e identifique a estrutura para importar alunos.
CSV:
${limitedCsv}

Responda APENAS com o objeto JSON solicitado. NUNCA inclua os dados da planilha de volta nos valores. Seja curto e conciso. Não use blocos markdown.
Formato do JSON (não adicione propriedades que não foram pedidas):
{
  "headerRowIndex": número da linha (0-indexed) onde estão os cabeçalhos,
  "columns": { "name": "NOME DO ALUNO", "class": "TURMA", ... }
}

Para a estrutura de alunos, as chaves suportadas em "columns" são: "name" (Aluno), "class" (Série/Turma), "shift" (Turno), "cpf", "birthDate" (Nascimento), "phone1" (Telefone), "phone2", "registration" (Matrícula), "observation" (Observação), "mother" (Mãe), "father" (Pai).
Se não houver coluna para alguma dessas chaves internas, não inclua a chave no objeto. Exemplo: {"headerRowIndex": 0, "columns": {"name": "NOME DO ALUNO", "class": "TURMA"}}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        maxOutputTokens: 256,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headerRowIndex: { type: Type.INTEGER },
            columns: {
               type: Type.OBJECT,
               properties: {
                 name: { type: Type.STRING },
                 class: { type: Type.STRING },
                 shift: { type: Type.STRING },
                 cpf: { type: Type.STRING },
                 birthDate: { type: Type.STRING },
                 phone1: { type: Type.STRING },
                 phone2: { type: Type.STRING },
                 registration: { type: Type.STRING },
                 observation: { type: Type.STRING },
                 mother: { type: Type.STRING },
                 father: { type: Type.STRING }
               }
            }
          }
        }
      }
    });

    const responseText = (response.text || '{}');
    try {
       // Find the first { and the last }
       const startIndex = responseText.indexOf('{');
       const endIndex = responseText.lastIndexOf('}');
       if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
         const jsonStr = responseText.substring(startIndex, endIndex + 1);
         return JSON.parse(jsonStr);
       }
       return JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, '').trim());
    } catch (parseError) {
       console.warn("JSON parse failed.", parseError);
       return null; // Return null instead of throwing to allow heuristic fallback
    }
  } catch (err) {
    console.error("AI Analysis failed:", err);
    return null;
  }
};

export default function Alunos() {
  const { students, addStudent, importStudents, updateStudent, archiveStudent, getStudentPoints, getStudentBehavior, deleteAllStudents, currentUserRole, uploadFile, getStudentOccurrences, occurrences } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [shift, setShift] = useState<'Matutino' | 'Vespertino' | 'Noturno'>('Matutino');
  const [contacts, setContacts] = useState<{name: string, phone: string}[]>([{ name: '', phone: '' }]);
  const [observation, setObservation] = useState('');
  const [address, setAddress] = useState('');
  const [cpf, setCpf] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [ignoredWarning, setIgnoredWarning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'atividades' | 'dados' | 'responsaveis' | 'documentos'>('atividades');
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [panelStudentId, setPanelStudentId] = useState<string | null>(null);
  
  // Import review state
  const [pendingImports, setPendingImports] = useState<any[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewEditContactsIndex, setReviewEditContactsIndex] = useState<number | null>(null);

  // Exclusão state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const phoneRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueClasses = Array.from(new Set(students.filter(s => !s.archived).map(s => s.class))).sort((a, b) => {
    // Sort numeric grades first if possible, fallback to standard sort
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
       if (aNum === bNum) return a.localeCompare(b);
       return aNum - bNum;
    }
    return a.localeCompare(b);
  });

  const norm = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredStudents = students.filter(s => {
    if (s.archived) return false;
    if (classFilter && s.class !== classFilter) return false;
    const term = norm(searchTerm);
    if (!term) return true;
    if (norm(s.name).includes(term) || norm(s.class).includes(term)) return true;
    if (s.contacts && s.contacts.some(c => norm(c.name).includes(term))) return true;
    return false;
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setClassName('');
    setShift('Matutino');
    setContacts([{ name: '', phone: '' }]);
    setObservation('');
    setAddress('');
    setCpf('');
    setRegistrationNumber('');
    setBirthDate('');
    setPhotoUrl('');
    setIgnoredWarning(false);
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingStudent(s.id);
    setName(s.name);
    setClassName(s.class);
    setShift(s.shift);
    setContacts(s.contacts && s.contacts.length > 0 ? s.contacts.map((c: any) => ({...c})) : [{ name: '', phone: '' }]);
    setObservation(s.observation || '');
    setAddress(s.address || '');
    setCpf(s.cpf || '');
    setRegistrationNumber(s.registrationNumber || '');
    setBirthDate(s.birthDate || '');
    setPhotoUrl(s.photoUrl || '');
    setIgnoredWarning(false);
    setActiveTab('atividades');
    setIsModalOpen(true);
  };

  const handleAddContact = () => {
    setContacts([...contacts, { name: '', phone: '' }]);
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = [...contacts];
    newContacts.splice(index, 1);
    setContacts(newContacts.length > 0 ? newContacts : [{ name: '', phone: '' }]);
  };

  const updateContact = (index: number, field: 'name' | 'phone', value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index] };
    if (field === 'phone') {
        const oldPhone = newContacts[index].phone;
        let v = value.replace(/\D/g, '');
        const oldV = oldPhone.replace(/\D/g, '');

        if (v.length > oldV.length && oldV.length === 0 && (v === '9' || v === '8')) {
           v = '65' + v;
        }

        if (v.length > 11) v = v.slice(0, 11);

        let formatted = v;
        if (v.length > 0) {
            if (v.length <= 2) formatted = '(' + v;
            else if (v.length <= 6) formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2);
            else if (v.length <= 10) formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
            else formatted = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
        }

        newContacts[index][field] = formatted;
        
        setIgnoredWarning(false);
        const inputRef = phoneRefs.current[index];
        if (inputRef) {
             inputRef.setCustomValidity('');
        }
    } else {
        newContacts[index][field] = value;
    }
    setContacts(newContacts);
  };

  const handleArchive = () => {
    if (editingStudent && deleteConfirmText.toLowerCase() === 'arquivar') {
      archiveStudent(editingStudent);
      setIsDeleteConfirmOpen(false);
      setIsModalOpen(false);
      setEditingStudent(null);
      setDeleteConfirmText('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !className) return;

    // Filter out completely empty contacts
    const validContacts = contacts.filter(c => c.name.trim() !== '' || c.phone.trim() !== '');

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

    if (editingStudent) {
      updateStudent(editingStudent, {
        name,
        class: className,
        shift,
        observation: observation || undefined,
        address: address || undefined,
        cpf: cpf || undefined,
        registrationNumber: registrationNumber || undefined,
        birthDate: birthDate || undefined,
        contacts: validContacts.length > 0 ? validContacts : undefined,
        photoUrl: photoUrl || undefined
      });
    } else {
      addStudent({
        name,
        class: className,
        shift,
        points: 10.0, // starts with 10 points
        observation: observation || undefined,
        address: address || undefined,
        cpf: cpf || undefined,
        registrationNumber: registrationNumber || undefined,
        birthDate: birthDate || undefined,
        contacts: validContacts.length > 0 ? validContacts : undefined
      });
    }

    setIsModalOpen(false);
    setName('');
    setClassName('');
    setShift('Matutino');
    setContacts([{ name: '', phone: '' }]);
    setObservation('');
    setAddress('');
    setCpf('');
    setRegistrationNumber('');
    setBirthDate('');
    setEditingStudent(null);
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
       fileInputRef.current.click();
       setIsImportModalOpen(false);
    }
  };

  const [importMessage, setImportMessage] = useState('Processando planilha...');

  const processImportedData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage('Lendo arquivo...');
    setIsImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      let aiMap: any = null;
      try {
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
           setImportMessage('Analisando cabeçalhos com IA...');
           const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
           const csvSnippet = XLSX.utils.sheet_to_csv(firstSheet).split('\n').slice(0, 15).join('\n');
           aiMap = await analyzeSheetWithAI(csvSnippet);
           if (aiMap) console.log("AI Sheet mapping:", aiMap);
        }
      } catch (e) {
        console.error("AI map failed", e);
      }
      
      setImportMessage('Extraindo dados...');
      
      let allJsonData: any[] = [];
      
      const normalizeStr = (str: any) => String(str).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let headerRowIndex = 0;
        
        // Find best header row by scoring
        let maxScore = -1;
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          const row: any = rawData[i];
          if (!row || !Array.isArray(row)) continue;
          
          let score = 0;
          const cells = row.map(cell => normalizeStr(String(cell || '')));
          
          if (cells.some(c => c === 'nome' || c === 'aluno' || c === 'nome do aluno' || c === 'estudante' || c === 'nome completo')) score += 5;
          if (cells.some(c => c === 'turma' || c === 'serie' || c === 'ano')) score += 3;
          if (cells.some(c => c === 'turno' || c === 'periodo')) score += 3;
          if (cells.some(c => c === 'cpf' || c === 'matricula')) score += 3;
          if (cells.some(c => c.includes('telefone') || c === 'telefone' || c.includes('contato'))) score += 2;
          if (cells.some(c => c === 'sig')) score += 2;
          
          // Bonus for first few rows to break ties
          const positionBonus = Math.max(0, 5 - i);
          
          if (score > 0) {
              const finalScore = score + positionBonus;
              if (finalScore > maxScore) {
                  maxScore = finalScore;
                  headerRowIndex = i;
              }
          }
        }
        
        // Only use AI's header row index if heuristic found nothing
        if (maxScore === -1 && aiMap && typeof aiMap.headerRowIndex === 'number') {
           headerRowIndex = aiMap.headerRowIndex;
        }
        
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '', raw: false });
        
        jsonData.forEach(row => {
          row['_SHEET_NAME_'] = sheetName;
        });
        
        allJsonData = [...allJsonData, ...jsonData];
      }

      const parsedStudents = allJsonData.map((row) => {
        const hasData = Object.keys(row).some(k => k !== '_SHEET_NAME_' && String(row[k] || '').trim() !== '' && String(row[k] || '').trim() !== '-');
        if (!hasData) return null;

        let studentId = '';
        let name = '';
        let className = '';
        let shift = 'Matutino';
        
        let observation = '';
        let address = '';
        let cpf = '';
        let registrationNumber = '';
        let birthDate = '';

        let mae = '';
        let pai = '';
        let tel1 = '';
        let tel2 = '';

        const sheetNameStr = String(row['_SHEET_NAME_'] || '');

        if (aiMap && aiMap.columns) {
           const c = aiMap.columns;
           if (c.name && row[c.name] !== undefined && String(row[c.name]).trim() !== '') name = String(row[c.name]).trim();
           if (c.class && row[c.class] !== undefined && String(row[c.class]).trim() !== '') className = String(row[c.class]).trim();
           if (c.shift && row[c.shift] !== undefined && String(row[c.shift]).trim() !== '') shift = String(row[c.shift]).trim();
           if (c.cpf && row[c.cpf] !== undefined && String(row[c.cpf]).trim() !== '') cpf = String(row[c.cpf]).trim();
           if (c.birthDate && row[c.birthDate] !== undefined && String(row[c.birthDate]).trim() !== '') birthDate = String(row[c.birthDate]).trim();
           if (c.phone1 && row[c.phone1] !== undefined && String(row[c.phone1]).trim() !== '') tel1 = String(row[c.phone1]).trim();
           if (c.phone2 && row[c.phone2] !== undefined && String(row[c.phone2]).trim() !== '') tel2 = String(row[c.phone2]).trim();
           if (c.registration && row[c.registration] !== undefined && String(row[c.registration]).trim() !== '') registrationNumber = String(row[c.registration]).trim();
           if (c.observation && row[c.observation] !== undefined && String(row[c.observation]).trim() !== '') observation = String(row[c.observation]).trim();
           if (c.mother && row[c.mother] !== undefined && String(row[c.mother]).trim() !== '') mae = String(row[c.mother]).trim();
           if (c.father && row[c.father] !== undefined && String(row[c.father]).trim() !== '') pai = String(row[c.father]).trim();
        }

        for (const key of Object.keys(row)) {
          const normKey = normalizeStr(key);
          const val = String(row[key] || '').trim();

          if (val === '-' || val === '' || key === '_SHEET_NAME_') continue;

          // Capture Student ID if present
          if (normKey === 'cod aluno' || normKey === 'id' || normKey === 'codigo' || normKey === 'cod') {
            if (!studentId) studentId = val;
          }
          else if (normKey === 'matricula' || normKey === 'matr' || normKey === 'matr.') {
             if (!registrationNumber) registrationNumber = val;
          }
          else if (normKey === 'nome' || normKey === 'nome completo' || normKey === 'nome aluno' || normKey === 'aluno' || normKey === 'nome do aluno') {
             if (!name) name = val;
          }
          else if (normKey === 'turma' || normKey === 'serie' || normKey.includes('turma')) {
             if (!className) className = val;
          }
          else if (normKey === 'turno' || normKey === 'periodo') {
             if (!shift || shift === 'Matutino') shift = val;
          }
          else if (normKey === 'cpf') {
             if (!cpf) cpf = val;
          }
          else if (normKey.includes('endereco') || normKey.includes('endereco completo') || normKey === 'end' || normKey === 'end.') {
             if (!address) address = val;
          }
          else if (normKey.includes('nascimento') || normKey.includes('data nasc') || normKey === 'dt. nasc.' || normKey === 'dt nasc') {
             if (!birthDate) birthDate = val;
          }
          else if (normKey.includes('observacao') || normKey === 'obs' || normKey === 'obs.' || normKey === 'observacoes') {
             if (!observation) observation = val;
          }
          else if (
            normKey === 'mae' || 
            normKey.includes('mae') || 
            key.toLowerCase().includes('mãe') ||
            normKey.includes('ma£e') || 
            normKey.includes('mae') ||
            (normKey.startsWith('m') && (normKey.includes('e') || normKey.includes('resp')) && normKey.length < 15)
          ) {
            if (!mae) mae = val;
          }
          else if (normKey === 'pai' || normKey.includes('pai')) {
            if (!pai) pai = val;
          }
          else if (normKey === 'telefone 1' || normKey === 'telefone1' || normKey === 'tel 1' || normKey === 'contato 1' || normKey === 'telefone' || normKey.includes('telefone') || normKey.includes('celular') || normKey.includes('contato')) {
             if (!tel1) tel1 = val;
             else if (!tel2 && val !== tel1) tel2 = val;
          }
          else if (normKey === 'telefone 2' || normKey === 'telefone2' || normKey === 'tel 2' || normKey === 'contato 2') {
             if (!tel2) tel2 = val;
          }
        }

        let rawClass = className || sheetNameStr;
        const upperRaw = rawClass.toUpperCase();
        
        if (upperRaw.includes('VESP')) shift = 'Vespertino';
        else if (upperRaw.includes('MAT')) shift = 'Matutino';
        else if (upperRaw.includes('NOT')) shift = 'Noturno';

        let parsedGrade = '';
        let parsedIdentifier = '';

        const gradeMatch = rawClass.match(/(\d+)[º°oa-z]*/i);
        if (gradeMatch) {
            parsedGrade = gradeMatch[1] + 'º Ano';
        }

        const letterMatch = rawClass.match(/\d+[º°oa-z]*\s*[-_.\s]*([A-Za-z])/i);
        if (letterMatch) {
            const letter = letterMatch[1].toUpperCase();
            if (letter !== 'V' && letter !== 'M' && letter !== 'N') {
                parsedIdentifier = letter;
            }
        }
        
        if (!parsedIdentifier) {
           const isolateLetter = rawClass.match(/\b([A-G])\b/i);
           if (isolateLetter) parsedIdentifier = isolateLetter[1].toUpperCase();
        }

        if (parsedGrade) {
            className = parsedGrade + (parsedIdentifier ? ' ' + parsedIdentifier : '');
        } else {
            className = rawClass.replace(/[-_.\s]*V[EÊ]SP.*$/i, '').replace(/[-_.\s]*MAT.*$/i, '').replace(/[-_.\s]*NOT.*$/i, '').replace(/[-_.\s]+$/, '').trim();
        }

        if (shift) {
           const shiftUpper = shift.toUpperCase();
           if (shiftUpper.startsWith('V')) shift = 'Vespertino';
           else if (shiftUpper.startsWith('M')) shift = 'Matutino';
           else if (shiftUpper.startsWith('N')) shift = 'Noturno';
        }

        const validShift = ['Matutino', 'Vespertino', 'Noturno'].includes(shift) ? shift as any : 'Matutino';

          const extractPhones = (phoneStr: string) => {
             if (!phoneStr) return [];
             const splitMatches = phoneStr.split(/[\/;,]|\s+e\s+/i);
             if (splitMatches.length > 1) {
                 return splitMatches.flatMap(p => {
                    let n = p.replace(/\D/g, '');
                    if (n.length === 8 || n.length === 9) n = '65' + n;
                    if (n.length >= 10 && n.length <= 11) {
                       if (n.length === 10) return ['(' + n.substring(0, 2) + ') ' + n.substring(2, 6) + '-' + n.substring(6, 10)];
                       if (n.length === 11) return ['(' + n.substring(0, 2) + ') ' + n.substring(2, 7) + '-' + n.substring(7, 11)];
                    }
                    if (n.length > 11) {
                        return ['(' + n.substring(0, 2) + ') ' + n.substring(2, Math.min(n.length, 7)) + '-' + n.substring(Math.min(n.length, 7), Math.min(n.length, 11))];
                    }
                    return [];
                 });
             }

             let nums = phoneStr.replace(/\D/g, '');
             let extracted: string[] = [];
             
             if (nums.length >= 12) {
                if (nums.length === 22) { extracted = [nums.substring(0,11), nums.substring(11,22)]; }
                else if (nums.length === 21) { extracted = [nums.substring(0,11), nums.substring(11,21)]; }
                else if (nums.length === 20) { extracted = [nums.substring(0,10), nums.substring(10,20)]; }
                else if (nums.length === 18) { extracted = ['65' + nums.substring(0,9), '65' + nums.substring(9,18)]; }
                else if (nums.length === 16) { extracted = ['65' + nums.substring(0,8), '65' + nums.substring(8,16)]; }
                else {
                   const half = Math.floor(nums.length/2);
                   extracted = [nums.substring(0, half), nums.substring(half)];
                }
             } else {
                if (nums.length === 8 || nums.length === 9) nums = '65' + nums;
                if (nums.length >= 10) extracted = [nums];
             }
             
             return extracted.map(n => {
                 if (n.length === 10) return '(' + n.substring(0, 2) + ') ' + n.substring(2, 6) + '-' + n.substring(6, 10);
                 if (n.length === 11) return '(' + n.substring(0, 2) + ') ' + n.substring(2, 7) + '-' + n.substring(7, 11);
                 return n;
             });
          };

        const formatCpf = (cpfStr: string) => {
           if (!cpfStr) return '';
           let nums = cpfStr.replace(/\D/g, '');
           if (nums.length < 11) {
             nums = nums.padStart(11, '0');
           } else if (nums.length > 11) {
             nums = nums.substring(0, 11);
           }
           return `${nums.substring(0,3)}.${nums.substring(3,6)}.${nums.substring(6,9)}-${nums.substring(9,11)}`;
        };
        
        const contacts: {name: string, phone: string}[] = [];
        const phones1 = extractPhones(tel1);
        phones1.forEach((phone, i) => {
             contacts.push({ name: mae ? (i===0 ? 'M\u00e3e: ' + mae : 'Respons\u00e1vel (M\u00e3e ' + (i+1) + ')') : 'Resp. 1 - ' + (i+1), phone });
        });
        
        const phones2 = extractPhones(tel2);
        phones2.forEach((phone, i) => {
             contacts.push({ name: pai ? (i===0 ? 'Pai: ' + pai : 'Respons\u00e1vel (Pai ' + (i+1) + ')') : 'Resp. 2 - ' + (i+1), phone });
        });
        
        if (contacts.length === 0) {
            if (mae) contacts.push({ name: 'M\u00e3e: ' + mae, phone: '' });
            if (pai) contacts.push({ name: 'Pai: ' + pai, phone: '' });
        }

        let error = '';
        if (!name) error += 'Nome faltando. ';
        if (!className) error += 'Turma faltando. ';
        if (cpf) {
           cpf = formatCpf(cpf);
        }

        if (!name && !className && contacts.length === 0 && !studentId && !registrationNumber) return null; // Skip completely empty generated rows

        return {
          _id: crypto.randomUUID(),
          id: studentId || undefined,
          name,
          class: className,
          shift: validShift,
          points: 10.0,
          cpf: cpf || undefined,
          address: address || undefined,
          birthDate: birthDate || undefined,
          registrationNumber: registrationNumber || undefined,
          observation: observation || undefined,
          contacts: contacts.length > 0 ? contacts : undefined,
          error: error.trim()
        };
      }).filter(Boolean) as any[];

      // Sort so errors appear first
      parsedStudents.sort((a, b) => {
        if (a.error && !b.error) return -1;
        if (!a.error && b.error) return 1;
        return 0;
      });

      if (parsedStudents.length > 0) {
        setPendingImports(parsedStudents);
        setIsReviewOpen(true);
      } else {
        alert('Nenhum dado encontrado na planilha.');
      }
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao ler a planilha. Verifique o formato do arquivo.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // reseta
    }
  };

  const handleReviewChange = (index: number, field: string, value: string) => {
    const updated = [...pendingImports];
    updated[index][field] = value;
    
    let error = '';
    if (!updated[index].name) error += 'Nome faltando. ';
    if (!updated[index].class) error += 'Turma faltando. ';
    updated[index].error = error.trim();

    setPendingImports(updated);
  };

  const handleReviewContactChange = (index: number, contactIndex: number, field: 'name' | 'phone', value: string) => {
    const updated = [...pendingImports];
    if (!updated[index].contacts) updated[index].contacts = [];
    
    if (field === 'phone') {
        let v = value.replace(/\D/g, '');
        if (v.length > 2 && v.length <= 6) v = '(' + v.substring(0,2) + ') ' + v.substring(2);
        else if (v.length > 6 && v.length <= 10) v = '(' + v.substring(0,2) + ') ' + v.substring(2,6) + '-' + v.substring(6);
        else if (v.length > 10) v = '(' + v.substring(0,2) + ') ' + v.substring(2,7) + '-' + v.substring(7,11);
        updated[index].contacts[contactIndex][field] = v;
    } else {
        updated[index].contacts[contactIndex][field] = value;
    }
    setPendingImports(updated);
  };

  const handleAddReviewContact = (index: number) => {
    const updated = [...pendingImports];
    if (!updated[index].contacts) updated[index].contacts = [];
    updated[index].contacts.push({ name: '', phone: '' });
    setPendingImports(updated);
  };

  const handleRemoveReviewContact = (index: number, contactIndex: number) => {
    const updated = [...pendingImports];
    updated[index].contacts.splice(contactIndex, 1);
    setPendingImports(updated);
  };

  const confirmImport = async () => {
    const validStudents = pendingImports.filter(s => !s.error);
    if (validStudents.length === 0) {
       alert('Nenhum aluno válido para importar. Corrija os erros ou selecione outra planilha.');
       return;
    }
    
    // strip _id and error before importing
    const payload = validStudents.map(s => {
       const { _id, error, ...rest } = s;
       return rest;
    });

    setIsImporting(true);
    await importStudents(payload);
    setIsImporting(false);
    setIsReviewOpen(false);
    setPendingImports([]);
    alert('Importa\u00e7\u00e3o concu\u00edda! ' + validStudents.length + ' aluno(s) adicionados.');
  };

  const handleExport = () => {
    // Generate simple CSV
    const headers = ['ID,Nome,Turma,Turno,Nota Disciplinar'];
    const rows = students.map(s => `${s.id},${s.name},${s.class},${s.shift},${getStudentPoints(s.id)}`);
    const csvContent = headers.concat(rows).join('\n');
    
    // Create a Blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'lista_alunos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAll = async () => {
    setIsDeleteAllConfirmOpen(true);
    setDeleteAllConfirmText('');
  };

  const confirmDeleteAll = async () => {
    if (deleteAllConfirmText.toLowerCase() === 'apagar todos') {
       await deleteAllStudents();
       setIsDeleteAllConfirmOpen(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string, studentName: string) => {
    // Remove tudo que não for número
    const numbers = phone.replace(/\D/g, '');
    // Se o número tiver menos de 10 dígitos, provavelmente não tem DDD, então não formata o link
    if (numbers.length < 10) return '';
    // Adiciona o código do DDI do Brasil (55) se não o usuário não colocou
    const  hasCountryCode = numbers.startsWith('55') && numbers.length >= 12;
    const baseUrl = `https://wa.me/${hasCountryCode ? '' : '55'}${numbers}`;
    
    // Greeting depending on time
    const hour = new Date().getHours();
    let greeting = 'Bom dia';
    if (hour >= 12 && hour < 18) {
      greeting = 'Boa tarde';
    } else if (hour >= 18) {
      greeting = 'Boa noite';
    }

    const message = 'Ol\u00e1, ' + greeting + '! Estou entrando em contato para falar sobre o ' + studentName + '.';
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Gestão de Efetivo</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Alunos</h1>
            <p className="text-slate-500 text-sm">Lista de estudantes, importação e exportação de dados.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={processImportedData}
            />
            <button
              onClick={handleImport}
              disabled={isImporting || currentUserRole === 'GUEST'}
              title={currentUserRole === 'GUEST' ? 'Apenas leitura — entre como gestor para importar' : undefined}
              className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 px-6 py-2 rounded-full font-medium flex items-center justify-center gap-2 transition shadow-sm flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              {isImporting ? importMessage : 'Importar Planilha'}
            </button>
            <button
              onClick={openAddModal}
              disabled={currentUserRole === 'GUEST'}
              title={currentUserRole === 'GUEST' ? 'Apenas leitura — entre como gestor para cadastrar' : undefined}
              className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white px-6 py-2 rounded-full font-medium flex items-center justify-center gap-2 transition shadow-lg flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" /> Cadastrar Aluno
            </button>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder="Buscar por nome ou turma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 rounded-full"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <div className="relative shrink-0">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="glass-input pl-4 pr-8 py-2 text-sm text-slate-800 dark:text-slate-200 appearance-none rounded-full"
              >
                <option value="">Todas as turmas</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
              <span className="font-bold text-slate-800 dark:text-slate-200">{filteredStudents.length}</span> alunos
            </span>
            {/* Toggle de modo de visualizacao */}
            <div className="flex items-center bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-full p-0.5 gap-0.5 shadow-sm">
              <button
                onClick={() => { setViewMode('horizontal'); setPanelStudentId(null); }}
                title="Horizontal — modal centralizado"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'horizontal' ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Rows3 className="w-3.5 h-3.5" />
                Horizontal
              </button>
              <button
                onClick={() => setViewMode('vertical')}
                title="Vertical — painel lateral"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'vertical' ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <PanelRight className="w-3.5 h-3.5" />
                Vertical
              </button>
            </div>
            <button
              onClick={handleExport}
              className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {/* Grid de cards */}
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum aluno encontrado</p>
            <p className="text-xs mt-1">Tente ajustar os filtros ou cadastrar um novo aluno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((s) => {
              const pts = getStudentPoints(s.id);
              const beh = getStudentBehavior(pts);
              const occs = getStudentOccurrences(s.id);
              const graveCount = occs.filter(o => o.ruleCode >= 300).length;
              const mediaCount = occs.filter(o => o.ruleCode >= 200 && o.ruleCode < 300).length;
              const leveCount  = occs.filter(o => o.ruleCode < 200).length;

              const behColor =
                beh === 'Excepcional' ? { dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' } :
                beh === 'Otimo'       ? { dot: 'bg-blue-500',    badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20' } :
                beh === 'Bom'         ? { dot: 'bg-slate-400',   badge: 'bg-slate-50 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600' } :
                beh === 'Regular'     ? { dot: 'bg-amber-500',   badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20' } :
                                        { dot: 'bg-rose-500',    badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20' };

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (currentUserRole === 'GUEST') return;
                    if (viewMode === 'vertical') {
                      setPanelStudentId(s.id);
                    } else {
                      openEditModal(s);
                    }
                  }}
                  disabled={currentUserRole === 'GUEST'}
                  className={`group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none ${panelStudentId === s.id ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-600' : ''}`}
                >
                  {/* Badge de comportamento */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${behColor.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${behColor.dot}`} />
                      {beh}
                    </span>
                    <span className={`text-sm font-black ${pts >= 7 ? 'text-blue-600 dark:text-blue-400' : pts >= 5 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {pts.toFixed(1)}
                    </span>
                  </div>

                  {/* Avatar + nome */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                      {s.photoUrl
                        ? <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        : s.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight truncate">{s.name}</p>
                      {s.observation && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{s.observation}</p>
                      )}
                    </div>
                  </div>

                  {/* Divisor */}
                  <div className="h-px bg-slate-100 dark:bg-slate-700/50" />

                  {/* Rodape: turma, turno, ocorrencias */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${behColor.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${behColor.dot}`} />
                      {s.class}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      {s.shift === 'Matutino' ? 'Manha' : s.shift === 'Vespertino' ? 'Tarde' : 'Noite'}
                    </span>
                    {occs.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <AlertCircle className="w-3 h-3" />
                        {occs.length}
                        {graveCount > 0 && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" title="Grave" />}
                        {mediaCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Media" />}
                        {leveCount  > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" title="Leve" />}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Painel lateral (modo vertical) */}
      {viewMode === 'vertical' && panelStudentId && (
        <StudentSheet
          studentId={panelStudentId}
          onClose={() => setPanelStudentId(null)}
          mode="panel"
        />
      )}

      {/* Modal Novo/Editar Aluno */}
      {isModalOpen && (() => {
        const studentOccs = editingStudent ? getStudentOccurrences(editingStudent) : [];
        const allDocs = studentOccs.flatMap(o => [
          ...(o.videoUrls || []).map(url => ({ url, type: 'video' as const, date: o.date, label: `Vídeo — Ocorrência ${o.id}` })),
          ...(o.signedDocUrls || []).map(url => ({ url, type: 'doc' as const, date: o.date, label: `Documento — Ocorrência ${o.id}` })),
        ]);
        const sevColor = (code: number) => {
          if (code >= 300) return { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/30', badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300', label: 'Grave' };
          if (code >= 200) return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300', label: 'Media' };
          return { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30', badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300', label: 'Leve' };
        };

        /* ── MODAL LARGO: edição com abas ── */
        if (editingStudent) {
          const pts = getStudentPoints(editingStudent);
          const beh = getStudentBehavior(pts);
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 w-full max-w-4xl flex flex-col max-h-[92vh] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300 overflow-hidden">

                {/* Cabeçalho com avatar e info */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <label className="cursor-pointer group relative shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden transition-all">
                        {photoUrl ? (
                          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-black/60 flex items-center justify-center rounded-full">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center rounded-full">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingPhoto(true);
                        const url = await uploadFile(file, editingStudent || 'new-' + Date.now());
                        if (url) setPhotoUrl(url);
                        setIsUploadingPhoto(false);
                        e.target.value = '';
                      }} />
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
                  <button onClick={() => setIsModalOpen(false)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Abas */}
                <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  {([
                    { id: 'atividades', label: 'Atividades', icon: BookOpen, count: studentOccs.length },
                    { id: 'dados', label: 'Dados', icon: User, count: null },
                    { id: 'responsaveis', label: 'Responsaveis', icon: Phone, count: contacts.filter(c => c.phone).length },
                    { id: 'documentos', label: 'Documentos', icon: Paperclip, count: allDocs.length },
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
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

                  {/* ABA: Atividades */}
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
                          {/* Linha vertical da timeline */}
                          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                          <div className="space-y-4">
                            {studentOccs.map((occ, idx) => {
                              const sc = sevColor(occ.ruleCode);
                              return (
                                <div key={occ.id} className="relative flex gap-4">
                                  {/* Bolinha da timeline */}
                                  <div className={`relative z-10 w-9 h-9 shrink-0 rounded-full border-2 ${sc.border} ${sc.bg} flex items-center justify-center`}>
                                    <AlertCircle className={`w-4 h-4 ${sc.text}`} />
                                  </div>
                                  {/* Card da ocorrencia */}
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
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(occ.date).toLocaleDateString('pt-BR')}</p>
                                        {occ.hour && <p className="text-[10px] text-slate-400 mt-0.5">{occ.hour}</p>}
                                      </div>
                                    </div>
                                    {occ.location && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{occ.location}</p>
                                    )}
                                    {(occ.measures || [occ.measure]).filter(Boolean).length > 0 && (
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

                  {/* ABA: Dados */}
                  {activeTab === 'dados' && (
                    <form onSubmit={handleSubmit} id="form-dados" className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome Completo *</label>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Turma *</label>
                          <div className="flex gap-2">
                            <select required value={className.replace(/ [A-Z]$/i, '') || '6º Ano'} onChange={(e) => { const l = className.match(/ ([A-Z])$/i)?.[1] || 'A'; setClassName(`${e.target.value} ${l}`); }}
                              className="w-2/3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                              {['6º Ano','7º Ano','8º Ano','9º Ano','1º Ano','2º Ano','3º Ano'].map(v => <option key={v}>{v}</option>)}
                            </select>
                            <select required value={className.match(/ ([A-Z])$/i)?.[1] || 'A'} onChange={(e) => { const p = className.replace(/ [A-Z]$/i, '') || '6º Ano'; setClassName(`${p} ${e.target.value}`); }}
                              className="w-1/3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                              {['A','B','C','D','E'].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Turno *</label>
                          <select required value={shift} onChange={(e) => setShift(e.target.value as any)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                            <option>Matutino</option><option>Vespertino</option><option>Noturno</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Matricula</label>
                          <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="Ex: 12345"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nascimento</label>
                          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Endereco</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, Numero, Bairro"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CPF</label>
                        <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Observacoes</label>
                        <textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Laudos, condicoes de saude, etc..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[72px] text-sm" />
                      </div>
                    </form>
                  )}

                  {/* ABA: Responsáveis */}
                  {activeTab === 'responsaveis' && (
                    <form onSubmit={handleSubmit} id="form-responsaveis" className="p-6 space-y-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Telefones e nomes dos responsaveis pelo aluno.</p>
                      {contacts.map((contact, index) => {
                        const waLink = formatPhoneForWhatsApp(contact.phone, name);
                        return (
                          <div key={index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Responsavel {index + 1}</span>
                              {index > 0 && (
                                <button type="button" onClick={() => handleRemoveContact(index)} className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1">
                                  <X className="w-3 h-3" /> Remover
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome</label>
                                <input type="text" value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} placeholder="Nome do responsavel"
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Telefone</label>
                                <div className="flex gap-2">
                                  <input ref={(el) => { phoneRefs.current[index] = el; }} type="tel" value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)} placeholder="(65) 99999-9999"
                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                  {waLink && (
                                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                                      className="shrink-0 p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition" title="WhatsApp">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <button type="button" onClick={handleAddContact}
                        className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Adicionar responsavel
                      </button>
                    </form>
                  )}

                  {/* ABA: Documentos */}
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
                                {docsAttached}<span className="text-sm font-medium text-slate-400 ml-1">/{docsOwed}</span>
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

                        {/* Lista por ocorrência */}
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

                {/* Rodape com acoes */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <button type="button" onClick={() => { setIsDeleteConfirmOpen(true); setDeleteConfirmText(''); }}
                    className="px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition font-medium text-sm flex items-center gap-2">
                    <Archive className="w-4 h-4" /> Arquivar
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium text-sm">
                      Fechar
                    </button>
                    {(activeTab === 'dados' || activeTab === 'responsaveis') && (
                      <button type="submit" form={activeTab === 'dados' ? 'form-dados' : 'form-responsaveis'}
                        disabled={!name || !className}
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        Salvar Alteracoes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        /* ── MODAL SIMPLES: novo cadastro ── */
        return (
          <div className="fixed inset-0 glass-overlay z-[9990] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="glass-modal w-full sm:max-w-md flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 rounded-t-3xl sm:rounded-2xl">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 safe-area-top">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Cadastrar Aluno</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col items-center gap-2">
                  <label className="cursor-pointer group relative">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 group-hover:border-blue-400 bg-slate-50 group-hover:bg-blue-50 transition-all flex items-center justify-center overflow-hidden">
                      {photoUrl ? <img src={photoUrl} alt="Foto do aluno" className="w-full h-full object-cover" /> : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-blue-500">
                          <Camera className="w-6 h-6" /><span className="text-[9px] font-bold uppercase tracking-wider text-center">Foto</span>
                        </div>
                      )}
                      {isUploadingPhoto && <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      setIsUploadingPhoto(true);
                      const url = await uploadFile(file, 'new-' + Date.now());
                      if (url) setPhotoUrl(url); setIsUploadingPhoto(false); e.target.value = '';
                    }} />
                  </label>
                  {photoUrl && <button type="button" onClick={() => setPhotoUrl('')} className="text-xs text-rose-500 hover:text-rose-700">Remover foto</button>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Nome Completo *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Joao da Silva..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Turma *</label>
                    <div className="flex gap-2">
                      <select required value={className.replace(/ [A-Z]$/i, '') || '6º Ano'} onChange={(e) => { const l = className.match(/ ([A-Z])$/i)?.[1] || 'A'; setClassName(`${e.target.value} ${l}`); }}
                        className="w-2/3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {['6º Ano','7º Ano','8º Ano','9º Ano','1º Ano','2º Ano','3º Ano'].map(v => <option key={v}>{v}</option>)}
                      </select>
                      <select required value={className.match(/ ([A-Z])$/i)?.[1] || 'A'} onChange={(e) => { const p = className.replace(/ [A-Z]$/i, '') || '6º Ano'; setClassName(`${p} ${e.target.value}`); }}
                        className="w-1/3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {['A','B','C','D','E'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Turno *</label>
                    <select required value={shift} onChange={(e) => setShift(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Matutino</option><option>Vespertino</option><option>Noturno</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Matricula</label>
                    <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="Ex: 12345"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Data de Nascimento</label>
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Endereco</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, Numero, Bairro"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">CPF</label>
                    <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Observacoes</label>
                  <textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Laudos, condicoes de saude, etc..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]" />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-600">Contatos dos Responsaveis</label>
                  {contacts.map((contact, index) => {
                    const waLink = formatPhoneForWhatsApp(contact.phone, name);
                    return (
                      <div key={index} className="flex gap-2">
                        <input type="text" value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} placeholder="Responsavel"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input ref={(el) => { phoneRefs.current[index] = el; }} type="tel" value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)} placeholder="Telefone"
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition shrink-0 flex items-center justify-center" title="Falar com responsavel">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                          </a>
                        )}
                        {index === 0 ? (
                          <button type="button" onClick={handleAddContact} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition shrink-0 flex items-center justify-center" title="Adicionar mais um contato">
                            <Plus className="w-5 h-5" />
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleRemoveContact(index)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition shrink-0 flex items-center justify-center" title="Remover contato">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-5 pt-5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white transition font-medium">Cancelar</button>
                  <button type="submit" disabled={!name || !className} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirmar Cadastro
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal Confirmação de Arquivamento */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsDeleteConfirmOpen(false); }}>
          <div className="glass-modal max-w-sm w-full p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Arquivar Aluno</h3>
            <p className="text-sm text-slate-600 mb-4">
              Esta ação removerá o aluno da visualização principal, movendo-o para a aba de arquivados. 
              Para confirmar, digite a palavra <strong>arquivar</strong> abaixo:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 mb-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Digite arquivar"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={deleteConfirmText.toLowerCase() !== 'arquivar'}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Confirmar Arquivamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Apagar Todos */}
      {isDeleteAllConfirmOpen && (
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsDeleteAllConfirmOpen(false); }}>
          <div className="glass-modal max-w-sm w-full p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Apagar Todos Alunos</h3>
            <p className="text-sm text-slate-600 mb-4">
              ATENÇÃO: Esta ação é definitiva e removerá TODOS os alunos atuais. 
              Para confirmar, digite <strong>apagar todos</strong> abaixo:
            </p>
            <input
              type="text"
              value={deleteAllConfirmText}
              onChange={(e) => setDeleteAllConfirmText(e.target.value)}
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 mb-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Digite apagar todos"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteAllConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteAll}
                disabled={deleteAllConfirmText.toLowerCase() !== 'apagar todos'}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Planilha */}
      {isImportModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsImportModalOpen(false); }}>
          <div className="glass-modal max-w-lg w-full p-0 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Importar Alunos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Siga as instruções para importar sua planilha</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">1</div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Prepare sua planilha</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Certifique-se de que as colunas principais (Nome, Turma, Turno) estão presentes. O sistema usa IA para tentar identificar os campos automaticamente.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">2</div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Use nosso modelo (opcional)</p>
                    <button 
                      onClick={handleExport}
                      className="text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar planilha modelo
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">3</div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Revise antes de salvar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Após selecionar o arquivo, você poderá revisar e corrigir cada linha antes de confirmar a importação final.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Formatos suportados: <strong>.xlsx, .xls, .csv</strong>. 
                  Arquivos grandes podem levar alguns segundos para serem processados pela IA de mapeamento.
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={triggerFileInput}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-md flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Selecionar Arquivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Review Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 glass-overlay z-[9992] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsReviewOpen(false); }}>
          <div className="glass-modal w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Revisão de Importação</h2>
                <p className="text-sm text-slate-500 mt-1">Verifique e corrija os dados antes de finalizar a importação.</p>
              </div>
              <button 
                onClick={() => { setIsReviewOpen(false); setPendingImports([]); }}
                className="text-slate-400 hover:bg-slate-50 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-50 p-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                      <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 font-medium">Nome do Aluno</th>
                      <th className="py-3 px-4 font-medium">Turma</th>
                      <th className="py-3 px-4 font-medium">Turno</th>
                      <th className="py-3 px-4 font-medium">Contatos</th>
                      <th className="py-3 px-4 font-medium text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingImports.map((student, index) => (
                      <tr key={student._id} className={student.error ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-4 whitespace-nowrap">
                          {student.error ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Erro: {student.error}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Pronto
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <input 
                            type="text" 
                            value={student.name}
                            onChange={(e) => handleReviewChange(index, 'name', e.target.value)}
                            className={'w-full px-3 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (!student.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white')}
                            placeholder="Nome..."
                          />
                        </td>
                        <td className="py-2 px-4 w-40">
                          <div className="flex gap-1">
                            <select
                              value={student.class ? student.class.replace(/ [A-Z]$/i, '') : '6º Ano'}
                              onChange={(e) => {
                                const letter = student.class ? (student.class.match(/ ([A-Z])$/i)?.[1] || 'A') : 'A';
                                handleReviewChange(index, 'class', `${e.target.value} ${letter}`);
                              }}
                              className="w-2/3 px-2 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-200 bg-white"
                            >
                                <option value="Berçário">Berçário</option>
                                <option value="Maternal I">Maternal I</option>
                                <option value="Maternal II">Maternal II</option>
                                <option value="Pré I">Pré I</option>
                                <option value="Pré II">Pré II</option>
                                <option value="1º Ano">1º Ano</option>
                                <option value="2º Ano">2º Ano</option>
                                <option value="3º Ano">3º Ano</option>
                                <option value="4º Ano">4º Ano</option>
                                <option value="5º Ano">5º Ano</option>
                                <option value="6º Ano">6º Ano</option>
                                <option value="7º Ano">7º Ano</option>
                                <option value="8º Ano">8º Ano</option>
                                <option value="9º Ano">9º Ano</option>
                                {/* Add dynamically if missing */}
                                {student.class && ![
                                  'Berçário', 'Maternal I', 'Maternal II', 'Pré I', 'Pré II',
                                  '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', 
                                  '6º Ano', '7º Ano', '8º Ano', '9º Ano'
                                ].includes(student.class.replace(/ [A-Z]$/i, '')) && (
                                  <option value={student.class.replace(/ [A-Z]$/i, '')}>{student.class.replace(/ [A-Z]$/i, '')}</option>
                                )}
                            </select>
                            <input
                              type="text"
                              maxLength={1}
                              value={student.class ? (student.class.match(/ ([A-Z])$/i)?.[1] || '') : ''}
                              onChange={(e) => {
                                const prefix = student.class ? student.class.replace(/ [A-Z]$/i, '') : '6º Ano';
                                handleReviewChange(index, 'class', `${prefix} ${e.target.value.toUpperCase()}`.trim());
                              }}
                              className="w-1/3 px-2 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-200 bg-white text-center"
                              placeholder="Turma"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-4 w-40">
                          <select 
                            value={student.shift}
                            onChange={(e) => handleReviewChange(index, 'shift', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Matutino">Matutino</option>
                            <option value="Vespertino">Vespertino</option>
                            <option value="Noturno">Noturno</option>
                          </select>
                        </td>
                        <td className="py-2 px-4 text-xs text-slate-500 hidden md:table-cell max-w-xs truncate">
                          <div className="flex items-center justify-between gap-2">
                             <div className="truncate flex-1" title={student.contacts ? (student.contacts as any[]).map(c => `${c.name}: ${c.phone}`).join(' | ') : 'Sem contato'}>
                                {student.contacts && student.contacts.length > 0 ? (student.contacts as any[]).map(c => `${c.name}: ${c.phone}`).join(' | ') : 'Sem contato'}
                             </div>
                             <button
                               onClick={() => setReviewEditContactsIndex(index)}
                               className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md shrink-0 transition"
                               title="Editar Contatos"
                             >
                               <Edit2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-center w-16">
                           <button
                             onClick={() => {
                               const updated = [...pendingImports];
                               updated.splice(index, 1);
                               setPendingImports(updated);
                             }}
                             className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                             title="Remover linha"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center sm:flex-row flex-col gap-4">
              <span className="text-sm font-medium text-slate-600">
                {pendingImports.filter(s => s.error).length} linha(s) com erro(s). 
                <span className="text-green-600 ml-2">{pendingImports.filter(s => !s.error).length} linha(s) válida(s).</span>
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsReviewOpen(false); setPendingImports([]); }}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmImport}
                  disabled={pendingImports.filter(s => !s.error).length === 0 || isImporting}
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Importando...' : 'Confirmar Importação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {reviewEditContactsIndex !== null && (
        <div className="fixed inset-0 glass-overlay z-[9993] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={(e) => { if (e.target === e.currentTarget) setReviewEditContactsIndex(null); }}>
          <div className="glass-modal w-full max-w-lg p-6 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Editar Contatos: {pendingImports[reviewEditContactsIndex]?.name || 'Aluno'}
              </h3>
              <button 
                onClick={() => setReviewEditContactsIndex(null)}
                className="text-slate-400 hover:bg-slate-50 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-auto mb-6 pr-2">
              {(!pendingImports[reviewEditContactsIndex]?.contacts || pendingImports[reviewEditContactsIndex].contacts.length === 0) ? (
                <p className="text-sm text-slate-500 italic">Nenhum contato cadastrado.</p>
              ) : (
                pendingImports[reviewEditContactsIndex].contacts.map((contact: any, cIdx: number) => (
                  <div key={cIdx} className="flex gap-2">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => handleReviewContactChange(reviewEditContactsIndex, cIdx, 'name', e.target.value)}
                      placeholder="Nome do Responsável"
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => handleReviewContactChange(reviewEditContactsIndex, cIdx, 'phone', e.target.value)}
                      placeholder="Telefone"
                      className="w-1/2 flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveReviewContact(reviewEditContactsIndex, cIdx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
              
              <button
                onClick={() => handleAddReviewContact(reviewEditContactsIndex)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar outro contato
              </button>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setReviewEditContactsIndex(null)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
