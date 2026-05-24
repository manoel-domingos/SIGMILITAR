import { headers } from 'next/headers';

/**
 * Lê o tenant ID injetado pelo middleware via header x-tenant.
 * Use este helper em Server Components e API routes (route handlers).
 *
 * Fallback: process.env.NEXT_PUBLIC_TENANT ?? 'eecmprofjoaobatista'
 */
export async function getTenantServer(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-tenant') ?? process.env.NEXT_PUBLIC_TENANT ?? 'eecmprofjoaobatista';
}
