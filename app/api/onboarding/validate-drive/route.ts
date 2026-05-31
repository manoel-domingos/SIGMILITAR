import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  const { folderId } = await req.json();

  if (!folderId) {
    return NextResponse.json({ ok: false, error: 'ID da pasta não fornecido' }, { status: 400 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const { data } = await drive.files.get({
      fileId: folderId,
      fields: 'id,name,mimeType',
    });
    const isFolder = data.mimeType === 'application/vnd.google-apps.folder';
    return NextResponse.json({ ok: isFolder, name: data.name });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Pasta não encontrada ou sem permissão' },
      { status: 400 }
    );
  }
}
