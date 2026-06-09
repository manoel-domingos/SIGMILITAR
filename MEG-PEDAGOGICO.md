# MEG EDUCAÇÃO — Gestão Pedagógica SIGMILITAR

Módulo baseado no Modelo de Excelência em Gestão (MEG SEDUC-MT).

## Estrutura de pontuação

| Eixo | Processos | Resultados | Total |
|---|---|---|---|
| 1 — Patrimônio | 75 | 110 | 185 |
| 2 — Alimentação | 75 | 110 | 185 |
| 3 — Limpeza | 75 | 110 | 185 |
| 4 — Manutenção | 75 | 110 | 185 |
| 5 — Gestão Escolar | 100 | 160 | 260 |
| **Total** | **400** | **600** | **1000** |

## Resultados 2025 — EECM Prof. João Batista

| # | Eixo | ID sistema | Processos | Máx | Resultado | Máx | Total |
|---|---|---|---|---|---|---|---|
| 1 | Patrimônio | `patrimonio` | 35,9 | 75 | 88,0 | 110 | 123,9 |
| 2 | Alimentação | `lideranca` | 54,4 | 75 | 89,8 | 110 | 144,2 |
| 3 | Limpeza | `pedagogico` | 9,4 | 75 | 84,6 | 110 | 94,0 |
| 4 | Manutenção | `gestao-escolar` | 18,8 | 75 | 91,1 | 110 | 109,9 |
| 5 | Gestão Escolar | `clima-escolar` | 97,9 | 115 | 140,0 | 160 | 237,9 |
| | **TOTAL** | | **216,4** | **415** | **493,5** | **600** | **709,9** |

> `maxProcessos` do eixo `clima-escolar` = **115** (corrigido em jun/2025, era 100).
> ⚠️ Eixo 3 (Limpeza) = maior oportunidade de melhoria em 2026.

## Arquivos do módulo

| Arquivo | Função |
|---|---|
| `lib/meg-data.ts` | Dados, interfaces, constantes MEG |
| `app/[escola]/pedagogico/page.tsx` | Dashboard dos eixos |
| `app/[escola]/pedagogico/[eixo]/page.tsx` | Fases de um eixo |
| `app/[escola]/pedagogico/[eixo]/[fase]/page.tsx` | Evidências por fase |

## Regras de negócio

- Checkboxes de 3 estados: pendente → em andamento → concluído
- Roles com edição: `admin_global`, `GESTOR`, `COORD`
- Roles somente leitura: `PROFESSOR`, `MONITOR`
- RLS valida `school_id` em todas as tabelas `meg_*`
- A cada 3 edições MEG → dispara notificação no sino

## Interfaces chave (`lib/meg-data.ts`)

- `MegEvidencia`: `documento`, `codigoPDF`, `resultados`
- `MegResultadoAnual`: pontuação por eixo/ano
- `MEG_RESULTADOS_ANUAIS`, `MEG_TOTAIS_ANUAIS`: dados históricos

## Changelog

| Data | Versão | Alteração |
|---|---|---|
| jun/2025 | v2.0 | Sub-etapas Planejamento/Execução nos 5 eixos |
| jun/2025 | v2.0 | `MEG_RESULTADOS_ANUAIS` e `MEG_TOTAIS_ANUAIS` com dados 2025 |
| jun/2025 | v2.0 | `MegEvidencia` estendida: `documento`, `codigoPDF`, `resultados` |
| jun/2025 | v2.0 | `maxProcessos` clima-escolar: 100 → 115 |
