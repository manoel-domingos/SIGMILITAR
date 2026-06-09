import { google } from 'googleapis';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';

// E-mail do DONO da pasta a ser impersonado via Domain-Wide Delegation.
// Quando definido (e o super-admin do Workspace autorizou o client ID da SA),
// a service account passa a AGIR COMO o dono -> enxerga TODOS os arquivos e
// pastas, inclusive os criados por outras pessoas. Sem isso, a SA só vê o que
// foi compartilhado com ela. Vazio = comportamento antigo (sem impersonation).
function getImpersonationSubject(): string | undefined {
  return process.env.GOOGLE_DRIVE_IMPERSONATE_SUBJECT?.trim() || undefined;
}

function getServiceAccountCreds(): { email: string; key: string } {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (key && key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }
  if (!email || !key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set');
  }
  return { email, key };
}

function getDriveClient() {
  const { email, key } = getServiceAccountCreds();
  const subject = getImpersonationSubject();

  // DWD: assina um JWT com `subject` = dono da pasta -> visibilidade total.
  if (subject) {
    const jwt = new google.auth.JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject,
    });
    return google.drive({ version: 'v3', auth: jwt });
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

// Retorna um cliente Drive autenticado como o gestor da escola (OAuth).
// Se a escola não tiver refresh_token configurado, cai de volta na service account.
export async function getSchoolDriveClient(schoolId?: string) {
  if (schoolId) {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (clientId && clientSecret) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        const { data } = await supabase
          .from('school_settings')
          .select('google_oauth_refresh_token')
          .eq('school_id', schoolId)
          .maybeSingle();

        const refreshToken = data?.google_oauth_refresh_token;
        if (refreshToken) {
          const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
          oauth2.setCredentials({ refresh_token: refreshToken });
          return google.drive({ version: 'v3', auth: oauth2 });
        }
      } catch {
        // Silencioso: cai no fallback da service account
      }
    }
  }
  return getDriveClient();
}

// Retorna um access token para uploads resumíveis (service account ou OAuth).
export async function getAccessTokenForSchool(schoolId?: string): Promise<string> {
  if (schoolId) {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (clientId && clientSecret) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        const { data } = await supabase
          .from('school_settings')
          .select('google_oauth_refresh_token')
          .eq('school_id', schoolId)
          .maybeSingle();

        const refreshToken = data?.google_oauth_refresh_token;
        if (refreshToken) {
          const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
          oauth2.setCredentials({ refresh_token: refreshToken });
          const { token } = await oauth2.getAccessToken();
          if (!token) throw new Error('Failed to refresh OAuth token');
          return token;
        }
      } catch {
        // Cai na service account
      }
    }
  }
  return getAccessToken();
}

export async function listFiles(folderId: string, schoolId?: string) {
  const drive = await getSchoolDriveClient(schoolId);
  const files: any[] = [];
  let pageToken: string | undefined;

  // Pagina até o fim — pastas com >1000 itens não eram listadas por completo.
  // corpora:'allDrives' + includeItemsFromAllDrives garante itens de Drives
  // Compartilhados independentemente de quem os criou.
  do {
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id,name,mimeType,size,modifiedTime,parents)',
      orderBy: 'folder,name',
      pageSize: 1000,
      pageToken,
      corpora: 'allDrives',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    if (data.files?.length) files.push(...data.files);
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

export async function uploadFile(folderId: string, name: string, mimeType: string, buffer: Buffer, schoolId?: string) {
  const drive = await getSchoolDriveClient(schoolId);
  const { data } = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,name,mimeType,size,modifiedTime',
    supportsAllDrives: true,
  });
  return data;
}

export async function moveFile(fileId: string, newParentId: string, oldParentId: string, schoolId?: string) {
  const drive = await getSchoolDriveClient(schoolId);
  const { data } = await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: oldParentId,
    fields: 'id,parents',
    supportsAllDrives: true,
  });
  return data;
}

export async function renameFile(fileId: string, newName: string, schoolId?: string) {
  const drive = await getSchoolDriveClient(schoolId);
  const { data } = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: 'id,name',
    supportsAllDrives: true,
  });
  return data;
}

export async function deleteFile(fileId: string, schoolId?: string) {
  const drive = await getSchoolDriveClient(schoolId);
  await drive.files.delete({ fileId, supportsAllDrives: true });
}

export async function createFolder(parentId: string, name: string, schoolId?: string) {
  const drive = await getSchoolDriveClient(schoolId);
  const { data } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id,name,mimeType',
    supportsAllDrives: true,
  });
  return data;
}

export async function findFolderByName(parentId: string, name: string, schoolId?: string): Promise<string | null> {
  const drive = await getSchoolDriveClient(schoolId);
  const { data } = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: 'allDrives',
  });
  return data.files && data.files.length > 0 ? (data.files[0].id ?? null) : null;
}

export async function createFolderIfNotExist(parentId: string, name: string, schoolId?: string): Promise<{ id: string; created: boolean }> {
  const existingId = await findFolderByName(parentId, name, schoolId);
  if (existingId) {
    return { id: existingId, created: false };
  }
  const newFolder = await createFolder(parentId, name, schoolId);
  if (!newFolder.id) {
    throw new Error(`Failed to create folder ${name}`);
  }
  return { id: newFolder.id, created: true };
}

