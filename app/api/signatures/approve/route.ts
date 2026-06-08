import { NextRequest, NextResponse } from 'next/server';
import {
  getSignatureSupabaseAdmin,
  hashSignatureToken,
  renderSignatureProofHtml,
  SignatureRequest,
} from '@/lib/signatures';

export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '0.0.0.0';
}

export async function POST(req: NextRequest) {
  try {
    const { token, identityConfirmation } = await req.json();
    if (!token || !identityConfirmation) {
      return NextResponse.json({ error: 'token e identityConfirmation obrigatorios.' }, { status: 400 });
    }

    const supabase = getSignatureSupabaseAdmin();
    const tokenHash = hashSignatureToken(String(token));
    const { data: request, error } = await supabase
      .from('document_signature_requests')
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!request) return NextResponse.json({ error: 'Solicitacao nao encontrada.' }, { status: 404 });
    if (request.status === 'approved') return NextResponse.json({ request });
    if (request.status !== 'pending') return NextResponse.json({ error: 'Solicitacao nao esta pendente.' }, { status: 409 });
    if (new Date(request.expires_at).getTime() < Date.now()) {
      await supabase.from('document_signature_requests').update({ status: 'expired' }).eq('id', request.id);
      return NextResponse.json({ error: 'Solicitacao expirada.' }, { status: 410 });
    }

    const approvedAt = new Date().toISOString();
    const approvedIp = clientIp(req);
    const userAgent = req.headers.get('user-agent') || 'desconhecido';
    const signedStoragePath = `${request.school_id}/${request.occurrence_id}/${tokenHash.slice(0, 16)}/comprovante-assinatura.html`;
    const proofHtml = renderSignatureProofHtml({
      request: request as SignatureRequest,
      tokenHash,
      approvedIp,
      userAgent,
      identityConfirmation: String(identityConfirmation),
    });

    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(signedStoragePath, Buffer.from(proofHtml), {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    const { data: signedUrlData } = await supabase.storage
      .from('signatures')
      .createSignedUrl(signedStoragePath, 60 * 60 * 24 * 3650);

    const signedUrl = signedUrlData?.signedUrl || signedStoragePath;

    const { data: updated, error: updateError } = await supabase
      .from('document_signature_requests')
      .update({
        status: 'approved',
        signed_storage_path: signedStoragePath,
        approved_at: approvedAt,
        approved_ip: approvedIp,
        approved_user_agent: userAgent,
        identity_confirmation: String(identityConfirmation),
      })
      .eq('id', request.id)
      .select('id, occurrence_id, document_type, recipient_name, recipient_phone, status, signed_storage_path, approved_at, expires_at')
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    const { data: occurrence } = await supabase
      .from('occurrences')
      .select('signed_doc_urls')
      .eq('id', request.occurrence_id)
      .maybeSingle();

    const currentUrls = Array.isArray(occurrence?.signed_doc_urls) ? occurrence.signed_doc_urls : [];
    const nextUrls = currentUrls.includes(signedUrl) ? currentUrls : [...currentUrls, signedUrl];
    await supabase.from('occurrences').update({ signed_doc_urls: nextUrls }).eq('id', request.occurrence_id);

    return NextResponse.json({ request: updated, signedUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
