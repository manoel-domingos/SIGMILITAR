import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Retorna o status da conexão OAuth Google Drive de uma escola.
// Usado pela página de configurações para exibir se o Drive está conectado.
export async function GET(req: NextRequest) {
  const schoolId = req.nextUrl.searchParams.get('schoolId') || 'dretga';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabase
    .from('school_settings')
    .select('google_oauth_email, google_oauth_connected_at, drive_folder_id')
    .eq('school_id', schoolId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    connected: !!data?.google_oauth_email,
    email: data?.google_oauth_email || null,
    connectedAt: data?.google_oauth_connected_at || null,
    driveFolderId: data?.drive_folder_id || null,
  });
}
