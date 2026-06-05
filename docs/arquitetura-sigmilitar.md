# Arquitetura SIGMILITAR - Estabilizacao, Multi-Tenant e Migracao Supabase

Data: 2026-06-05

## 1. Overview

O SIGMILITAR e um sistema escolar para gestao disciplinar, alunos, ocorrencias, regras, servidores/equipe, relatorios, implantacao, MEG/FICAI, arquivos de alunos/evidencias e gestao por escola/DRE.

O objetivo da proxima fase e estabilizar o produto antes da migracao para VPS:

- garantir isolamento entre escolas;
- eliminar vazamento lateral por tenant;
- centralizar autorizacao no banco e no servidor;
- alinhar migrations do repositorio com o Supabase Cloud real;
- preparar backup, restore e deploy previsiveis.

Decisao arquitetural atual: manter **um banco Postgres compartilhado com `school_id` + RLS + RBAC**, e deixar schema/banco por tenant apenas como evolucao futura para tenants muito grandes ou exigencia contratual.

## 2. Stack Tecnologica

### Atual observada

- Next.js App Router
- TypeScript
- React
- Supabase JS
- Supabase Auth
- Supabase Postgres Cloud
- Supabase Storage
- Middleware por host/subdominio
- Docker disponivel na VPS
- GitHub: `manoel-domingos/SIGMILITAR`

### Stack alvo para estabilidade

- Next.js App Router + TypeScript
- Supabase Postgres com RLS forte
- RBAC em tabelas do banco
- API routes server-side para operacoes sensiveis
- Storage privado com policies por tenant
- Docker/Nginx/SSL na VPS
- Backups `pg_dump` + checksum
- CI/CD antes de deploy

Itens citados como alvo futuro, mas ainda nao comprovados como base atual do repo: Prisma, Redis, NextAuth.js, Stripe e API Anthropic. Eles devem entrar somente se houver requisito real e desenho aprovado.

## 3. Multi-Tenancy

### Modelo recomendado

Usar tenant logico por `school_id`.

Cada usuario deve ter escopos explicitos em tabela de membership/RBAC. O tenant ativo pode vir de host, subdominio ou UI, mas a autorizacao final deve ser decidida pelo banco/servidor.

### Regras

- `school_id` enviado pelo cliente nunca e confiavel sozinho.
- `sessionStorage`, hostname e filtros frontend sao apenas UX.
- RLS deve bloquear acesso lateral mesmo se alguem chamar a API Supabase diretamente.
- DRE/admin global deve ter escopo explicito, nao bypass aberto.

### Tenant resolution

Fluxo alvo:

1. Middleware identifica host/subdominio.
2. Servidor resolve tenant em tabela `schools`.
3. Usuario autenticado e carregado por `auth.uid()`.
4. Membership/RBAC valida se o usuario pode acessar aquele tenant.
5. Queries rodam com RLS e, para operacoes sensiveis, tambem com validacao server-side.

## 4. Schema do Banco

### Tabelas existentes no Supabase Cloud

- `schools`
- `school_settings`
- `user_profiles`
- `students`
- `occurrences`
- `occurrence_checklists`
- `rules`
- `audit_logs`
- `xerifes`
- `staff`
- `staff_members`
- `accidents`
- `conduct_terms`
- `summons`
- `praises`
- `dashboard_panels`
- `implantacao_categories`
- `implantacao_items`
- `meg_eixos`
- `meg_fases`
- `meg_evidencias`
- `meg_checklist`
- `meg_formularios`
- `meg_avaliacao_resultados`
- `ficai_importacoes`
- `system_notifications`

### Tabelas alvo de RBAC

- `roles`
- `permissions`
- `role_permissions`
- `user_school_memberships`

Campos minimos:

- `user_school_memberships.id`
- `user_school_memberships.user_id`
- `user_school_memberships.school_id`
- `user_school_memberships.role_id`
- `user_school_memberships.active`
- `user_school_memberships.created_at`
- `user_school_memberships.updated_at`

Constraints minimas:

- unique `user_id, school_id`
- FK para `auth.users`
- FK para `schools`
- FK para `roles`

Indices minimos:

- `user_school_memberships(user_id)`
- `user_school_memberships(school_id)`
- `user_school_memberships(user_id, school_id)`
- indices para FKs sem indice apontadas pelos advisors

## 5. Plano de Seguranca

### Riscos confirmados

- Muitas policies RLS usam `USING true` / `WITH CHECK true`.
- Grants amplos para `anon` e `authenticated`.
- Buckets de arquivos publicos.
- Storage permite leitura/upload/delete publico em `student-files`.
- Rotas API usam `SUPABASE_SERVICE_ROLE_KEY` sem validacao suficiente.
- Existe logica de role/admin hardcoded no cliente.
- Existe persistencia de senha em `user_profiles.password`.
- Migrations do repo e Cloud estao desalinhadas.

### Hardening Cloud - ordem

1. Backup antes de DDL.
2. Criar migration de RBAC/memberships.
3. Criar funcoes seguras com `search_path` fixo.
4. Substituir policies `true` por policies tenant-aware.
5. Revogar grants inseguros de `anon`.
6. Fechar buckets e criar policies por path tenant.
7. Remover uso de senha plaintext.
8. Rodar security/performance advisors novamente.

### Auth/RBAC

Autorizacao deve ser baseada em:

- `auth.uid()`
- membership ativa no banco
- permissao atribuida por role
- tenant/school explicitamente permitido

Nao usar `user_metadata` como fonte de autorizacao. Preferir tabela DB e, se necessario, `app_metadata` apenas como claim confiavel controlada pelo servidor.

## 6. Plano de Deploy e Migracao VPS

### Antes da VPS

- Cloud hardenado.
- Backup validado.
- Migrations alinhadas.
- Tests de RLS criados.
- Service-role routes protegidas.

### VPS staging

- Restaurar dump em ambiente staging.
- Rodar migrations.
- Validar auth, storage, RLS e rotas criticas.
- Testar importacao de alunos, criacao de usuarios, ocorrencias e DRE.

### Cutover

- Backup final Cloud.
- Janela de manutencao.
- Restaurar no Supabase self-host/VPS.
- Atualizar env vars.
- Validar smoke tests.
- Manter rollback para Cloud ate estabilizar.

## 7. Primeira Leva de Melhorias

1. Criar migration `rbac_foundation`.
2. Criar funcoes:
   - `current_user_school_ids()`
   - `user_has_school_access(school_id)`
   - `user_has_permission(school_id, permission_key)`
3. Trocar policies abertas das tabelas escolares principais:
   - `students`
   - `occurrences`
   - `audit_logs`
   - `rules`
   - `xerifes`
   - `staff_members`
   - `user_profiles`
4. Proteger APIs com service role:
   - `app/api/admin/create-user/route.ts`
   - `app/api/alunos/import/route.ts`
   - `app/api/onboarding/provision/route.ts`
   - `app/api/status/route.ts`
5. Remover senha plaintext e admin hardcoded.

## 8. Criterios de Aceite

- Usuario de uma escola nao le dados de outra via frontend nem chamada direta Supabase.
- `anon` nao acessa tabelas escolares.
- Service role nao e usado sem caller autenticado/autorizado.
- Storage nao permite list/upload/delete publico.
- Backup Cloud existe na VPS e no PC.
- Migrations do repo representam o estado real do banco.
- Advisors Supabase nao apontam policies abertas em dados sensiveis.