export async function createFile(parentId: string, name: string, mimeType: string, content: string, schoolId?: string): Promise<any> {
  const drive = await getSchoolDriveClient(schoolId);
  const { data } = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
    },
    media: {
      mimeType,
      body: Readable.from(Buffer.from(content, 'utf-8')),
    },
    fields: 'id,name',
    supportsAllDrives: true,
  });
  return data;
}

export async function uploadStudentOccurrenceFile(
  schoolFolderId: string,
  studentName: string,
  occurrenceNumber: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  schoolId?: string
): Promise<{ file: any; isAlunosCreated: boolean }> {
  const sistema = await createFolderIfNotExist(schoolFolderId, 'SISTEMA', schoolId);
  const alunos = await createFolderIfNotExist(sistema.id, 'Alunos', schoolId);
  if (alunos.created) {
    const docContent = `ATENÇÃO: NÃO APAGUE ESTA PASTA!\nEsta é a pasta centralizadora de documentos, ocorrências, termos de conduta e fotos de alunos do MEG.\nA remoção de pastas deste diretório comprometerá a integridade do histórico do aluno no sistema.`;
    await createFile(alunos.id, 'Nao apagar.txt', 'text/plain', docContent, schoolId);
  }
  const student = await createFolderIfNotExist(alunos.id, studentName, schoolId);
  const ocorrencias = await createFolderIfNotExist(student.id, 'Ocorrencias', schoolId);
  const targetFolder = await createFolderIfNotExist(ocorrencias.id, `Ocorrencia_${occurrenceNumber}`, schoolId);
  const file = await uploadFile(targetFolder.id, fileName, mimeType, buffer, schoolId);
  return { file, isAlunosCreated: alunos.created };
}

export async function getStudentOccurrenceUploadSession(
  schoolFolderId: string,
  studentName: string,
  occurrenceNumber: string,
  fileName: string,
  mimeType: string,
  origin?: string,
  schoolId?: string
): Promise<{ uploadUri: string; isAlunosCreated: boolean }> {
  const sistema = await createFolderIfNotExist(schoolFolderId, 'SISTEMA', schoolId);
  const alunos = await createFolderIfNotExist(sistema.id, 'Alunos', schoolId);
  if (alunos.created) {
    const docContent = `ATENÇÃO: NÃO APAGUE ESTA PASTA!\nEsta é a pasta centralizadora de documentos, ocorrências, termos de conduta e fotos de alunos do MEG.\nA remoção de pastas deste diretório comprometerá a integridade do histórico do aluno no sistema.`;
    await createFile(alunos.id, 'Nao apagar.txt', 'text/plain', docContent, schoolId);
  }
  const student = await createFolderIfNotExist(alunos.id, studentName, schoolId);
  const ocorrencias = await createFolderIfNotExist(student.id, 'Ocorrencias', schoolId);
  const targetFolder = await createFolderIfNotExist(ocorrencias.id, `Ocorrencia_${occurrenceNumber}`, schoolId);
  const uploadUri = await createResumableUploadSession(targetFolder.id, fileName, mimeType, origin, schoolId);
  return { uploadUri, isAlunosCreated: alunos.created };
}

export async function getStudentOccurrenceFolderId(
  schoolFolderId: string,
  studentName: string,
  occurrenceNumber: string,
  schoolId?: string
): Promise<string> {
  const sistema = await createFolderIfNotExist(schoolFolderId, 'SISTEMA', schoolId);
  const alunos = await createFolderIfNotExist(sistema.id, 'Alunos', schoolId);
  if (alunos.created) {
    const docContent = `ATENÇÃO: NÃO APAGUE ESTA PASTA!\nEsta é a pasta centralizadora de documentos, ocorrências, termos de conduta e fotos de alunos do MEG.\nA remoção de pastas deste diretório comprometerá a integridade do histórico do aluno no sistema.`;
    await createFile(alunos.id, 'Nao apagar.txt', 'text/plain', docContent, schoolId);
  }
  const student = await createFolderIfNotExist(alunos.id, studentName, schoolId);
  const ocorrencias = await createFolderIfNotExist(student.id, 'Ocorrencias', schoolId);
  const targetFolder = await createFolderIfNotExist(ocorrencias.id, `Ocorrencia_${occurrenceNumber}`, schoolId);
  return targetFolder.id;
}



// ── Resumable Upload (bypasses Vercel 4.5MB body limit) ──────────────────────
// Server creates a resumable session URI → client uploads file directly to Google

export async function getAccessToken(): Promise<string> {
  const { email, key } = getServiceAccountCreds();
  const subject = getImpersonationSubject();

  // DWD: token emitido em nome do dono da pasta (uploads acompanham a visibilidade).
  if (subject) {
    const jwt = new google.auth.JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject,
    });
    const { access_token } = await jwt.authorize();
    if (!access_token) throw new Error('Failed to obtain impersonated Google access token');
    return access_token;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
  if (!token) {
    throw new Error('Failed to obtain Google access token');
  }
  return token;
}

export async function createResumableUploadSession(
  folderId: string,
  fileName: string,
  mimeType: string,
  origin?: string,
  schoolId?: string
): Promise<string> {
  const token = await getAccessTokenForSchool(schoolId);

  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': mimeType,
  };

  if (origin) {
    headers['Origin'] = origin;
  }

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(metadata),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive resumable session failed (${res.status}): ${errorText}`);
  }

  const location = res.headers.get('Location');
  if (!location) {
    throw new Error('Google Drive did not return a resumable upload URI');
  }

  return location;
}

