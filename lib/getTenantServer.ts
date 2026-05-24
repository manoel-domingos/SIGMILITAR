import { headers } from 'next/headers';

/**
 * Lê o tenant ID injetado pelo middleware via header x-tenant.
 * Use este helper em Server Components e API routes (route handlers).
 *
 * Fallback: 'joaobatista'
 *
 * @example
 * // Em um Server Component:
 * const tenantId = await getTenantServer();
 *
 * // Em um Route Handler:
 * const tenantId = await getTenantServer();
 */
export async function getTenantServer(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-tenant') ?? 'joaobatista';
}
