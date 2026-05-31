import { NextRequest, NextResponse } from 'next/server';
import { uploadStudentOccurrenceFile } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const studentName = form.get('studentName') as string;
    const occurrenceNumber = form.get('occurrenceNumber') as string;
    
    if (!studentName || !occurrenceNumber) {
      return NextResponse.json({ error: 'studentName and occurrenceNumber are required' }, { status: 400 });
    }

    const schoolFolderId = (form.get('schoolFolderId') as string) ?? '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA';
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await uploadStudentOccurrenceFile(
      schoolFolderId,
      studentName,
      occurrenceNumber,
      file.name,
      file.type,
      buffer
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/drive/student-upload:', error);
    return NextResponse.json({ error: error.message || 'Error uploading file to student occurrences' }, { status: 500 });
  }
}
