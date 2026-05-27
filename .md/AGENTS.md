# AGENTS.md — Instruções Obrigatórias para IA

> **LEIA ESTE ARQUIVO INTEIRO ANTES DE QUALQUER ALTERAÇÃO.**
> Qualquer mudança feita sem ler este documento pode quebrar o sistema em produção.

---

## 1. O que é este projeto

**SIGMilitar** — Sistema de Gestão Disciplinar para Escolas Cívico-Militares de Mato Grosso.
Multi-tenant, multi-escola. Cada escola tem seu próprio contexto de dados isolado no Supabase.

Stack: Next.js 14 (App Router) · TypeScript · Supabase · Tailwind CSS · Vercel

---

## 2. Regras absolutas — nunca viole

| # | Regra | Por quê |
|---|-------|---------|
| R1 | **Nunca misture dados de escolas diferentes** | Cada tenant tem `school_id` isolado no banco |
| R2 | **Nunca crie um segundo `createClient` do Supabase** | Causa `Multiple GoTrueClient instances` e conflitos de sessão |
| R3 | **Nunca use `.single()` sem garantir que a linha existe** | Retorna 406 se não houver registro; use `.maybeSingle()` |
| R4 | **Nunca faça `router.push('/')` fixo após selecionar escola** | No sigmilitar.com.br, `/` é a landing page, não o dashboard |
| R5 | **Nunca adicione hostname `kallyteros` em código novo** | Domínio descontinuado; o domínio oficial é `sigmilitar.com.br` |
| R6 | **Nunca altere `ataNumber`** | É sequencial e imutável — identifica a ata juridicamente |
| R7 | **Nunca remova o filtro `school_id` de queries ao Supabase** | Causaria vazamento de dados entre escolas |
| R8 | **Nunca altere `DEFAULT_PERMISSIONS` sem avisar o time** | Define o que cada cargo pode acessar em todo o sistema |

---

## 3. Checklist obrigatório antes de iniciar qualquer alteração

Antes de escrever qualquer linha de código, responda em voz alta:

- [ ] Li todos os arquivos de `docs/` relevantes para esta tarefa?
- [ ] A mudança afeta `middleware.ts`, `store.tsx`, `login/page.tsx` ou `useTenantConfig.ts`? → Leia `docs/ARQUITETURA.md`
- [ ] A mudança afeta permissões de cargo? → Leia `docs/REGRAS-NEGOCIO.md` seção 4
- [ ] A mudança afeta banco de dados (tabelas, colunas, queries)? → Leia `docs/BANCO-DE-DADOS.md`
- [ ] A mudança afeta redirecionamento ou rotas? → Confirme a regra R4 acima
- [ ] A mudança pode afetar outra escola além da solicitada?

---

## 4. Protocolo para mudanças críticas

Se a alteração tocar em qualquer item abaixo, **pare e apresente um resumo** antes de implementar:

- `middleware.ts` — roteamento de tenants
- `lib/store.tsx` — estado global e autenticação
- `lib/useTenantConfig.ts` — mapeamento tenant → escola → banco
- `lib/data.ts` — tipos e interfaces base
- `app/login/page.tsx` — fluxo de autenticação
- `next.config.ts` — CSP, headers de segurança
- Qualquer `migration SQL` no Supabase
- Qualquer alteração em `DEFAULT_PERMISSIONS`

**Formato do resumo obrigatório:**

```
🔍 ANÁLISE ANTES DE IMPLEMENTAR

O que será alterado: [arquivo(s) e linhas]
Por que: [motivo técnico]
Impacto em outras escolas: [sim/não — qual]
Risco de regressão: [baixo/médio/alto — por quê]
Rollback possível: [sim/não — como]

Posso prosseguir?
```

---

## 5. Leitura dos demais arquivos docs/

| Arquivo | Quando ler |
|---------|-----------|
| `docs/ARQUITETURA.md` | Antes de mexer em roteamento, middleware, autenticação ou tenant |
| `docs/REGRAS-NEGOCIO.md` | Antes de mexer em ocorrências, pontos, permissões ou cargos |
| `docs/BANCO-DE-DADOS.md` | Antes de qualquer query, migration ou novo campo |
| `docs/CHANGELOG.md` | Para entender o histórico e evitar regredir correções já feitas |

---

## 6. Sincronização do código

Sempre que iniciar uma sessão nova com o repositório:

```bash
npx -y degit manoel-domingos/eecmprofjoaobatista . --force
```

Nunca edite baseado em memória de sessões anteriores. O código pode ter mudado.
