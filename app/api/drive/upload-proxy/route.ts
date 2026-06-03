import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get('upload_id');

    if (!uploadId) {
      return NextResponse.json({ error: 'Missing upload_id parameter' }, { status: 400 });
    }

    // Google Drive resumable upload URL
    const googleUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=${uploadId}`;

    // Forward relevant headers from client request
    const headers: Record<string, string> = {};
    const contentType = req.headers.get('content-type');
    const contentRange = req.headers.get('content-range');
    const contentLength = req.headers.get('content-length');

    if (contentType) headers['Content-Type'] = contentType;
    if (contentRange) headers['Content-Range'] = contentRange;
    if (contentLength) headers['Content-Length'] = contentLength;

    // Read request body as ArrayBuffer to bypass streaming/duplex issues on Vercel
    const arrayBuffer = await req.arrayBuffer();

    // Upload the request body directly to Google Drive API
    const response = await fetch(googleUrl, {
      method: 'PUT',
      headers,
      body: arrayBuffer,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[GOOGLE DRIVE UPLOAD PROXY] Google returned status ${response.status}:`, responseText);
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    };

    // Forward Range header if Google returns it (used in 308 Resume Incomplete)
    const rangeHeader = response.headers.get('range');
    if (rangeHeader) {
      responseHeaders['Range'] = rangeHeader;
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/drive/upload-proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Error proxying upload to Google Drive' },
      { status: 500 }
    );
  }
}
