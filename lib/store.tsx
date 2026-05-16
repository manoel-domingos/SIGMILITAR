'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from './supabase';
import { 
  Student, Occurrence, Accident, Praise, DisciplineRule, Summons, ConductTerm, AuditLog, StaffMember, AppUser, AppUserRole, BehaviorClass,
  INITIAL_STUDENTS, INITIAL_OCCURRENCES, INITIAL_ACCIDENTS, INITIAL_PRAISES, INITIAL_RULES
} from './data';

interface AppState {
  students: Student[];
  occurrences: Occurrence[];
  accidents: Accident[];
  praises: Praise[];
  rules: DisciplineRule[];
  summons: Summons[];
  conductTerms: ConductTerm[];
  auditLogs: AuditLog[];
  staffMembers: StaffMember[];
  appUsers: AppUser[];
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  user: any | null;
  isGuest: boolean;
  currentUserRole: AppUserRole | 'GUEST';
  isAuthRestored: boolean;
  isDebugMode: boolean;
  geminiApiKey: string;
  groqApiKey: string;
  setIsDebugMode: (v: boolean) => void;
  setGeminiApiKey: (v: string) => void;
  setGroqApiKey: (v: string) => void;
  setGuestMode: () => void;
  setMockUser: (username: string) => void;
  logout: () => Promise<void>;
  uploadFile: (file: File, bucket: string) => Promise<string | null>;
}

interface AppContextType extends AppState {
  logAction: (action: AuditLog['action'], entityName: string, entityId: string, details: string) => Promise<void>;
  
  addAppUser: (u: Omit<AppUser, 'id'>) => Promise<void>;
  updateAppUser: (id: string, u: Partial<AppUser>) => Promise<void>;
  deleteAppUser: (id: string) => Promise<void>;

  addStudent: (s: Omit<Student, 'id'>) => Promise<void>;
  importStudents: (newStudents: Omit<Student, 'id'>[]) => Promise<void>;
  updateStudent: (id: string, s: Partial<Student>) => Promise<void>;
  archiveStudent: (id: string) => Promise<void>;
  restoreStudent: (id: string) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  deleteAllStudents: () => Promise<void>;
  refreshData: () => Promise<void>;

  addOccurrence: (o: Omit<Occurrence, 'id'>) => Promise<{ id: string; ataNumber?: number }>;
  updateOccurrence: (id: string, o: Partial<Occurrence>) => Promise<void>;
  archiveOccurrence: (id: string) => Promise<void>;
  restoreOccurrence: (id: string) => Promise<void>;
  deleteOccurrence: (id: string) => Promise<void>;
  
  addAccident: (a: Omit<Accident, 'id'>) => Promise<void>;
  updateAccident: (id: string, a: Partial<Accident>) => Promise<void>;
  archiveAccident: (id: string) => Promise<void>;
  restoreAccident: (id: string) => Promise<void>;
  deleteAccident: (id: string) => Promise<void>;
  
  addPraise: (p: Omit<Praise, 'id'>) => Promise<void>;
  updatePraise: (id: string, p: Partial<Praise>) => Promise<void>;
  archivePraise: (id: string) => Promise<void>;
  restorePraise: (id: string) => Promise<void>;
  deletePraise: (id: string) => Promise<void>;

  addSummons: (s: Omit<Summons, 'id'>) => Promise<void>;
  updateSummons: (id: string, s: Partial<Summons>) => Promise<void>;
  archiveSummons: (id: string) => Promise<void>;
  restoreSummons: (id: string) => Promise<void>;
  deleteSummons: (id: string) => Promise<void>;

  addConductTerm: (t: Omit<ConductTerm, 'id'>) => Promise<void>;
  updateConductTerm: (id: string, t: Partial<ConductTerm>) => Promise<void>;
  archiveConductTerm: (id: string) => Promise<void>;
  restoreConductTerm: (id: string) => Promise<void>;
  deleteConductTerm: (id: string) => Promise<void>;

  updateRule: (code: number, r: Partial<DisciplineRule>) => Promise<void>;
  addStaffMember: (s: Omit<StaffMember, 'id'>) => Promise<void>;
  
  getStudentPoints: (studentId: string) => number;
  getStudentBehavior: (points: number) => string;
  getStudentOccurrences: (studentId: string) => Occurrence[];
  checkRecidivism: (studentId: string, ruleCode: number, excludeId?: string) => boolean;
  getEscalationStatus: (studentId: string, ruleCode: number, excludeId?: string) => { isEscalated: boolean, reason: string, measure: string, severity: string };
}

const INITIAL_STAFF: StaffMember[] = [
  { id: 'ST1', role: 'Monitor', name: 'Murillo' },
  { id: 'ST2', role: 'Monitor', name: 'Proença' },
  { id: 'ST3', role: 'Monitor', name: 'George' },
  { id: 'ST4', role: 'Coord.', name: 'Joana' },
  { id: 'ST5', role: 'Coord.', name: 'Djeovani' },
  { id: 'ST6', role: 'G2', name: 'Maykon' },
  { id: 'ST7', role: 'G1', name: 'Manoel' },
  { id: 'ST8', role: 'Diretora', name: 'Edma' },
];

