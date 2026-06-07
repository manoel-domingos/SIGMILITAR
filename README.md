# SIGMILITAR

SIGMILITAR é uma aplicação escolar multi-tenant para gestão disciplinar, acompanhamento de alunos, registros pedagógicos/psicossociais, FICAI, arquivos de evidências e visão administrativa por escola ou DRE.

## Stack

- Next.js App Router + React + TypeScript
- Supabase Auth, Postgres, RLS e Storage
- Google Drive API para repositórios de alunos
- Integrações de IA via Gemini/OpenAI, conforme variáveis configuradas
- Tailwind CSS

## Requisitos

- Node.js 20+
- npm
- Projeto Supabase com as migrations em `supabase/migrations`
- Credenciais de serviços externos quando os módulos correspondentes forem usados

## Configuração local

1. Instale dependências:

   ```bash
   npm install
   ```

2. Crie `.env.local` a partir de `.env.example` e preencha as credenciais necessárias.

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse a rota da escola configurada, por exemplo `/joaobatista`, ou a rota DRE quando seu usuário tiver permissão.

## Scripts úteis

- `npm run dev`: injeta versão e inicia o Next.js em modo desenvolvimento.
- `npm run build`: injeta versão e gera build de produção.
- `npm run start`: inicia build de produção já gerado.
- `npm run lint`: executa ESLint no repositório.
- `npm run test`: executa testes unitários com Vitest.
- `npm run tokens`: estima uso de contexto da sessão local.

## Banco de dados e migrations

As migrations versionadas ficam em `supabase/migrations`. Para ambientes já existentes, confira o estado real do banco antes de aplicar alterações destrutivas. O projeto usa `school_id`, RLS e RBAC para isolamento entre escolas.

## Observações de segurança

- Não use `user_metadata` como fonte final de autorização.
- Aplique autorização sensível no servidor e no banco.
- Não confie em `school_id` enviado pelo cliente sem validação por RBAC/RLS.
- Mantenha buckets privados e policies por tenant quando houver dados de alunos.

## Testes

Os testes unitários atuais cobrem funções puras do parser FICAI. Novos bugs em importação, matching de aluno ou regras de frequência devem incluir casos em `*.test.ts`.
