import { google } from 'googleapis';
import { Readable } from 'stream';

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (key && key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  if (!email || !key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

export async function listFiles(folderId: string) {
  const drive = getDriveClient();
  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
    orderBy: 'folder,name',
  });
  return data.files ?? [];
}

export async function uploadFile(folderId: string, name: string, mimeType: string, buffer: Buffer) {
  const drive = getDriveClient();
  const { data } = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,name,mimeType,size,modifiedTime',
  });
  return data;
}

export async function moveFile(fileId: string, newParentId: string, oldParentId: string) {
  const drive = getDriveClient();
  const { data } = await drive.files.update({
    fileId,
    addParents: newParentId,
    removeParents: oldParentId,
    fields: 'id,parents',
  });
  return data;
}

export async function renameFile(fileId: string, newName: string) {
  const drive = getDriveClient();
  const { data } = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: 'id,name',
  });
  return data;
}

export async function deleteFile(fileId: string) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}

export async function createFolder(parentId: string, name: string) {
  const drive = getDriveClient();
  const { data } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id,name,mimeType',
  });
  return data;
}

export async function findFolderByName(parentId: string, name: string): Promise<string | null> {
  const drive = getDriveClient();
  const { data } = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  });
  return data.files && data.files.length > 0 ? (data.files[0].id ?? null) : null;
}

export async function createFolderIfNotExist(parentId: string, name: string): Promise<{ id: string; created: boolean }> {
  const existingId = await findFolderByName(parentId, name);
  if (existingId) {
    return { id: existingId, created: false };
  }
  const newFolder = await createFolder(parentId, name);
  if (!newFolder.id) {
    throw new Error(`Failed to create folder ${name}`);
  }
  return { id: newFolder.id, created: true };
}

export async function createFile(parentId: string, name: string, mimeType: string, content: string): Promise<any> {
  const drive = getDriveClient();
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
  });
  return data;
}

export async function uploadStudentOccurrenceFile(
  schoolFolderId: string,
  studentName: string,
  occurrenceNumber: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ file: any; isAlunosCreated: boolean }> {
  // 1. Resolve SISTEMA folder
  const sistema = await createFolderIfNotExist(schoolFolderId, 'SISTEMA');
  
  // 2. Resolve Alunos folder
  const alunos = await createFolderIfNotExist(sistema.id, 'Alunos');
  
  // 3. If Alunos folder was newly created, put safety Na_apagar.txt file inside it
  if (alunos.created) {
    const docContent = `ATENÇÃO: NÃO APAGUE ESTA PASTA!
Esta é a pasta centralizadora de documentos, ocorrências, termos de conduta e fotos de alunos do MEG.
A remoção de pastas deste diretório comprometerá a integridade do histórico do aluno no sistema.`;
    await createFile(alunos.id, 'Nao apagar.txt', 'text/plain', docContent);
  }

  // 4. Resolve [studentName] folder
  const student = await createFolderIfNotExist(alunos.id, studentName);

  // 5. Resolve Ocorrencias folder
  const ocorrencias = await createFolderIfNotExist(student.id, 'Ocorrencias');

  // 6. Resolve Ocorrencia_[occurrenceNumber] folder
  const folderKey = `Ocorrencia_${occurrenceNumber}`;
  const targetFolder = await createFolderIfNotExist(ocorrencias.id, folderKey);

  // 7. Upload final file inside target occurrence folder
  const file = await uploadFile(targetFolder.id, fileName, mimeType, buffer);

  return {
    file,
    isAlunosCreated: alunos.created,
  };
}

export async function getStudentOccurrenceUploadSession(
  schoolFolderId: string,
  studentName: string,
  occurrenceNumber: string,
  fileName: string,
  mimeType: string,
  origin?: string
): Promise<{ uploadUri: string; isAlunosCreated: boolean }> {
  // 1. Resolve SISTEMA folder
  const sistema = await createFolderIfNotExist(schoolFolderId, 'SISTEMA');
  
  // 2. Resolve Alunos folder
  const alunos = await createFolderIfNotExist(sistema.id, 'Alunos');
  
  // 3. If Alunos folder was newly created, put safety Na_apagar.txt file inside it
  if (alunos.created) {
    const docContent = `ATENÇÃO: NÃO APAGUE ESTA PASTA!
Esta é a pasta centralizadora de documentos, ocorrências, termos de conduta e fotos de alunos do MEG.
A remoção de pastas deste diretório comprometerá a integridade do histórico do aluno no sistema.`;
    await createFile(alunos.id, 'Nao apagar.txt', 'text/plain', docContent);
  }

  // 4. Resolve [studentName] folder
  const student = await createFolderIfNotExist(alunos.id, studentName);

  // 5. Resolve Ocorrencias folder
  const ocorrencias = await createFolderIfNotExist(student.id, 'Ocorrencias');

  // 6. Resolve Ocorrencia_[occurrenceNumber] folder
  const folderKey = `Ocorrencia_${occurrenceNumber}`;
  const targetFolder = await createFolderIfNotExist(ocorrencias.id, folderKey);

  // 7. Get resumable upload session URI
  const uploadUri = await createResumableUploadSession(targetFolder.id, fileName, mimeType, origin);

  return {
    uploadUri,
    isAlunosCreated: alunos.created,
  };
}


// ── Resumable Upload (bypasses Vercel 4.5MB body limit) ──────────────────────
// Server creates a resumable session URI → client uploads file directly to Google

export async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (key && key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  if (!email || !key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key,
    },
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
  origin?: string
): Promise<string> {
  const token = await getAccessToken();

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
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
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

