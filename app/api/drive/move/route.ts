import { NextRequest, NextResponse } from 'next/server';
import { moveFile } from '@/lib/google-drive';

export async function PATCH(req: NextRequest) {
  try {
    const { fileId, newParentId, oldParentId } = await req.json();
    if (!fileId || !newParentId || !oldParentId) {
      return NextResponse.json({ error: 'fileId, newParentId and oldParentId are required' }, { status: 400 });
    }
    const result = await moveFile(fileId, newParentId, oldParentId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PATCH /api/drive/move:', error);
    return NextResponse.json({ error: error.message || 'Error moving file' }, { status: 500 });
  }
}