const INITIAL_APP_USERS: AppUser[] = [
  { id: 'U1', email: 'manoeldomingos2@gmail.com', name: 'Manoel', role: 'admin_global', school_id: 'DRE' },
  { id: 'U2', email: 'manoel', name: 'Manoel (Mock)', role: 'admin_global', school_id: 'DRE' },
  { id: 'U3', email: 'maykon', name: 'Maykon', role: 'GESTOR', school_id: 'joaobatista' }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [praises, setPraises] = useState<Praise[]>([]);
  const [rules, setRules] = useState<DisciplineRule[]>(INITIAL_RULES); // keep the rules
  const [summons, setSummons] = useState<Summons[]>([]);
  const [conductTerms, setConductTerms] = useState<ConductTerm[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(INITIAL_STAFF);
  const [appUsers, setAppUsers] = useState<AppUser[]>(INITIAL_APP_USERS);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isAuthRestored, setIsAuthRestored] = useState(false);

  const currentUserRole = useMemo(() => {
    if (isGuest) return 'GUEST';
    if (user && user.email) {
      const emailLower = user.email.toLowerCase();
      const isConvidadoAccount = emailLower.includes('convidado') || emailLower === 'guest' || emailLower === 'convidado@eecm.local';
      if (isConvidadoAccount) return 'GUEST';

      const matched = appUsers.find(u => u.email.toLowerCase() === emailLower);
      if (matched) return matched.role as AppUserRole;

      // Todos os usuarios logados recebem permissao de GESTOR por padrao
      return 'GESTOR';
    }
    return 'GUEST';
  }, [user, isGuest, appUsers]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eecm_debug_mode') === 'true';
    }
    return false;
  });
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eecm_gemini_key') || '';
    }
    return '';
  });
  const [groqApiKey, setGroqApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eecm_groq_key') || '';
    }
    return '';
  });

  useEffect(() => {
    localStorage.setItem('eecm_debug_mode', isDebugMode.toString());
  }, [isDebugMode]);

  useEffect(() => {
    if (geminiApiKey) localStorage.setItem('eecm_gemini_key', geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    if (groqApiKey) localStorage.setItem('eecm_groq_key', groqApiKey);
  }, [groqApiKey]);
  // appUsers persistido no Supabase via app_users — sem localStorage

  useEffect(() => {
    async function initAuthAndData() {
      let usingMockSession = false;
      // Restore session from localStorage if within 10 minutes
      // Restaurar sessão mock/guest (sem timeout - permanece até logout)
      try {
        const stored = localStorage.getItem('eecm_session');
        if (stored) {
          const { type, email } = JSON.parse(stored);
          if (type === 'mock' && email) {
            setUser({ email, role: 'admin' });
            setIsGuest(false);
            usingMockSession = true;
          } else if (type === 'guest') {
            setIsGuest(true);
            setUser(null);
            usingMockSession = true;
          }
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      }

      if (!supabase) {
        setIsAuthRestored(true);
        return;
      }

      if (!usingMockSession) {
        // Check session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
          }
        } catch (e) {
          console.error("Failed to get supabase session", e);
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
        });
      }

      setIsAuthRestored(true);

      const fetchData = async () => {
        if (!supabase) return;
        setIsSyncing(true);
        try {
          const responses = await Promise.all([
            supabase!.from('students').select('*'),
            supabase!.from('rules').select('*'),
            supabase!.from('occurrences').select('*').order('date', { ascending: false }),
            supabase!.from('accidents').select('*').order('date', { ascending: false }),
            supabase!.from('praises').select('*').order('date', { ascending: false }),
            supabase!.from('summons').select('*').order('date', { ascending: false }),
            supabase!.from('conduct_terms').select('*').order('date', { ascending: false }),
            supabase!.from('audit_logs').select('*').order('date', { ascending: false }),
            supabase!.from('user_profiles').select('*')
          ]);

          const [
            { data: studentsData },
            { data: rulesData },
            { data: occurrencesData },
            { data: accidentsData },
            { data: praisesData },
            { data: summonsData },
            { data: conductTermsData },
            { data: auditLogsData },
            { data: appUsersData }
          ] = responses;

          if (appUsersData && appUsersData.length > 0) {
            // user_profiles usa UUID como id — mapear para AppUser
            setAppUsers(appUsersData.map((u: any) => ({
              id: u.id,
              name: u.name || '',
              email: u.email || '',
              role: u.role || 'GESTOR',
              school_id: u.school_id || 'joaobatista',
            })));
          }

          if (studentsData) {
            setIsSupabaseConnected(true);
          setStudents(studentsData.map((s: any) => ({ ...s, points: 8, photoUrl: s.photo_url })));

          }
          
          if (rulesData) {
            // Normaliza dados legados do banco: corrige medida e pontos por severidade
            const normalized = rulesData.map(r => {
              const sev: string = r.severity ?? '';
              let measure = r.measure ?? '';
              let points = typeof r.points === 'number' ? r.points : parseFloat(r.points);

              // Corrige "Repreensão" e pontos antigos (-1.00) para o padrão atual
              if (sev === 'Media' || sev === 'Média') {
                if (measure === 'Repreensão' || measure === 'Advertência Oral' || points === -1 || points < -0.30) {
                  measure = 'Advertência Escrita';
                  points = -0.30;
                }
              }
              if (sev === 'Leve' && (points < -0.10 || points > -0.09)) {
                points = -0.10;
                measure = 'Advertência Oral';
              }

              return { ...r, ruleCode: r.code, measure, points };
            });

            setRules(normalized);

            // Persiste correções de volta ao Supabase (somente linhas que mudaram)
            const toFix = normalized.filter((r, i) =>
              r.measure !== rulesData[i].measure || r.points !== rulesData[i].points
            );
            if (toFix.length > 0 && supabase) {
              toFix.forEach(r => {
                supabase!.from('rules').update({ measure: r.measure, points: r.points }).eq('code', r.code);
              });
            }
          }
          if (occurrencesData) {
            setOccurrences(occurrencesData.map((o: any) => {
              const allCodes = Array.isArray(o.rule_code) ? o.rule_code.map(Number) : [Number(o.rule_code)];
              return {
                id: o.id,
                ataNumber: o.ata_number,
                date: o.date,
                hour: o.hour,
                location: o.location,
                locatedBy: o.located_by,
                ruleCode: allCodes[0],
                ruleCodes: allCodes,
                studentId: String(o.student_id),
                studentIds: o.student_ids || [String(o.student_id)],
                registeredBy: o.registered_by,
                observations: o.observations,
                videoUrls: o.video_urls || (o.video_url ? [o.video_url] : []),
                signedDocUrls: o.signed_doc_urls || (o.signed_doc_url ? [o.signed_doc_url] : []),
                archived: o.archived || false,
                createdAt: o.created_at
              };
            }));
          }
          if (accidentsData) setAccidents(accidentsData.map(a => ({...a, studentId: a.student_id, registeredBy: a.registered_by, bodyPart: a.body_part, parentsNotified: a.parents_notified, medicForwarded: a.medic_forwarded})));
          if (praisesData) setPraises(praisesData.map(p => ({
            ...p, 
            studentId: p.student_id, 
            registeredBy: p.registered_by,
            type: p.article || p.type 
          })));
          if (summonsData) setSummons(summonsData.map((s: any) => ({...s, studentId: s.student_id, registeredBy: s.registered_by})));
          if (conductTermsData) setConductTerms(conductTermsData.map((t: any) => ({...t, studentId: t.student_id, registeredBy: t.registered_by, guardianName: t.guardian_name})));
          if (auditLogsData) setAuditLogs(auditLogsData.map((l: any) => ({...l, entityName: l.entity_name, entityId: l.entity_id, userEmail: l.user_email})));
        } catch (err) {
          console.error("Initial data fetch failed", err);
        } finally {
          setIsSyncing(false);
        }
      };

      await fetchData();

      // Real-time Subscriptions
      const tables = ['students', 'occurrences', 'accidents', 'praises', 'summons', 'conduct_terms', 'audit_logs', 'rules'];
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          console.log('Change detected, refreshing data...');
          fetchData();
        })
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    }
    
    initAuthAndData();
  }, []);

  // Pasta central de documentos no Google Drive — repositório principal
  const DRIVE_FOLDER_ID = '1_aj5b9ukcApeUzSs2dFgIdgHclW4uYbk';
  const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/' + DRIVE_FOLDER_ID;

  const uploadFile = async (file: File, studentId: string): Promise<string | null> => {
    if (!supabase) {
      console.error("[v0] Supabase não inicializado");
      return null;
    }

    try {
      console.log("[v0] Iniciando upload:", { fileName: file.name, fileSize: file.size, studentId });
      
      // Cria caminho: student-files/[studentId]/[timestamp]-[filename]
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${studentId}/${timestamp}-${sanitizedFileName}`;

      console.log("[v0] Caminho do arquivo:", filePath);

      // Faz upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('student-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("[v0] Erro no upload:", error.message);
        return null;
      }

      console.log("[v0] Upload completado, gerando URL pública...");

      // Retorna URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from('student-files')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;
      console.log("[v0] URL pública gerada:", publicUrl);
      return publicUrl || null;
    } catch (err) {
      console.error("[v0] Upload falhou:", err);
      return null;
    }
  };

  const logAction = async (action: AuditLog['action'], entityName: string, entityId: string, details: string) => {
    const userEmail = user?.email || (isGuest ? 'Somente Leitura' : 'Gestor Escolar');
    
    // Default system log logic
    const newLog: Omit<AuditLog, 'id'> = {
      date: new Date().toISOString(),
      action,
      entityName,
      entityId,
      details,
      userEmail
    };

    if (supabase && isSupabaseConnected) {
      try {
        const { data, error } = await supabase!.from('audit_logs').insert([{
          date: newLog.date,
          action: newLog.action,
          entity_name: newLog.entityName,
          entity_id: newLog.entityId,
          details: newLog.details,
          user_email: newLog.userEmail
        }]).select().single();
        
        if (!error && data) {
          setAuditLogs(prev => [{...data, entityName: data.entity_name, entityId: data.entity_id, userEmail: data.user_email}, ...prev]);
          return;
        }
      } catch (err) {
        console.error('Audit log failed', err);
      }
    }
    setAuditLogs(prev => [{ ...newLog, id: 'LOG' + (prev.length + 1) }, ...prev]);
  };

  const checkWriteAccess = () => {
    if (currentUserRole === 'GUEST') {
      alert('Acesso Negado: Você tem permissão de Somente Leitura. Operação cancelada.');
      throw new Error('Acesso Somente Leitura');
    }
  };

  const addAppUser = async (u: Omit<AppUser, 'id'>) => {
    if (currentUserRole !== 'GESTOR' && currentUserRole !== 'admin_global') {
      alert('Acesso Negado: Apenas gestores podem gerenciar usuários.');
      return;
    }
    if (supabase && isSupabaseConnected) {
      try {
        const { data, error } = await supabase.from('user_profiles').insert([{
          name: u.name, email: u.email, role: u.role, school_id: u.school_id
        }]).select().single();
        if (error) throw error;
        if (data) setAppUsers(prev => [...prev, { id: data.id, name: data.name || '', email: data.email || '', role: data.role || 'GESTOR', school_id: data.school_id || 'joaobatista' }]);
      } catch (err: any) {
        console.error("Error adding user:", err);
        alert('Erro ao salvar usuário: ' + err.message);
      }
      return;
    }
    const newId = crypto.randomUUID();
    setAppUsers(prev => [...prev, { ...u, id: newId }]);
  };

  const updateAppUser = async (id: string, u: Partial<AppUser>) => {
    if (currentUserRole !== 'GESTOR' && currentUserRole !== 'admin_global') return;
    if (supabase && isSupabaseConnected) {
      try {
        const { error } = await supabase.from('user_profiles').update({
          name: u.name, email: u.email, role: u.role, school_id: u.school_id
        }).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Error updating user:", err);
      }
    }
    setAppUsers(prev => prev.map(item => item.id === id ? { ...item, ...u } : item));
  };

  const deleteAppUser = async (id: string) => {
    if (currentUserRole !== 'GESTOR' && currentUserRole !== 'admin_global') return;
    if (supabase && isSupabaseConnected) {
      try {
        const { error } = await supabase.from('user_profiles').delete().eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Error deleting user:", err);
      }
    }
    
    setAppUsers(prev => prev.filter(item => item.id !== id));
  };

  const addStudent = async (s: Omit<Student, 'id'>) => {
    checkWriteAccess();
    let newId = 'S' + (students.length + 1);
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {
        name: s.name,
        class: s.class,
        shift: s.shift,
        observation: s.observation,
        address: s.address,
        cpf: s.cpf,
        contacts: s.contacts,
        archived: s.archived || false
        // registration_number e birth_date comentados ate as colunas serem criadas no banco
      };
      try {
        const { data, error } = await supabase!.from('students').insert([dbPayload]).select().single();
        if (error) throw error;
        if (data) {
          setStudents(prev => [...prev, { 
            ...data, 
            points: 8,
            registrationNumber: data.registration_number,
            birthDate: data.birth_date,
            photoUrl: data.photo_url
          }]);
          newId = data.id;
          logAction('CREATE', 'Aluno', newId, 'Adicionado aluno: ' + s.name);
          return;
        }
      } catch (err: any) {
        console.error("Supabase insert error (student):", err);
        alert('Erro ao salvar no banco de dados: ' + (err.message || JSON.stringify(err)));
        return;
      }
    }
    setStudents(prev => [...prev, { ...s, id: newId, points: 8 }]);
    logAction('CREATE', 'Aluno', newId, 'Adicionado aluno (LOCAL): ' + s.name);
  };

  const importStudents = async (newStudents: Omit<Student, 'id'>[]) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) {
      try {
        // Intelligence: Check for existing students to preserve IDs and avoid duplicates
        const { data: existingStudents } = await supabase!.from('students').select('id, name, class');
        
        const studentsToUpsert = newStudents.map(ns => {
          // Try to find a match by exact name and class if matched in DB
          if (existingStudents) {
             const match = existingStudents.find(es => 
               es.name.toLowerCase().trim() === ns.name.toLowerCase().trim() && 
               es.class.toLowerCase().trim() === ns.class.toLowerCase().trim()
             );
             if (match) {
                return { ...ns, id: match.id };
             }
          }
          return { ...ns, id: crypto.randomUUID() };
        });

        const { data, error } = await supabase!.from('students').upsert(studentsToUpsert, { onConflict: 'id' }).select();
        if (error) {
          console.error("Import error details:", error);
          alert('Erro na importa\u00e7\u00e3o: ' + error.message);
          return;
        }
        if (data) {
          const mapped = data.map((d: any) => ({ ...d, points: 8 }));
          // Refresh the whole list to ensure correctness
          await refreshData();
          logAction('SYSTEM', 'Aluno', 'LOTE', 'Importados/Atualizados ' + mapped.length + ' alunos');
        }
      } catch (err) {
        console.error("Detailed import exception:", err);
        alert('Falha crítica na comunicação com o servidor durante a importação.');
      }
      return;
    }
    
    const mappedLocal = newStudents.map((s, idx) => ({ ...s, id: 'S' + Date.now() + '_' + idx }));
    setStudents(prev => [...prev, ...mappedLocal]);
    logAction('SYSTEM', 'Aluno', 'LOTE', 'Importados ' + mappedLocal.length + ' alunos localmente');
  };

  const updateStudent = async (id: string, s: Partial<Student>) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {};
      if (s.name) dbPayload.name = s.name;
      if (s.class) dbPayload.class = s.class;
      if (s.shift) dbPayload.shift = s.shift;
      if (s.observation !== undefined) dbPayload.observation = s.observation;
      if (s.address !== undefined) dbPayload.address = s.address;
      if (s.cpf !== undefined) dbPayload.cpf = s.cpf;
      if (s.contacts) dbPayload.contacts = s.contacts;
      // registration_number comentado ate a coluna ser criada no banco
      // if (s.registrationNumber !== undefined) dbPayload.registration_number = s.registrationNumber;
      // birth_date comentado ate a coluna ser criada no banco
      // if (s.birthDate !== undefined) dbPayload.birth_date = s.birthDate;
      if (s.archived !== undefined) dbPayload.archived = s.archived;
      if (s.photoUrl !== undefined) dbPayload.photo_url = s.photoUrl;

      try {
        const { error } = await supabase!.from('students').update(dbPayload).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Update error:", err);
      }
    }
    setStudents(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
    logAction('UPDATE', 'Aluno', id, 'Atualizado aluno: ' + (s.name || id));
  };

  const archiveStudent = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('students').update({ archived: true }).eq('id', id);
    setStudents(prev => prev.map(item => item.id === id ? { ...item, archived: true } : item));
    logAction('UPDATE', 'Aluno', id, 'Arquivado aluno: ' + id);
  };

  const deleteStudent = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('students').delete().eq('id', id);
    setStudents(prev => prev.filter(item => item.id !== id));
    logAction('DELETE', 'Aluno', id, 'Excu\u00eddo aluno definitivamente: ' + id);
  };

  const restoreStudent = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('students').update({ archived: false }).eq('id', id);
    setStudents(prev => prev.map(item => item.id === id ? { ...item, archived: false } : item));
    logAction('UPDATE', 'Aluno', id, 'Restaurado aluno: ' + id);
  };

  const addStaffMember = async (s: Omit<StaffMember, 'id'>) => {
    if (supabase && isSupabaseConnected) {
      // Salva no Supabase
      const { data, error } = await supabase
        .from('staff_members')
        .insert({ name: s.name, role: s.role })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar membro:', error);
        return;
      }
      
      setStaffMembers(prev => [...prev, { ...s, id: data.id }]);
      logAction('CREATE', 'Membro Equipe', data.id, 'Adicionado membro: ' + s.role + ' ' + s.name);
    } else {
      // Fallback local
      const newId = 'ST' + (staffMembers.length + 1);
      setStaffMembers(prev => [...prev, { ...s, id: newId }]);
      logAction('CREATE', 'Membro Equipe', newId, 'Adicionado membro: ' + s.role + ' ' + s.name);
    }
  };

  const refreshData = async () => {
    if (!supabase || !isSupabaseConnected) return;
    setIsSyncing(true);
    try {
      const responses = await Promise.all([
        supabase!.from('students').select('*'),
        supabase!.from('occurrences').select('*').order('date', { ascending: false }),
        supabase!.from('accidents').select('*').order('date', { ascending: false }),
        supabase!.from('praises').select('*').order('date', { ascending: false }),
        supabase!.from('summons').select('*').order('date', { ascending: false }),
        supabase!.from('conduct_terms').select('*').order('date', { ascending: false }),
        supabase!.from('audit_logs').select('*').order('date', { ascending: false }),
        supabase!.from('staff_members').select('*').order('name', { ascending: true })
      ]);
      
      const [
        { data: studentsData },
        { data: occurrencesData },
        { data: accidentsData },
        { data: praisesData },
        { data: summonsData },
        { data: conductTermsData },
        { data: auditLogsData },
        { data: staffData }
      ] = responses;

      if (studentsData) setStudents(studentsData.map(s => ({ ...s, points: 8 })));
      if (occurrencesData) setOccurrences(occurrencesData.map((o: any) => {
        const allCodes = Array.isArray(o.rule_code) ? o.rule_code.map(Number) : [Number(o.rule_code)];
        return {
          id: o.id,
          date: o.date,
          hour: o.hour,
          location: o.location,
          locatedBy: o.located_by,
          ruleCode: allCodes[0],
          ruleCodes: allCodes,
          studentId: String(o.student_id),
          studentIds: o.student_ids || [String(o.student_id)],
          registeredBy: o.registered_by,
          observations: o.observations,
          videoUrls: o.video_urls || (o.video_url ? [o.video_url] : []),
          signedDocUrls: o.signed_doc_urls || (o.signed_doc_url ? [o.signed_doc_url] : []),
          archived: o.archived || false,
          createdAt: o.created_at
        };
      }));
      if (accidentsData) setAccidents(accidentsData.map(a => ({...a, studentId: a.student_id, registeredBy: a.registered_by, bodyPart: a.body_part, parentsNotified: a.parents_notified, medicForwarded: a.medic_forwarded})));
      if (praisesData) setPraises(praisesData.map(p => ({
        ...p, 
        studentId: p.student_id, 
        registeredBy: p.registered_by,
        type: p.article || p.type
      })));
      if (summonsData) setSummons(summonsData.map((s: any) => ({...s, studentId: s.student_id, registeredBy: s.registered_by})));
      if (conductTermsData) setConductTerms(conductTermsData.map((t: any) => ({...t, studentId: t.student_id, registeredBy: t.registered_by, guardianName: t.guardian_name})));
      if (auditLogsData) setAuditLogs(auditLogsData.map((l: any) => ({...l, entityName: l.entity_name, entityId: l.entity_id, userEmail: l.user_email})));
      if (staffData) setStaffMembers(staffData.map((s: any) => ({ id: s.id, name: s.name, role: s.role })));
      
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteAllStudents = async () => {
    checkWriteAccess();
    if (currentUserRole !== 'GESTOR') {
      alert('Acesso Negado: Apenas gestores podem realizar esta ação destrutiva.');
      return;
    }
    if (supabase && isSupabaseConnected) {
      try {
        // Exclui em massa se possível
        const { error } = await supabase!.from('students').delete().neq('id', 'placeholder_id_to_allow_mass_delete');
        if (error) {
           // Se o delete em massa for bloqueado, tenta excluir um por um os que estão no estado local
           console.warn("Mass delete failed, trying sequential delete...", error);
           for (const student of students) {
             await supabase!.from('students').delete().eq('id', student.id);
           }
        }
      } catch (err) {
        console.error("Delete all exception:", err);
        alert('Falha crítica ao tentar apagar os alunos do servidor. Tente atualizar a página.');
        return;
      }
    }
    setStudents([]);
    logAction('DELETE', 'Aluno', 'ALL', 'Todos os alunos foram excluídos');
  };

  const addOccurrence = async (o: Omit<Occurrence, 'id'>): Promise<{ id: string; ataNumber?: number }> => {
    checkWriteAccess();
    let newId = 'O' + (occurrences.length + 1);
    let ataNumber: number | undefined;
    if (supabase && isSupabaseConnected) {
      // Create a base payload with columns we know exist based on our fetch logic
      const dbPayload: any = {
        student_id: o.studentId,
        date: o.date,
        hour: o.hour || null,
        location: o.location || null,
        located_by: o.locatedBy || null,
        rule_code: o.ruleCodes && o.ruleCodes.length > 0 ? o.ruleCodes : [o.ruleCode],
        registered_by: o.registeredBy,
        observations: o.observations || null,
        video_urls: o.videoUrls || [],
        signed_doc_urls: o.signedDocUrls || [],
        archived: o.archived || false
      };

      // Handle optional fields that might be missing from schema by 
      // check if they would fail or if we should just omit them.
      // Based on error report 'aggravating_factors' is missing.
      // We'll append these details to observations to avoid data loss.
      let enhancedObservations = o.observations || '';
      
      if (o.measures && o.measures.length > 0) {
        enhancedObservations += '\nMedidas: ' + o.measures.join(', ');
      } else if (o.measure) {
        enhancedObservations += '\nMedida: ' + o.measure;
      }
      if (o.durationDays) {
        enhancedObservations += '\nDura\u00e7\u00e3o: ' + o.durationDays + ' dias';
      }
      if (o.attenuatingFactors && o.attenuatingFactors.length > 0) {
        enhancedObservations += '\nAtenuantes: ' + o.attenuatingFactors.join(', ');
      }
      if (o.aggravatingFactors && o.aggravatingFactors.length > 0) {
        enhancedObservations += '\nAgravantes: ' + o.aggravatingFactors.join(', ');
      }
      if (o.studentIds && o.studentIds.length > 1) {
        const otherStudents = o.studentIds.filter(id => id !== o.studentId);
        enhancedObservations += '\nOutros alunos envolvidos: ' + otherStudents.join(', ');
      }

      dbPayload.observations = enhancedObservations.trim() || null;

      try {
        const { data, error } = await supabase!.from('occurrences').insert([dbPayload]).select().single();
        if (error) {
          console.error("Supabase insert error (occurrence):", error);
          alert('Erro ao salvar ocorrência no servidor: ' + error.message);
          throw error;
        }
        if (data) {
          ataNumber = data.ata_number;
          setOccurrences(prev => [{
            id: data.id,
            ataNumber: data.ata_number,
            date: data.date,
            hour: data.hour,
            location: data.location,
            locatedBy: data.located_by,
            ruleCode: Array.isArray(data.rule_code) ? Number(data.rule_code[0]) : Number(data.rule_code),
            ruleCodes: Array.isArray(data.rule_code) ? data.rule_code.map(Number) : [Number(data.rule_code)],
            studentId: String(data.student_id),
            studentIds: o.studentIds || [String(data.student_id)],
            registeredBy: data.registered_by,
            observations: data.observations,
            videoUrls: data.video_urls || [],
            signedDocUrls: data.signed_doc_urls || [],
            attenuatingFactors: o.attenuatingFactors || [],
            aggravatingFactors: o.aggravatingFactors || [],
            measure: o.measure,
            measures: o.measures || [],
            resolved: o.resolved || false,
            resolvedAt: o.resolvedAt,
            durationDays: o.durationDays,
            archived: data.archived || false
          }, ...prev]);
          newId = data.id;
          logAction('CREATE', 'Ocorrência', newId, 'Adicionada ocorrência para ' + (o.studentIds?.length || 1) + ' alunos (Art. ' + o.ruleCode + ')');
          return { id: newId, ataNumber };
        }
      } catch (err: any) {
        console.error("Occurrence insert error:", err);
        throw err; // Re-throw to handle in UI
      }
      // Retorna objeto com ID e ataNumber se disponível (fallback se data vazio)
      return { id: newId, ataNumber };
    } else {
      // Fallback local (sem Supabase)
      const finalId = 'O' + (occurrences.length + 1);
      setOccurrences(prev => [{ ...o, id: finalId, measures: o.measures || [], resolved: o.resolved || false }, ...prev]);
      logAction('CREATE', 'Ocorrência', finalId, 'Adicionada ocorrência (LOCAL) para ' + (o.studentIds?.length || 1) + ' alunos (Art. ' + o.ruleCode + ')');
      return { id: finalId };
    }
  };

  const updateOccurrence = async (id: string, o: Partial<Occurrence>) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {};
      if (o.studentId) dbPayload.student_id = o.studentId;
      if (o.date) dbPayload.date = o.date;
      if (o.hour) dbPayload.hour = o.hour;
      if (o.location) dbPayload.location = o.location;
      if (o.locatedBy) dbPayload.located_by = o.locatedBy;
      if (o.ruleCodes && o.ruleCodes.length > 0) {
        dbPayload.rule_code = o.ruleCodes;
      } else if (o.ruleCode !== undefined) {
        dbPayload.rule_code = [o.ruleCode];
      }
      if (o.registeredBy) dbPayload.registered_by = o.registeredBy;
      
      // Handle observations with optional fields
      if (o.observations !== undefined || o.measure || o.durationDays || o.attenuatingFactors || o.aggravatingFactors) {
        const existing = occurrences.find(item => item.id === id);
        let enhancedObservations = o.observations !== undefined ? o.observations : (existing?.observations || '');
        
        // Only append if they are being updated or if we're building a new observations string
        if (o.measure) enhancedObservations += '\nMedida: ' + o.measure;
        if (o.durationDays) enhancedObservations += '\nDura\u00e7\u00e3o: ' + o.durationDays + ' dias';
        if (o.attenuatingFactors && o.attenuatingFactors.length > 0) enhancedObservations += '\nAtenuantes: ' + o.attenuatingFactors.join(', ');
        if (o.aggravatingFactors && o.aggravatingFactors.length > 0) enhancedObservations += '\nAgravantes: ' + o.aggravatingFactors.join(', ');

        dbPayload.observations = enhancedObservations.trim();
      }

      if (o.videoUrls) dbPayload.video_urls = o.videoUrls;
      if (o.signedDocUrls) dbPayload.signed_doc_urls = o.signedDocUrls;
      if (o.archived !== undefined) dbPayload.archived = o.archived;
      
      try {
        const { error } = await supabase!.from('occurrences').update(dbPayload).eq('id', id);
        if (error) {
          console.error("Supabase update error (occurrence):", error);
          alert('Erro ao atualizar ocorr\u00eancia no servidor: ' + error.message);
          throw error;
        }
      } catch (err: any) {
        console.error("Occurrence update error:", err);
        throw err; // Re-throw to handle in UI
      }
    }
    setOccurrences(prev => prev.map(item => item.id === id ? { ...item, ...o } : item));
    logAction('UPDATE', 'Ocorr\u00eancia', id, 'Atualizada ocorr\u00eancia ' + id);
  };

  const archiveOccurrence = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('occurrences').update({ archived: true }).eq('id', id);
    setOccurrences(prev => prev.map(item => item.id === id ? { ...item, archived: true } : item));
    logAction('UPDATE', 'Ocorr\u00eancia', id, 'Arquivada ocorr\u00eancia ' + id);
  };

  const deleteOccurrence = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('occurrences').delete().eq('id', id);
    setOccurrences(prev => prev.filter(item => item.id !== id));
    logAction('DELETE', 'Ocorr\u00eancia', id, 'Excu\u00edda ocorr\u00eancia definitivamente ' + id);
  };

  const restoreOccurrence = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('occurrences').update({ archived: false }).eq('id', id);
    setOccurrences(prev => prev.map(item => item.id === id ? { ...item, archived: false } : item));
    logAction('UPDATE', 'Ocorr\u00eancia', id, 'Restaurada ocorr\u00eancia ' + id);
  };

  const addAccident = async (a: Omit<Accident, 'id'>) => {
    checkWriteAccess();
    let newId = 'A' + (accidents.length + 1);
    if (supabase && isSupabaseConnected) {
       const dbPayload = {
        student_id: a.studentId,
        date: a.date,
        location: a.location,
        type: a.type,
        description: a.description,
        body_part: a.bodyPart,
        registered_by: a.registeredBy,
        parents_notified: a.parentsNotified,
        medic_forwarded: a.medicForwarded,
        observations: a.observations
      };
      try {
        const { data, error } = await supabase!.from('accidents').insert([dbPayload]).select().single();
        if (error) throw error;
        if (data) {
          setAccidents(prev => [{...data, studentId: data.student_id, registeredBy: data.registered_by, bodyPart: data.body_part, parentsNotified: data.parents_notified, medicForwarded: data.medic_forwarded}, ...prev]);
          newId = data.id;
          logAction('CREATE', 'Acidente', newId, 'Adicionado acidente para o aluno ID: ' + a.studentId);
          return;
        }
      } catch (err: any) {
        console.error("Accident insert error:", err);
        alert('Erro ao salvar acidente no servidor: ' + err.message);
        return;
      }
    }
    setAccidents(prev => [{ ...a, id: newId }, ...prev]);
    logAction('CREATE', 'Acidente', newId, 'Adicionado acidente (LOCAL) para o aluno ID: ' + a.studentId);
  };

  const updateAccident = async (id: string, a: Partial<Accident>) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {};
      if (a.studentId) dbPayload.student_id = a.studentId;
      if (a.date) dbPayload.date = a.date;
      if (a.location) dbPayload.location = a.location;
      if (a.type) dbPayload.type = a.type;
      if (a.description) dbPayload.description = a.description;
      if (a.bodyPart) dbPayload.body_part = a.bodyPart;
      if (a.registeredBy) dbPayload.registered_by = a.registeredBy;
      if (a.parentsNotified !== undefined) dbPayload.parents_notified = a.parentsNotified;
      if (a.medicForwarded !== undefined) dbPayload.medic_forwarded = a.medicForwarded;
      if (a.observations !== undefined) dbPayload.observations = a.observations;

      try {
        const { error } = await supabase!.from('accidents').update(dbPayload).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Accident update error:", err);
        alert('Erro ao atualizar acidente no servidor: ' + err.message);
        throw err;
      }
    }
    setAccidents(prev => prev.map(item => item.id === id ? { ...item, ...a } : item));
    logAction('UPDATE', 'Acidente', id, 'Atualizado acidente ' + id);
  };

  const archiveAccident = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('accidents').update({ archived: true }).eq('id', id);
    setAccidents(prev => prev.map(item => item.id === id ? { ...item, archived: true } : item));
    logAction('UPDATE', 'Acidente', id, 'Arquivado acidente ' + id);
  };

  const deleteAccident = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('accidents').delete().eq('id', id);
    setAccidents(prev => prev.filter(item => item.id !== id));
    logAction('DELETE', 'Acidente', id, 'Excu\u00eddo acidente definitivamente ' + id);
  };

  const restoreAccident = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('accidents').update({ archived: false }).eq('id', id);
    setAccidents(prev => prev.map(item => item.id === id ? { ...item, archived: false } : item));
    logAction('UPDATE', 'Acidente', id, 'Restaurado acidente ' + id);
  };

  const addPraise = async (p: Omit<Praise, 'id'>) => {
    checkWriteAccess();
    let newId = 'P' + (praises.length + 1);
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {
        student_id: p.studentId,
        date: p.date,
        article: p.type,
        description: p.description,
        registered_by: p.registeredBy
      };
      try {
        const { data, error } = await supabase!.from('praises').insert([dbPayload]).select().single();
        if (error) throw error;
        if (data) {
          setPraises(prev => [{ ...data, studentId: data.student_id, registeredBy: data.registered_by }, ...prev]);
          newId = data.id;
          logAction('CREATE', 'Elogio', newId, 'Adicionado elogio para o aluno ID: ' + p.studentId);
          return;
        }
      } catch (err: any) {
        console.error("Praise insert error:", err);
        alert('Erro ao salvar elogio no servidor: ' + err.message);
        return;
      }
    }
    setPraises(prev => [{ ...p, id: newId }, ...prev]);
    logAction('CREATE', 'Elogio', newId, 'Adicionado elogio (LOCAL) para o aluno ID: ' + p.studentId);
  };

  const updatePraise = async (id: string, p: Partial<Praise>) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {};
      if (p.studentId) dbPayload.student_id = p.studentId;
      if (p.date) dbPayload.date = p.date;
      if (p.type) dbPayload.article = p.type;
      if (p.description) dbPayload.description = p.description;
      if (p.registeredBy) dbPayload.registered_by = p.registeredBy;

      try {
        const { error } = await supabase!.from('praises').update(dbPayload).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Praise update error:", err);
        alert('Erro ao atualizar elogio no servidor: ' + err.message);
        throw err;
      }
    }
    setPraises(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
    logAction('UPDATE', 'Elogio', id, 'Atualizado elogio ' + id);
  };

  const archivePraise = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('praises').update({ archived: true }).eq('id', id);
    setPraises(prev => prev.map(item => item.id === id ? { ...item, archived: true } : item));
    logAction('UPDATE', 'Elogio', id, 'Arquivado elogio ' + id);
  };

  const deletePraise = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('praises').delete().eq('id', id);
    setPraises(prev => prev.filter(item => item.id !== id));
    logAction('DELETE', 'Elogio', id, 'Excu\u00eddo elogio definitivamente ' + id);
  };

  const restorePraise = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('praises').update({ archived: false }).eq('id', id);
    setPraises(prev => prev.map(item => item.id === id ? { ...item, archived: false } : item));
    logAction('UPDATE', 'Elogio', id, 'Restaurado elogio ' + id);
  };

  const updateRule = async (code: number, r: Partial<DisciplineRule>) => {
    if (currentUserRole !== 'GESTOR') {
      alert('Acesso Negado: Apenas gestores podem modificar as regras da institui\u00e7\u00e3o.');
      return;
    }
    if (supabase && isSupabaseConnected) {
      await supabase!.from('rules').update(r).eq('code', code);
    }
    setRules(prev => prev.map(item => item.code === code ? { ...item, ...r } : item));
    logAction('UPDATE', 'Regra', String(code), 'Atualizada regra disciplinar Art. ' + code);
  };

  const addSummons = async (s: Omit<Summons, 'id'>) => {
    checkWriteAccess();
    let newId = 'SUMM' + (summons.length + 1);
    if (supabase && isSupabaseConnected) {
      const dbPayload = {
        student_id: s.studentId,
        date: s.date,
        time: s.time,
        reason: s.reason,
        department: s.department,
        registered_by: s.registeredBy
      };
      try {
        const { data, error } = await supabase!.from('summons').insert([dbPayload]).select().single();
        if (error) throw error;
        if (data) {
           setSummons(prev => [{...data, studentId: data.student_id, registeredBy: data.registered_by}, ...prev]);
           newId = data.id;
           logAction('CREATE', 'Convoca\u00e7\u00e3o', newId, 'Adicionada convoca\u00e7\u00e3o para o aluno ID: ' + s.studentId);
           return;
        }
      } catch (err: any) {
        console.error("Summons insert error:", err);
        alert('Erro ao salvar convoca\u00e7\u00e3o no servidor: ' + err.message);
        return;
      }
    }
    setSummons(prev => [{ ...s, id: newId }, ...prev]);
    logAction('CREATE', 'Convoca\u00e7\u00e3o', newId, 'Adicionada convoca\u00e7\u00e3o (LOCAL) para o aluno ID: ' + s.studentId);
  };

  const updateSummons = async (id: string, s: Partial<Summons>) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {};
      if (s.studentId) dbPayload.student_id = s.studentId;
      if (s.date) dbPayload.date = s.date;
      if (s.time) dbPayload.time = s.time;
      if (s.reason) dbPayload.reason = s.reason;
      if (s.department) dbPayload.department = s.department;
      if (s.registeredBy) dbPayload.registered_by = s.registeredBy;
      
      try {
        const { error } = await supabase!.from('summons').update(dbPayload).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Summons update error:", err);
        alert('Erro ao atualizar convoca\u00e7\u00e3o no servidor: ' + err.message);
        throw err;
      }
    }
    setSummons(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
    logAction('UPDATE', 'Convoca\u00e7\u00e3o', id, 'Atualizada convoca\u00e7\u00e3o ' + id);
  };

  const archiveSummons = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('summons').update({ archived: true }).eq('id', id);
    setSummons(prev => prev.map(item => item.id === id ? { ...item, archived: true } : item));
    logAction('UPDATE', 'Convoca\u00e7\u00e3o', id, 'Arquivada convoca\u00e7\u00e3o ' + id);
  };

  const deleteSummons = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('summons').delete().eq('id', id);
    setSummons(prev => prev.filter(item => item.id !== id));
    logAction('DELETE', 'Convoca\u00e7\u00e3o', id, 'Excu\u00edda convoca\u00e7\u00e3o definitivamente ' + id);
  };

  const restoreSummons = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('summons').update({ archived: false }).eq('id', id);
    setSummons(prev => prev.map(item => item.id === id ? { ...item, archived: false } : item));
    logAction('UPDATE', 'Convoca\u00e7\u00e3o', id, 'Restaurada convoca\u00e7\u00e3o ' + id);
  };

  const addConductTerm = async (t: Omit<ConductTerm, 'id'>) => {
    checkWriteAccess();
    let newId = 'TAC' + (conductTerms.length + 1);
    if (supabase && isSupabaseConnected) {
      const dbPayload = {
        student_id: t.studentId,
        date: t.date,
        guardian_name: t.guardianName,
        commitments: t.commitments,
        registered_by: t.registeredBy
      };
      try {
        const { data, error } = await supabase!.from('conduct_terms').insert([dbPayload]).select().single();
        if (error) throw error;
        if (data) {
           setConductTerms(prev => [{...data, studentId: data.student_id, registeredBy: data.registered_by, guardianName: data.guardian_name}, ...prev]);
           newId = data.id;
           logAction('CREATE', 'Termo de Conduta', newId, 'Adicionado TAC para o aluno ID: ' + t.studentId);
           return;
        }
      } catch (err: any) {
        console.error("Conduct term insert error:", err);
        alert('Erro ao salvar TAC no servidor: ' + err.message);
        return;
      }
    }
    setConductTerms(prev => [{ ...t, id: newId }, ...prev]);
    logAction('CREATE', 'Termo de Conduta', newId, 'Adicionado TAC (LOCAL) para o aluno ID: ' + t.studentId);
  };

  const updateConductTerm = async (id: string, t: Partial<ConductTerm>) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) {
      const dbPayload: any = {};
      if (t.studentId) dbPayload.student_id = t.studentId;
      if (t.date) dbPayload.date = t.date;
      if (t.guardianName) dbPayload.guardian_name = t.guardianName;
      if (t.commitments) dbPayload.commitments = t.commitments;
      if (t.registeredBy) dbPayload.registered_by = t.registeredBy;

      try {
        const { error } = await supabase!.from('conduct_terms').update(dbPayload).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Conduct term update error:", err);
        alert('Erro ao atualizar TAC no servidor: ' + err.message);
        throw err;
      }
    }
    setConductTerms(prev => prev.map(item => item.id === id ? { ...item, ...t } : item));
    logAction('UPDATE', 'Termo de Conduta', id, 'Atualizado TAC ' + id);
  };

  const archiveConductTerm = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('conduct_terms').update({ archived: true }).eq('id', id);
    setConductTerms(prev => prev.map(item => item.id === id ? { ...item, archived: true } : item));
    logAction('UPDATE', 'Termo de Conduta', id, 'Arquivado TAC ' + id);
  };

  const deleteConductTerm = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('conduct_terms').delete().eq('id', id);
    setConductTerms(prev => prev.filter(item => item.id !== id));
    logAction('DELETE', 'Termo de Conduta', id, 'Excu\u00eddo TAC definitivamente ' + id);
  };

  const restoreConductTerm = async (id: string) => {
    checkWriteAccess();
    if (supabase && isSupabaseConnected) await supabase.from('conduct_terms').update({ archived: false }).eq('id', id);
    setConductTerms(prev => prev.map(item => item.id === id ? { ...item, archived: false } : item));
    logAction('UPDATE', 'Termo de Conduta', id, 'Restaurado TAC ' + id);
  };

  const getStudentOccurrences = (studentId: string) => occurrences.filter(o => {
    const matchesId = o.studentId === studentId || (o.studentIds && o.studentIds.includes(studentId));
    return matchesId && !o.archived;
  });

  const checkRecidivism = (studentId: string, ruleCode: number, excludeId?: string) => {
    const studentOccurrences = getStudentOccurrences(studentId);
    return studentOccurrences.filter(o => o.ruleCode === ruleCode && o.id !== excludeId).length > 0;
  };

  const getEscalationStatus = (studentId: string, ruleCode: number, excludeId?: string) => {
    const allOccurrences = getStudentOccurrences(studentId);
    // Exclui a própria ocorrência ao editar para não contar como reincidência
    const studentOccurrences = excludeId
      ? allOccurrences.filter(o => o.id !== excludeId)
      : allOccurrences;

    const rule = rules.find(r => r.code === ruleCode);
    if (!rule) return { isEscalated: false, reason: '', measure: '', severity: '' };

    const sameRuleCount = studentOccurrences.filter(o => o.ruleCode === ruleCode).length;
    const lightOccurrences = studentOccurrences.filter(o => {
        const r = rules.find(ru => ru.code === o.ruleCode);
        return r?.severity === 'Leve';
    });

    // 1. Check for 3 or more light infractions (Art. 35 § 4º)
    if (rule.severity === 'Leve' && lightOccurrences.length >= 2) {
         return { isEscalated: true, reason: 'Acúmulo de 3 ou mais infrações leves (Art. 35 § 4º)', measure: 'Suspensão (Agravada por acúmulo)', severity: 'Grave' };
    }

    // 2. Check for recidivism in same rule
    if (sameRuleCount > 0) {
        if (rule.severity === 'Leve') {
            return { isEscalated: true, reason: 'Reincidência em infração leve (Art. 35 § 3º)', measure: 'Advertência Escrita (Agravada)', severity: 'Leve' };
        } else if (rule.severity === 'Media') {
            return { isEscalated: true, reason: 'Reincidência em infração média (Art. 35 § 4º)', measure: 'Suspensão (Agravada)', severity: 'Grave' };
        }
    }

    return { isEscalated: false, reason: '', measure: rule.measure, severity: rule.severity };
  };

  const getStudentBehavior = (points: number): BehaviorClass => {
    if (points >= 9.5) return 'Excepcional';
    if (points >= 8.0) return 'Ótimo';
    if (points >= 6.0) return 'Bom';
    if (points >= 4.0) return 'Regular';
    if (points >= 2.0) return 'Insuficiente';
    return 'Incompatível';
  };

  const getStudentPoints = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return 8.0;
    
    // Initial point according to Art. 45 § 2º: 8.0 for new students
    // Recalculating from base 8.0
    let base = 8.0; 
    
    const studentOccurrences = occurrences.filter(o => {
      const matchesId = o.studentId === studentId || (o.studentIds && o.studentIds.includes(studentId));
      return matchesId && !o.archived;
    });
    const studentPraises = praises.filter(p => p.studentId === studentId && !p.archived);
    
    // 1. Deductions (Art. 46)
    let deductions = 0;
    studentOccurrences.forEach((o, index) => {
      const rule = rules.find(r => r.code === o.ruleCode);
      if (rule) {
        let pointsToDeduct = Math.abs(rule.points);
        
        // Context for this occurrence
        const previousOccurrences = studentOccurrences.slice(0, index);
        const sameRuleCount = previousOccurrences.filter(prev => prev.ruleCode === o.ruleCode).length;
        const previousLightCount = previousOccurrences.filter(prev => {
            const r = rules.find(ru => ru.code === prev.ruleCode);
            return r?.severity === 'Leve';
        }).length;

        // Apply Escalation Rules (Art. 35)
        if (rule.severity === 'Leve') {
            if (previousLightCount >= 2) {
                // 3rd or more light -> Suspensão (0.5 * days)
                pointsToDeduct = 0.50 * (o.durationDays || 1);
            } else if (sameRuleCount > 0) {
                // Recidivism in same light rule -> Escrita (0.3)
                pointsToDeduct = 0.30;
            } else {
                // 1st time light -> Oral (0.1)
                pointsToDeduct = 0.10;
            }
        } else if (rule.severity === 'Media') {
            if (sameRuleCount > 0) {
                // Recidivism in same media rule -> Suspensão (0.5 * days)
                pointsToDeduct = 0.50 * (o.durationDays || 1);
            } else {
                // 1st time media -> Advertência Escrita (0.3)
                pointsToDeduct = 0.30;
            }
        } else if (rule.severity === 'Grave') {
             // Grave is always Suspensão (0.5 * days)
             pointsToDeduct = 0.50 * (o.durationDays || 1);
        }

        // Apply Attenuating and Aggravating Factors (User request)
        if (o.attenuatingFactors && o.attenuatingFactors.length > 0) {
            const reduction = Math.min(0.5, o.attenuatingFactors.length * 0.25);
            pointsToDeduct *= (1 - reduction);
        }
        if (o.aggravatingFactors && o.aggravatingFactors.length > 0) {
            const increase = o.aggravatingFactors.length * 0.25;
            pointsToDeduct *= (1 + increase);
        }
        
        deductions += pointsToDeduct;
      }
    });

    // 2. Direct Bonuses from Praise (Art. 47 & 50)
    let bonuses = 0;
    studentPraises.forEach(p => {
      if (p.type === 'Individual') bonuses += 0.50; // Art. 47 I
      if (p.type === 'Coletivo') bonuses += 0.30;   // Art. 47 II
      if (p.type === 'Art. 50') bonuses += 0.50;    // Art. 50 (Bimester >= 8.0)
    });

    // 3. Time-based bonus (Art. 51)
    // Decorridos 02 meses (60 dias) sem falta: +0.20 per day until 10.0
    const lastEventDate = studentOccurrences.length > 0 
      ? new Date(Math.max(...studentOccurrences.map(o => new Date(o.date).getTime())))
      : null;

    if (lastEventDate) {
      const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
      const today = new Date();
      const diff = today.getTime() - lastEventDate.getTime();
      
      if (diff > sixtyDaysInMs) {
        const extraDays = Math.floor((diff - sixtyDaysInMs) / (24 * 60 * 60 * 1000));
        bonuses += extraDays * 0.20;
      }
    }

    const currentPoints = base - deductions + bonuses;
    // Cap at 10.0 (Art. 51) and floor at 0
    return Math.min(10.0, Math.max(0, parseFloat(currentPoints.toFixed(2))));
  };

  const setGuestMode = () => {
    setIsGuest(true);
    localStorage.setItem('eecm_session', JSON.stringify({ type: 'guest' }));
  };

  const setMockUser = (username: string) => {
    setUser({ email: username, role: 'admin' });
    setIsGuest(false);
    localStorage.setItem('eecm_session', JSON.stringify({ type: 'mock', email: username }));
  };

  const logout = React.useCallback(async () => {
    localStorage.removeItem('eecm_session');
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsGuest(false);
    setUser(null);
  }, []);

  // Monitor session expiration (10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('eecm_session');
      if (stored) {
        try {
          const { timestamp } = JSON.parse(stored);
          const now = Date.now();
          const TEN_MINUTES = 10 * 60 * 1000;
          
          if (now - timestamp >= TEN_MINUTES) {
            logout();
            console.log("Session expired automatically");
          }
        } catch (e) {
          localStorage.removeItem('eecm_session');
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [logout]);

  return (
    <AppContext.Provider value={{
      students, occurrences, accidents, praises, rules, summons, conductTerms, auditLogs, staffMembers, appUsers, isSupabaseConnected, isSyncing,
      user, isGuest, currentUserRole, isAuthRestored, isDebugMode, setIsDebugMode, 
      geminiApiKey, setGeminiApiKey, groqApiKey, setGroqApiKey,
      setGuestMode, setMockUser, logout, uploadFile,
      logAction, refreshData,
      addAppUser, updateAppUser, deleteAppUser,
      addStudent, importStudents, updateStudent, archiveStudent, restoreStudent, deleteStudent, deleteAllStudents,
      addOccurrence, updateOccurrence, archiveOccurrence, restoreOccurrence, deleteOccurrence,
      addAccident, updateAccident, archiveAccident, restoreAccident, deleteAccident,
      addPraise, updatePraise, archivePraise, restorePraise, deletePraise,
      addSummons, updateSummons, archiveSummons, restoreSummons, deleteSummons,
      addConductTerm, updateConductTerm, archiveConductTerm, restoreConductTerm, deleteConductTerm,
      updateRule, addStaffMember,
      getStudentPoints, getStudentBehavior, getStudentOccurrences, checkRecidivism, getEscalationStatus
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
