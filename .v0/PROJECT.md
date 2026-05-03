# PROJECT

> Contexto fixo do projeto. Atualizar raramente — só quando a essência muda.

## Identidade

- **Nome:** EECM Prof. João Batista (Sistema de Gestão Escolar)
- **Tipo:** Aplicação web institucional
- **Domínio:** Escola Estadual Cívico-Militar
- **Repo:** `manoel-domingos/eecmprofjoaobatista`

## North Star

Centralizar a gestão disciplinar, pedagógica e administrativa da escola em um único sistema, substituindo planilhas e papelada manual por fluxos auditáveis e ágeis para os monitores e a direção.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) + React 19 |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Banco | Supabase (PostgreSQL) — `imprdimqcjbndqewioyt` |
| Auth | Supabase Auth |
| IA | DeepSeek (`deepseek-chat`, `deepseek-reasoner`) via OpenAI SDK |
| Storage | Google Drive API (planejado) + Vercel Blob (futuro) |
| Tabelas | XLSX (sheetjs) |
| Animações | Framer Motion |
| Charts | Recharts |

## Domínios funcionais

1. **Disciplina** — alunos, ocorrências, regras, termos de conduta, intimações
2. **Acidentes** — registro de incidentes
3. **Elogios** — reconhecimentos positivos
4. **Documentos** — anexos via Google Drive
5. **IA** — assistente DeepSeek para geração de textos e análises
6. **Auditoria** — logs de todas operações

## Restrições

- **Acessível** a usuários de baixa proficiência tech (monitores, professores)
- **Confiável** — dados disciplinares são sensíveis e auditáveis
- **Localizado** em pt-BR
- **Mobile-friendly** — monitores usam celular em ronda
- **Não expor** chaves Supabase service_role no client

## Fora do escopo

- Sistema acadêmico (notas, frequência) — outro sistema cuida
- Folha de pagamento
- Comunicação com pais (por enquanto)
