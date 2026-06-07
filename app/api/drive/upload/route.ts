import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/google-drive';

// Allow uploads up to 50MB
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    const folderId = form.get('folderId') as string | null;
    if (!folderId) {
      return NextResponse.json({ error: 'Configure seu Google Drive para usar este painel.' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(folderId, file.name, file.type, buffer);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/drive/upload:', error);
    return NextResponse.json({ error: error.message || 'Error uploading file' }, { status: 500 });
  }
}
