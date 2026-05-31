import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    const folderId = (form.get('folderId') as string) ?? '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA';
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(folderId, file.name, file.type, buffer);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/drive/upload:', error);
    return NextResponse.json({ error: error.message || 'Error uploading file' }, { status: 500 });
  }
}
