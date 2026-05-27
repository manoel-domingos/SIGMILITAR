# CHANGELOG.md — Histórico de Mudanças Críticas

> Registre aqui toda alteração crítica de sistema: migrations, mudanças de arquitetura, correções de bugs graves, alterações em permissões ou regras de negócio.

Formato de entrada:
```
## [DATA] Título da mudança
**Arquivos:** lista de arquivos alterados
**Motivo:** por que foi feito
**Impacto:** o que mudou no comportamento
**Rollback:** como desfazer se necessário
```

---

## [2026-05] Adição de coluna linked_professor em occurrences
**Arquivos:** `supabase_add_linked_professor.sql`, `lib/store.tsx`, `app/[escola]/registro-disciplinar/page.tsx`
**Motivo:** Campo para vincular explicitamente um professor a uma ocorrência
**Impacto:** Professores agora veem ocorrências onde aparecem como `linked_professor`, além de `registered_by` e `located_by`
**Rollback:** Remover coluna `linked_professor` da tabela `occurrences` no Supabase

---

## [2026-05] Migração de domínio kallyteros → sigmilitar.com.br
**Arquivos:** `middleware.ts`, `app/login/page.tsx`, `lib/useTenantConfig.ts`
**Motivo:** Mudança de domínio oficial do sistema
**Impacto:** Todas as rotas passaram a usar `sigmilitar.com.br/[slug]/paginas`. Domínio kallyteros descontinuado.
**Rollback:** Reintroduzir entradas `kallyteros` no `hostToTenant` e `TENANT_MAP`

---

## [2026-05] Correção: isLandingDomain ignorava pathname
**Arquivos:** `app/[escola]/page.tsx`
**Motivo:** Em `sigmilitar.com.br/eecmheliodoro`, o hostname era `sigmilitar.com.br` → mostrava LandingPage no lugar do dashboard
**Impacto:** Agora verifica também o primeiro segmento do pathname para validar se é rota de escola
**Rollback:** Reverter condição `isLandingDomain` para checar apenas hostname

---

## [2026-05] Correção: .single() → .maybeSingle() em dashboard_panels
**Arquivos:** `app/[escola]/page.tsx`
**Motivo:** `.single()` retornava 406 quando usuário ainda não tinha painel salvo
**Impacto:** Novos usuários não veem mais erro 406 no console
**Rollback:** Trocar `.maybeSingle()` de volta para `.single()`

---

## [2026-05] Correção: GoTrueClient duplicado em [escola]/page.tsx
**Arquivos:** `app/[escola]/page.tsx`
**Motivo:** Arquivo criava instância local do Supabase em vez de usar o singleton
**Impacto:** Aviso de instâncias duplicadas eliminado; sessão mais estável
**Rollback:** Restaurar função local `supabase()` com `createClient`

---

## [2026-05] CSP: adicionado i.postimg.cc ao img-src
**Arquivos:** `next.config.ts`
**Motivo:** Imagens de fotos de alunos/ocorrências hospedadas em postimg estavam sendo bloqueadas
**Impacto:** Imagens de postimg.cc carregam corretamente
**Rollback:** Remover `https://i.postimg.cc https://*.postimg.cc` da diretiva `img-src`

---

## [2026-05] Modal de seleção de escola no login para admin_global
**Arquivos:** `app/login/page.tsx`
**Motivo:** admin_global era redirecionado direto para /dre; agora vê o modal de escolha de escola
**Impacto:** admin_global pode escolher entre Painel DRE ou acessar diretamente uma escola
**Rollback:** Reverter `openContextModal()` para `router.push('/dre')` no useEffect de redirecionamento

---

<!-- Adicione novas entradas ACIMA desta linha, em ordem cronológica reversa -->
