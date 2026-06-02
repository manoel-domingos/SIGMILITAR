import { NextRequest, NextResponse } from 'next/server';
import { createResumableUploadSession } from '@/lib/google-drive';

// This route only receives metadata (tiny JSON) → creates a resumable upload session
// The actual file bytes are sent by the client directly to Google's URI
export async function POST(req: NextRequest) {
  try {
    const { folderId, fileName, mimeType } = await req.json();
    if (!folderId || !fileName || !mimeType) {
      return NextResponse.json(
        { error: 'folderId, fileName and mimeType are required' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || undefined;
    const googleUploadUri = await createResumableUploadSession(folderId, fileName, mimeType, origin);
    return NextResponse.json({ uploadUri: googleUploadUri });
  } catch (error: any) {
    console.error('Error in POST /api/drive/upload-session:', error);
    return NextResponse.json(
      { error: error.message || 'Error creating upload session' },
      { status: 500 }
    );
  }
}
