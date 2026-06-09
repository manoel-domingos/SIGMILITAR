# Arquitetura SIGMILITAR

Data: 2026-06-09

## 1. Overview

Sistema escolar para gestão disciplinar, alunos, ocorrências, MEG/FICAI e DRE.
**Um banco Postgres compartilhado com `school_id` + RLS + RBAC.**

## 2. Stack

- Next.js App Router + TypeScript
- Supabase (Auth + Postgres + Storage + RLS)
- Tailwind CSS / shadcn/ui
- Vercel (deploy)

## 3. Multi-Tenancy

- Tenant lógico por `school_id`
- `school_id` vindo do cliente nunca é confiável sozinho — RLS bloqueia acesso lateral
- Fluxo: Middleware resolve host/path → servidor resolve tenant em `schools` → RBAC valida acesso

## 4. Tabelas principais (Supabase Cloud)

`schools`, `school_settings`, `user_profiles`, `students`, `occurrences`, `occurrence_checklists`, `rules`, `audit_logs`, `xerifes`, `staff`, `staff_members`, `accidents`, `conduct_terms`, `summons`, `praises`, `dashboard_panels`, `implantacao_categories`, `implantacao_items`, `meg_eixos`, `meg_fases`, `meg_evidencias`, `meg_checklist`, `meg_formularios`, `meg_avaliacao_resultados`, `ficai_importacoes`, `system_notifications`, `agenda_preventiva`, `ocorrencias`, `fichas_notificacao`, `acompanhamentos`

## 5. Segurança — Riscos conhecidos

- Policies RLS com `USING true` em algumas tabelas — hardening pendente
- Storage `student-files` permite leitura pública — fechar via policies por path tenant
- `user_profiles.password` armazena senha plaintext — remover
- Migrations do repo desalinhadas do Cloud → **fonte da verdade é o Supabase Cloud**

## 6. Critérios de aceite

- Usuário de uma escola não lê dados de outra via frontend nem chamada direta Supabase
- `anon` não acessa tabelas escolares
- Service role não é usado sem caller autenticado/autorizado
- Storage não permite list/upload/delete público
- Advisors Supabase não apontam policies abertas em dados sensíveis
