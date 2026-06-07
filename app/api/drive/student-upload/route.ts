import { NextRequest, NextResponse } from 'next/server';
import { getStudentOccurrenceUploadSession } from '@/lib/google-drive';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { fileName, mimeType, studentName, occurrenceNumber, schoolFolderId } = await req.json();
    if (!fileName || !mimeType || !studentName || !occurrenceNumber) {
      return NextResponse.json(
        { error: 'fileName, mimeType, studentName and occurrenceNumber are required' },
        { status: 400 }
      );
    }

    if (!schoolFolderId) {
      return NextResponse.json({ error: 'Configure seu Google Drive para usar este painel.' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || undefined;
    const result = await getStudentOccurrenceUploadSession(
      schoolFolderId,
      studentName,
      occurrenceNumber,
      fileName,
      mimeType,
      origin
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/drive/student-upload:', error);
    return NextResponse.json({ error: error.message || 'Error creating student occurrence upload session' }, { status: 500 });
  }
}

