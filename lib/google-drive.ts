import { google } from 'googleapis';
import { Readable } from 'stream';

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
