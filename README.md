<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SIGMILITAR — Sistema de Gestão para Escolas Cívico-Militares

Sistema multi-tenant de gestão disciplinar e pedagógica para Escolas Cívico-Militares do estado de Mato Grosso.

## Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS
- **Backend / Banco:** Supabase (PostgreSQL + RLS)
- **IA:** DeepSeek v3 (via API compatível com OpenAI)
- **Deploy:** Vercel
- **Auth:** Google OAuth + Supabase Auth

## Executar localmente

**Pré-requisitos:** Node.js 18+

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Configurar variáveis de ambiente em `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   DEEPSEEK_API_KEY=...
   ```

3. Rodar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura multi-tenant

Cada escola acessa o sistema pelo seu slug: `/[escola]/registro-disciplinar`, `/[escola]/configuracoes`, etc.

O isolamento de dados é garantido por `school_id` em todas as tabelas via RLS no Supabase.

## Módulos

- **Registro Disciplinar** — ATAs, ocorrências, sanções com geração de texto por IA
- **Medidas Disciplinares** — Regimento interno, artigos e medidas aplicáveis
- **Ficha Disciplinar** — Histórico individual por aluno com análise por IA
- **Pedagógico (MEG)** — Modelo de Excelência em Gestão escolar
- **Relatórios** — DRE, rankings, relatórios gerenciais com síntese por IA
- **Psicossocial (FICAI)** — Acompanhamento de alunos em vulnerabilidade social
