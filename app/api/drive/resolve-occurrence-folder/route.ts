import { NextRequest, NextResponse } from 'next/server';
import { getStudentOccurrenceFolderId } from '@/lib/google-drive';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { schoolId, studentName, occurrenceNumber, schoolFolderId } = await req.json();

    if (!schoolId || !studentName || !occurrenceNumber) {
      return NextResponse.json(
        { error: 'schoolId, studentName, and occurrenceNumber are required' },
        { status: 400 }
      );
    }

    let resolvedSchoolFolderId = schoolFolderId;
    if (!resolvedSchoolFolderId) {
      resolvedSchoolFolderId = process.env.NEXT_PUBLIC_DEFAULT_DRIVE_FOLDER_ID || '1fasylhHJEZcy4zCRPFyy7rPwFQhyttvA';
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { data, error } = await supabase
            .from('school_settings')
            .select('drive_folder_id')
            .eq('school_id', schoolId)
            .maybeSingle();
          
          if (!error && data?.drive_folder_id) {
            resolvedSchoolFolderId = data.drive_folder_id;
          }
        } catch (dbErr) {
          console.error('Error fetching school drive folder settings:', dbErr);
        }
      }
    }

    const folderId = await getStudentOccurrenceFolderId(
      resolvedSchoolFolderId,
      studentName,
      occurrenceNumber,
      schoolId
    );

    return NextResponse.json({ folderId });
  } catch (error: any) {
    console.error('Error in POST /api/drive/resolve-occurrence-folder:', error);
    return NextResponse.json(
      { error: error.message || 'Error resolving student occurrence folder' },
      { status: 500 }
    );
  }
}
