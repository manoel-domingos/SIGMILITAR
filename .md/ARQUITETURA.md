# ARQUITETURA.md — Estrutura Técnica do SIGMilitar

> Leia antes de tocar em: `middleware.ts`, `store.tsx`, `login/page.tsx`, `useTenantConfig.ts`, `layout.tsx`

---

## 1. Domínio e rotas

| Domínio | Uso |
|---------|-----|
| `sigmilitar.com.br/login` | Login único para todos os usuários |
| `sigmilitar.com.br/[slug]/` | Dashboard da escola (ex: `/eecmheliodoro/`) |
| `sigmilitar.com.br/[slug]/registro-disciplinar` | Módulo de ocorrências |
| `sigmilitar.com.br/dre` | Painel consolidado DRE (multi-escola) |
| `sigmilitar.com.br/` (raiz) | Landing page pública — **NÃO é dashboard** |

**Regra de ouro:** Se o hostname for `sigmilitar.com.br` E não houver slug de escola válido no path, é landing page. Se houver slug válido, é o sistema.

---

## 2. Slugs válidos de escola

```ts
const validSlugs = ['eecmprofjoaobatista', 'eecmheliodoro', 'eecmtangara'];
```

Esses slugs são usados como:
- Primeiro segmento da URL: `/eecmheliodoro/registro-disciplinar`
- Valor do header `x-tenant` injetado pelo middleware
- Chave no `TENANT_MAP` de `useTenantConfig.ts`

---

## 3. Mapeamento slug → school_id no banco

O banco usa IDs legados (curtos). A conversão é feita em `getDbSchoolId()`:

| Slug (URL) | school_id (banco Supabase) |
|------------|---------------------------|
| `eecmprofjoaobatista` | `joaobatista` |
| `eecmheliodoro` | `heliodoro` |
| `eecmtangara` | `tangara` |

**Nunca use o slug diretamente em queries ao banco.** Sempre passe por `getDbSchoolId(tenantId)`.

---

## 4. Prioridade de resolução do tenant (middleware.ts)

1. Primeiro segmento da URL (se for slug válido) → **tem prioridade absoluta**
2. Variável de ambiente `NEXT_PUBLIC_TENANT`
3. Mapa de hostnames conhecidos (`hostToTenant`)
4. Fallback: sem tenant (rota global — login, API, DRE)

---

## 5. Fluxo de autenticação

```
Usuário faz login
       ↓
Supabase auth.signInWithPassword
       ↓
onAuthStateChange dispara → store.tsx verifica whitelist (user_profiles)
       ↓
Usuário não está no user_profiles? → redirect /login?error=whitelist
       ↓
Usuário autorizado → setActiveSchoolContext(school_id)
       ↓
admin_global? → abre SchoolSelectorModal (showContextModal)
PROFESSOR?    → redirect /[slug]/registro-disciplinar
Demais?       → redirect /[slug]/
```

---

## 6. Cliente Supabase — singleton obrigatório

Use **sempre** o cliente de `lib/supabase.ts`:

```ts
import { supabase } from '@/lib/supabase';
```

**Nunca** crie um segundo `createClient` dentro de um componente ou página.
Isso gera `Multiple GoTrueClient instances` e comportamento indefinido de sessão.

---

## 7. AppShell vs. páginas sem shell

- **Com AppShell** (`app/[escola]/*/page.tsx`): o `showContextModal` é renderizado dentro do `AppShell`
- **Sem AppShell** (`app/login/page.tsx`, `app/dre/page.tsx`): o modal deve ser renderizado diretamente na página

---

## 8. CSP — Content Security Policy (next.config.ts)

Domínios atualmente permitidos em `img-src`:
- `self`, `data:`, `blob:`
- `picsum.photos`
- `lh3.googleusercontent.com`, `*.googleusercontent.com`
- `vercel.live`, `*.vercel.live`, `vercel.com`, `*.vercel.com`
- `i.postimg.cc`, `*.postimg.cc`

Para adicionar um novo host de imagens, edite a diretiva `img-src` em `next.config.ts` e **documente aqui**.
