import { createHash, randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export type SignatureStatus = 'pending' | 'approved' | 'expired' | 'cancelled';

export type SignatureRequest = {
  id: string;
  school_id: string;
  occurrence_id: string;
  document_type: string;
  recipient_name: string;
  recipient_phone: string;
  status: SignatureStatus;
  base_storage_path?: string | null;
  signed_storage_path?: string | null;
  approved_at?: string | null;
  expires_at: string;
  created_at?: string;
};

export function getSignatureSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role nao configurado.');

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getSignatureSupabaseUser(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase anon nao configurado.');

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function bearerToken(header: string | null) {
  const [type, token] = (header || '').split(' ');
  return type?.toLowerCase() === 'bearer' && token ? token : null;
}

export function createSignatureToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSignatureToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export function siteOrigin(req: Request) {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (envOrigin) return envOrigin.startsWith('http') ? envOrigin : `https://${envOrigin}`;
  return new URL(req.url).origin;
}

export function buildSignatureUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, '')}/assinatura/${token}`;
}

export function buildWhatsappUrl(phone: string, message: string) {
  const digits = normalizePhone(phone);
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderOccurrenceDocumentHtml(input: {
  schoolName?: string;
  occurrence: any;
  students: any[];
  rules: any[];
  recipientName: string;
  documentType: string;
}) {
  const { occurrence, students, rules, recipientName, documentType } = input;
  const title = documentType === 'termo' ? 'Termo Disciplinar' : 'Documento de Ocorrência Disciplinar';
  const ruleCodes = Array.isArray(occurrence.rule_code) ? occurrence.rule_code : [occurrence.rule_code];
  const selectedRules: any[] = ruleCodes
    .map((code: any) => rules.find((rule: any) => Number(rule.code) === Number(code)))
    .filter(Boolean);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;margin:0;background:#f8fafc;padding:24px}
    main{max-width:840px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:32px;box-shadow:0 18px 45px rgba(15,23,42,.08)}
    h1{font-size:24px;margin:0 0 4px} h2{font-size:16px;margin:24px 0 8px;color:#1d4ed8}.muted{color:#64748b;font-size:13px}.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:10px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.label{font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700}.value{font-weight:600}.signature{margin-top:44px;border-top:1px solid #334155;padding-top:10px;text-align:center}.rules li{margin-bottom:8px}@media(max-width:640px){body{padding:10px}main{padding:18px}.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
<main>
  <p class="muted">${escapeHtml(input.schoolName || occurrence.school_id || 'SIGMILITAR')}</p>
  <h1>${escapeHtml(title)}</h1>
  <p class="muted">Ocorrência ${escapeHtml(occurrence.ata_number ? `ATA Nº ${occurrence.ata_number}` : occurrence.id)}</p>

  <h2>Aluno(s)</h2>
  <div class="box">${students.map((student) => `<div><strong>${escapeHtml(student.name || student.display_name)}</strong> — ${escapeHtml(student.class || 'Turma não informada')}</div>`).join('')}</div>

  <h2>Dados da ocorrência</h2>
  <div class="grid">
    <div class="box"><div class="label">Data</div><div class="value">${escapeHtml(occurrence.date)}</div></div>
    <div class="box"><div class="label">Hora</div><div class="value">${escapeHtml(occurrence.hour || '—')}</div></div>
    <div class="box"><div class="label">Local</div><div class="value">${escapeHtml(occurrence.location || '—')}</div></div>
    <div class="box"><div class="label">Registrado por</div><div class="value">${escapeHtml(occurrence.registered_by || 'Sistema')}</div></div>
  </div>

  <h2>Infrações/medidas</h2>
  <ul class="rules">
    ${selectedRules.map((rule) => `<li><strong>Art. ${escapeHtml(rule.code)}</strong> — ${escapeHtml(rule.description)} <span class="muted">(${escapeHtml(rule.severity)} / ${escapeHtml(rule.measure)})</span></li>`).join('') || '<li>Regra não localizada.</li>'}
  </ul>

  <h2>Observações</h2>
  <div class="box">${escapeHtml(occurrence.observations || 'Sem observações.').replace(/\n/g, '<br />')}</div>

  <h2>Ciência do responsável</h2>
  <p>Eu, <strong>${escapeHtml(recipientName)}</strong>, declaro ter visualizado este documento eletrônico e aprovado a ciência/assinatura digital simples.</p>
  <div class="signature">${escapeHtml(recipientName)}<br /><span class="muted">Responsável legal</span></div>
</main>
</body>
</html>`;
}

export function renderSignatureProofHtml(input: {
  request: SignatureRequest;
  tokenHash: string;
  approvedIp: string;
  userAgent: string;
  identityConfirmation: string;
}) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Comprovante de assinatura</title><style>body{font-family:Arial,sans-serif;color:#0f172a;padding:32px}main{max-width:760px;margin:auto;border:1px solid #e2e8f0;border-radius:16px;padding:28px}.item{margin:12px 0}.label{font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700}.value{font-weight:600;word-break:break-word}</style></head><body><main><h1>Comprovante de assinatura digital simples</h1><div class="item"><div class="label">Responsável</div><div class="value">${escapeHtml(input.request.recipient_name)}</div></div><div class="item"><div class="label">Ocorrência</div><div class="value">${escapeHtml(input.request.occurrence_id)}</div></div><div class="item"><div class="label">Documento</div><div class="value">${escapeHtml(input.request.document_type)}</div></div><div class="item"><div class="label">Aprovado em</div><div class="value">${escapeHtml(new Date().toISOString())}</div></div><div class="item"><div class="label">IP</div><div class="value">${escapeHtml(input.approvedIp)}</div></div><div class="item"><div class="label">User-agent</div><div class="value">${escapeHtml(input.userAgent)}</div></div><div class="item"><div class="label">Confirmação de identidade</div><div class="value">${escapeHtml(input.identityConfirmation)}</div></div><div class="item"><div class="label">Hash do token</div><div class="value">${escapeHtml(input.tokenHash)}</div></div></main></body></html>`;
}
