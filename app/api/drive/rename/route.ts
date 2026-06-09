import { NextRequest, NextResponse } from 'next/server';
import { renameFile } from '@/lib/google-drive';

export async function PATCH(req: NextRequest) {
  try {
    const { fileId, newName, schoolId } = await req.json();
    if (!fileId || !newName) {
      return NextResponse.json({ error: 'fileId and newName are required' }, { status: 400 });
    }
    const result = await renameFile(fileId, newName, schoolId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PATCH /api/drive/rename:', error);
    return NextResponse.json({ error: error.message || 'Error renaming file' }, { status: 500 });
  }
}
