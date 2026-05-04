'use client';

import React, { useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { useAppContext } from '@/lib/store';
import { Users, Plus, Upload, Download, Search, X, Edit2, Archive, Trash2, ChevronDown } from 'lucide-react';
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
  const { students, addStudent, importStudents, updateStudent, archiveStudent, getStudentPoints, getStudentBehavior, deleteAllStudents, currentUserRole } = useAppContext();
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
  const [ignoredWarning, setIgnoredWarning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Import review state
  const [pendingImports, setPendingImports] = useState<any[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewEditContactsIndex, setReviewEditContactsIndex] = useState<number | null>(null);

  // Exclusão state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');

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

  const filteredStudents = students.filter(s => {
    if (s.archived) return false;
    
    // Check class filter
    if (classFilter && s.class !== classFilter) return false;
    
    // Check search term
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    
    if (s.name.toLowerCase().includes(term) || s.class.toLowerCase().includes(term)) return true;
    if (s.contacts && s.contacts.some(c => c.name.toLowerCase().includes(term))) return true;
    return false;
  });

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
    setIgnoredWarning(false);
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
        contacts: validContacts.length > 0 ? validContacts : undefined
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
    if (fileInputRef.current) {
       fileInputRef.current.click();
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

        {/* List Card */}
        <div className="glass-card overflow-hidden mt-6 flex flex-col h-[600px]">
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-sm flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nome ou..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2 text-sm text-slate-800"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
              <div className="relative w-48 shrink-0">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm text-slate-800 appearance-none"
                >
                  <option value="">Todas as turmas</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center px-2 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                Total de alunos: <span className="font-bold text-slate-800">{filteredStudents.length}</span>
              </span>
              <button
                onClick={handleExport}
                className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Exportar Dados
              </button>

            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-white/10 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">Turma</th>
                  <th className="px-6 py-3 font-medium">Turno</th>
                  <th className="px-6 py-3 font-medium">Contatos</th>
                  <th className="px-6 py-3 font-medium">Classe Comportamental</th>
                  <th className="px-6 py-3 font-medium text-center">Nota Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} onClick={() => currentUserRole !== 'GUEST' && openEditModal(s)} className={`transition border-b border-slate-100 last:border-0 text-slate-600 ${currentUserRole !== 'GUEST' ? 'hover:bg-slate-50 cursor-pointer' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 shrink-0">
                           {s.name.charAt(0)}
                         </div>
                         <span className="truncate">{s.name}</span>
                      </td>
                      <td className="px-6 py-4">{s.class}</td>
                      <td className="px-6 py-4">{s.shift}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {s.contacts && s.contacts.length > 0 ? (
                           <div className="flex flex-col gap-1.5 mt-1">
                             {s.contacts.map((c, i) => {
                               const waLink = formatPhoneForWhatsApp(c.phone, s.name);
                               return (
                                 <div key={i} className="text-xs flex items-center gap-1.5">
                                   <span className="text-slate-400 capitalize">{c.name || 'Resp.'}:</span> 
                                   {waLink ? (
                                      <a 
                                        href={waLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium flex items-center transition"
                                      >
                                        {c.phone}
                                      </a>
                                   ) : (
                                      <span>{c.phone}</span>
                                   )}
                                 </div>
                               );
                             })}
                           </div>
                        ) : (
                           <span className="text-xs italic text-slate-400">---</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ' + (getStudentBehavior(getStudentPoints(s.id)) === 'Excepcional' ? 'bg-emerald-500/10 text-emerald-600' : getStudentBehavior(getStudentPoints(s.id)) === 'Ótimo' ? 'bg-blue-500/10 text-blue-600' : getStudentBehavior(getStudentPoints(s.id)) === 'Bom' ? 'bg-slate-500/10 text-slate-600' : getStudentBehavior(getStudentPoints(s.id)) === 'Regular' ? 'bg-yellow-500/10 text-yellow-600' : getStudentBehavior(getStudentPoints(s.id)) === 'Insuficiente' ? 'bg-rose-500/10 text-rose-600' : 'bg-red-500/10 text-red-600')}>
                          {getStudentBehavior(getStudentPoints(s.id))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-black ${getStudentPoints(s.id) >= 7 ? 'text-blue-600' : 'text-red-500'}`}>
                               {getStudentPoints(s.id).toFixed(1)}
                            </span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-500 ${getStudentPoints(s.id) >= 7 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                 style={{ width: `${getStudentPoints(s.id) * 10}%` }}
                               />
                            </div>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Novo/Editar Aluno */}
      {isModalOpen && (
        <div className="fixed inset-0 glass-overlay z-[9990] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-modal max-w-md w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingStudent ? 'Editar Aluno' : 'Cadastrar Aluno Manualmente'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto overflow-x-hidden">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                      value={className.replace(/ [A-Z]$/i, '') || '6º Ano'}
                      onChange={(e) => {
                        const letter = className.match(/ ([A-Z])$/i)?.[1] || 'A';
                        setClassName(`${e.target.value} ${letter}`);
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
                      value={className.match(/ ([A-Z])$/i)?.[1] || 'A'}
                      onChange={(e) => {
                        const prefix = className.replace(/ [A-Z]$/i, '') || '6º Ano';
                        setClassName(`${prefix} ${e.target.value}`);
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
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Noturno">Noturno</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Matrícula</label>
                  <input 
                    type="text" 
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Endereço</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rua, Número, Bairro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">CPF</label>
                  <input 
                    type="text" 
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
                <textarea 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                  placeholder="Laudos, condições de saúde, etc..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-600">Contatos dos Responsáveis</label>
                {contacts.map((contact, index) => {
                  const waLink = formatPhoneForWhatsApp(contact.phone, name);
                  return (
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
                    {waLink && (
                      <a 
                        href={waLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition shrink-0 flex items-center justify-center" 
                        title="Falar com responsável"
                      >
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      </a>
                    )}
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
                )})}
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-slate-200 mt-5 pt-5">
                {editingStudent ? (
                  <button 
                    type="button" 
                    onClick={() => { setIsDeleteConfirmOpen(true); setDeleteConfirmText(''); }}
                    className="px-4 py-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition font-medium flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4"/>
                    Arquivar
                  </button>
                ) : <div />}
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-white transition font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={!name || !className}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingStudent ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Arquivamento */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
        <div className="fixed inset-0 glass-overlay z-[9991] flex items-center justify-center p-4 animate-in fade-in duration-200">
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

      {/* Import Review Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 glass-overlay z-[9992] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                            className={`w-full px-3 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${!student.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
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
        <div className="fixed inset-0 glass-overlay z-[9993] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
