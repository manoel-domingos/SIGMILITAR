import { NextRequest, NextResponse } from 'next/server';
import { createFolder } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  try {
    const { parentId, name, schoolId } = await req.json();
    if (!parentId || !name) {
      return NextResponse.json({ error: 'parentId and name are required' }, { status: 400 });
    }
    const result = await createFolder(parentId, name, schoolId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/drive/folder:', error);
    return NextResponse.json({ error: error.message || 'Error creating folder' }, { status: 500 });
  }
}
