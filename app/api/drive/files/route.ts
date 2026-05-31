import { NextRequest, NextResponse } from 'next/server';
import { listFiles } from '@/lib/google-drive';

export async function GET(req: NextRequest) {
  try {
    const folderId = req.nextUrl.searchParams.get('folderId') ?? '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA';
    const files = await listFiles(folderId);
    return NextResponse.json(files);
  } catch (error: any) {
    console.error('Error in GET /api/drive/files:', error);
    return NextResponse.json({ error: error.message || 'Error listing files' }, { status: 500 });
  }
}
