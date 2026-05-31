// lib/supabase-provision.ts
// STUB — substituir por chamadas reais à Supabase Management API na VPS

export type ProvisionPayload = {
  schoolName: string;
  slug: string;
  dreId: string;
  gestor: { email: string; name: string };
  driveFolder: string;
};

export type ProvisionStep =
  | 'sending'
  | 'database'
  | 'tables'
  | 'drive'
  | 'interface'
  | 'done';

export async function provisionSchool(
  payload: ProvisionPayload,
  onStep: (step: ProvisionStep) => void
): Promise<{ projectUrl: string; anonKey: string }> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  onStep('sending');
  await delay(1200);

  onStep('database');
  await delay(2000);
  // TODO: POST https://VPS_SUPABASE_URL/v1/projects { name, db_pass, region }

  onStep('tables');
  await delay(1800);
  // TODO: run migrations via Management API or pg connection

  onStep('drive');
  await delay(1000);
  // TODO: validate Drive folder + share with service account

  onStep('interface');
  await delay(1500);
  // TODO: register tenant in master DB (schools table)

  onStep('done');
  return { projectUrl: 'https://stub.supabase.co', anonKey: 'stub-anon-key' };
}
