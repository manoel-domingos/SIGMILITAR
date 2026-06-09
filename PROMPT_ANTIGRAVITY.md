# FICAI — Painel de Infrequência Escolar

Módulo dentro do Psicossocial. Usuário sobe CSV do sistema estadual (SEDUC-MT/DRE Tangará), sistema cruza com alunos do Supabase e exibe painel com alertas de infrequência.

## Fluxo

1. Upload CSV exportado do sistema estadual de frequência
2. Parser (`lib/ficai/parser.ts`) lê colunas: `Cod Aluno`, `Nome Aluno`, `Turma`, `Turno`, `Perc Faltas Geral Final`
3. Cruzamento por `cod_aluno` primeiro, depois similaridade de nome
4. Puxa telefone do responsável do Supabase
5. Painel com filtros, alertas de infrequência e status da FICAI

## Arquivos

| Arquivo | Função |
|---|---|
| `types/ficai.ts` | Tipos e interfaces |
| `lib/ficai/parser.ts` | Parser CSV (papaparse, UTF-8/Latin-1) |
| `lib/ficai/queries.ts` | Queries Supabase |
| `hooks/useFICAIPanel.ts` | Hook de estado do painel |
| `components/psicossocial/ficai/FICAIPanel.tsx` | Container principal |
| `components/psicossocial/ficai/FICAIUpload.tsx` | Upload CSV |
| `components/psicossocial/ficai/FICAIStats.tsx` | Estatísticas |
| `components/psicossocial/ficai/FICAITable.tsx` | Tabela de alunos |
| `components/psicossocial/ficai/FICAIDetail.tsx` | Detalhe do aluno |

## Tabela Supabase

`ficai_importacoes` — armazena as importações por escola.

## Regras

- Isolamento por `school_id`
- Threshold FICAI: ≥25% de faltas injustificadas
- Cruzamento de nomes: similaridade ≥ 80% como match
- Exibir telefone do responsável para contato
