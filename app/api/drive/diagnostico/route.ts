import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Diagnóstico ao vivo do Google Drive. NÃO expõe segredos (apenas presença de
// variáveis, e-mail da service account — que não é segredo — e metadados da
// pasta que o gestor já possui).
//
// Uso: GET /api/drive/diagnostico?key=<DRIVE_DIAG_KEY>&folderId=<id opcional>
//
// Protegido por DRIVE_DIAG_KEY: se a env não estiver definida, o endpoint é
// negado (fail-closed).
export async function GET(req: NextRequest) {
  const expected = process.env.DRIVE_DIAG_KEY;
  const provided = req.nextUrl.searchParams.get('key');
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'Acesso negado. Defina DRIVE_DIAG_KEY e informe ?key=.' }, { status: 403 });
  }

  const report: any = {
    env: {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      NEXT_PUBLIC_DEFAULT_DRIVE_FOLDER_ID: process.env.NEXT_PUBLIC_DEFAULT_DRIVE_FOLDER_ID || null,
    },
    service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null,
    folder: null as any,
    upload_test: null as any,
    verdict: [] as string[],
  };

  const folderId =
    req.nextUrl.searchParams.get('folderId') ||
    process.env.NEXT_PUBLIC_DEFAULT_DRIVE_FOLDER_ID ||
    '';

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    report.verdict.push('❌ Credenciais da service account ausentes no ambiente.');
    return NextResponse.json(report);
  }
  if (!folderId) {
    report.verdict.push('❌ Nenhum folderId informado nem NEXT_PUBLIC_DEFAULT_DRIVE_FOLDER_ID configurado.');
    return NextResponse.json(report);
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (e: any) {
    report.verdict.push(`❌ Falha ao autenticar a service account: ${e.message}`);
    return NextResponse.json(report);
  }

  // 1) Metadados da pasta — campo-chave: driveId (presente = Shared Drive).
  try {
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,driveId,capabilities(canAddChildren),owners(emailAddress)&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const meta = await metaRes.json();
    if (!metaRes.ok) {
      report.folder = { error: meta };
      report.verdict.push(
        `❌ Não consegui ler a pasta (${metaRes.status}). A service account (${report.service_account_email}) provavelmente não tem acesso a esta pasta.`
      );
      return NextResponse.json(report);
    }
    report.folder = meta;

    if (meta.driveId) {
      report.verdict.push('✅ A pasta está em um Drive Compartilhado (Shared Drive) — uploads usam a cota da organização.');
    } else {
      report.verdict.push(
        '⚠️ A pasta está no "Meu Drive" (sem driveId). Uploads pela service account vão falhar com 403 storageQuotaExceeded. Mova a pasta para um Drive Compartilhado.'
      );
    }
    if (meta.capabilities && meta.capabilities.canAddChildren === false) {
      report.verdict.push('⚠️ A service account NÃO tem permissão para criar itens nesta pasta (canAddChildren=false). Adicione-a como Gerente de Conteúdo.');
    }
  } catch (e: any) {
    report.folder = { error: e.message };
    report.verdict.push(`❌ Erro ao consultar metadados da pasta: ${e.message}`);
    return NextResponse.json(report);
  }

  // 2) Teste real: cria sessão resumável + envia 1 byte + apaga o arquivo.
  try {
    const sessionRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'text/plain',
        },
        body: JSON.stringify({ name: `__diagnostico_${Date.now()}.txt`, parents: [folderId] }),
      }
    );
    if (!sessionRes.ok) {
      report.upload_test = { stage: 'session', status: sessionRes.status, body: await sessionRes.text() };
      report.verdict.push(`❌ Falha ao abrir sessão de upload (${sessionRes.status}). Ver upload_test.`);
      return NextResponse.json(report);
    }
    const location = sessionRes.headers.get('Location');
    const putRes = await fetch(location!, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
    const putBody = await putRes.json().catch(() => ({}));
    if (!putRes.ok) {
      report.upload_test = { stage: 'put', status: putRes.status, body: putBody };
      report.verdict.push(`❌ Upload de teste falhou (${putRes.status}). Ver upload_test.`);
      return NextResponse.json(report);
    }
    // Limpa o arquivo de teste.
    if (putBody.id) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${putBody.id}?supportsAllDrives=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    report.upload_test = { ok: true, created_file_id: putBody.id, cleaned_up: true };
    report.verdict.push('✅ Upload de teste concluído e removido com sucesso. O Google Drive está funcional para esta pasta.');
  } catch (e: any) {
    report.upload_test = { error: e.message };
    report.verdict.push(`❌ Erro no teste de upload: ${e.message}`);
  }

  return NextResponse.json(report);
}
