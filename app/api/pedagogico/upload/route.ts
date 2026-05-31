import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File | null;
    const schoolId = data.get('schoolId') as string || 'test';
    const evidenciaId = data.get('evidenciaId') as string || 'unknown';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Resolve Drive Folder ID based on School ID (Tenant)
    const schoolIdUpper = schoolId.toUpperCase(); // JOAOBATISTA, HELIODORO
    const envVarName = `GOOGLE_DRIVE_ID_${schoolIdUpper}`;
    const driveFolderId = process.env[envVarName] || process.env.GOOGLE_DRIVE_ID_TESTE;

    if (!driveFolderId) {
      return NextResponse.json({ error: 'ID da pasta do Google Drive não configurado.' }, { status: 500 });
    }

    // Google API Credentials from environment
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    if (!email || !privateKey) {
      return NextResponse.json({ error: 'Credenciais da conta de serviço Google não configuradas.' }, { status: 500 });
    }

    // Initialize Auth
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // File buffer preparation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileStream = Readable.from(buffer);

    // Upload metadata (Upload to parent folder)
    const metadata = {
      name: `${evidenciaId}-${Date.now()}-${file.name}`,
      parents: [driveFolderId],
    };

    const media = {
      mimeType: file.type || 'application/octet-stream',
      body: fileStream,
    };

    // Create file in Google Drive
    const uploadRes = await drive.files.create({
      requestBody: metadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    const fileId = uploadRes.data.id;
    if (!fileId) {
      throw new Error('Falha ao obter ID do arquivo criado no Google Drive.');
    }

    // Grant read permission to anyone with the link
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Retrieve updated link (sometimes needed to make sure it's fully populated)
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink',
    });

    const publicUrl = fileInfo.data.webViewLink || uploadRes.data.webViewLink;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileId: fileId,
    });
  } catch (error: any) {
    console.error('Error uploading file to Google Drive:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
