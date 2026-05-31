import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/google-drive';

export async function DELETE(req: NextRequest) {
  try {
    const { fileId } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }
    await deleteFile(fileId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/drive/delete:', error);
    return NextResponse.json({ error: error.message || 'Error deleting file' }, { status: 500 });
  }
}
