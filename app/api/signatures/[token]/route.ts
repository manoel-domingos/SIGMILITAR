import { NextRequest, NextResponse } from 'next/server';
import { getSignatureSupabaseAdmin, hashSignatureToken } from '@/lib/signatures';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, context: Context) {
  try {
    const { token } = await context.params;
    const supabase = getSignatureSupabaseAdmin();
    const tokenHash = hashSignatureToken(token);

    const { data: request, error } = await supabase
      .from('document_signature_requests')
      .select('id, occurrence_id, document_type, recipient_name, recipient_phone, status, base_storage_path, signed_storage_path, approved_at, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!request) return NextResponse.json({ error: 'Solicitacao nao encontrada.' }, { status: 404 });

    if (request.status === 'pending' && new Date(request.expires_at).getTime() < Date.now()) {
      await supabase.from('document_signature_requests').update({ status: 'expired' }).eq('id', request.id);
      request.status = 'expired';
    }

    let documentHtml = '';
    if (request.base_storage_path) {
      const { data } = await supabase.storage.from('signatures').download(request.base_storage_path);
      documentHtml = data ? await data.text() : '';
    }

    return NextResponse.json({ request, documentHtml });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
