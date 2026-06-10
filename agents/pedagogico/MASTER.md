# MASTER.md — Sub-agente: Pedagogico

> Changelog automático. Atualizado pelo Ralph Loop e pelo Sub-agente após cada análise relevante.
> O Agente Orquestrador lê este arquivo para obter um resumo rápido do domínio sem precisar acionar o sub-agente completo.

---

## Resumo do Domínio

**Sub-agente:** Pedagogico
**Última atualização:** 2026-06-10 (MEG rebuild)
**Status geral:** ✓ Normal

---

## Changelog

### 2026-06-10 — Reconstrução completa do portal MEG (fidelidade PDF SEDUC-MT)
**Trigger:** Usuário solicitou rebuild completo do módulo pedagógico
**Resumo:**
- Modelo 5-fases PDCA substituído pelo modelo real 2-dimensões: Processos + Resultado Estrutural
- Slugs corretos: `patrimonio, alimentacao, limpeza, manutencao, gestao`
- `lib/meg/` criado (framework estático) — eixos, processos, resultados, forms, index com helpers
- Totais corrigidos: 410 processos + 600 resultado = 1010 pts (era 1000)
- Baseline 2025 por `school_id` em `meg_avaliacoes_anuais` (somente João Batista semeado — sem vazamento multi-tenant)
- `meg_checklist` com coluna `ano` + unique `(school_id, evidencia_id, ano)`
- Componentes novos/reescritos: ProcessosChecklist, ResultadoEstruturalChecklist, MegRadarChart, MegBarChart, EixoCard atualizado
- Oscar corrigido: usa `/1010`, compara 2025 vs atual por eixo
- `[eixo]/page.tsx`: 2 abas (Processos | Resultado Estrutural), baseline por escola, score ao vivo
- 3 erros TypeScript corrigidos: `eixo` null guard, recharts formatter `any`, MegFormulario props faltando
**Build Vercel:** `dpl_5C5m6qUTeXjjivtoSh9ZJ81L2idE` — state=READY (commit `132040d`)
**Status:** Concluído

### 2026-06-09 — OnboardingChecklist criado
**Trigger:** Solicitação do usuário
**Resumo:** `components/OnboardingChecklist.tsx` — card flutuante bottom-left, steps por role (GESTOR: 5, COORD: 4, PROFESSOR: 3, MONITOR: 2), auto-detect via Supabase (students/occurrences count), persistência localStorage, integrado ao AppShell. TL;DR da sessão inserido em `system_notifications` (sino > aba Atualizações).
**Status:** Concluído

### 2026-06-08 — Ciclo Ralph Loop (inicialização)
**Trigger:** ralph-loop --init
**Resumo:** MEG e acompanhamento pedagógico
**Métricas coletadas:** 3 indicadores atualizados
**Alertas:** Nenhum
**Status:** Concluído

### 2026-06-09 — Inicialização do sistema
**Trigger:** Setup inicial da estrutura de agentes (ralph-loop --init)
**Resumo:** Sub-agente criado e configurado. Estrutura de pastas estabelecida.
**Dados em `data/`:** Nenhum ainda — aguardando primeira carga.
**Status:** Pronto para receber dados

---

## Estado Atual

| Indicador | Valor | Atualizado em |
|-----------|-------|---------------|
| Progresso MEG médio | Consultar Supabase | 2026-06-08 |
| Alunos em FICAI | Verificar | 2026-06-08 |
| Arquivos em data/ | 0 | 2026-06-08 |

---

## Alertas Ativos

- Nenhum alerta ativo

---

## Instruções para o Orquestrador

Para análise superficial: este arquivo contém o resumo mais recente do domínio **Pedagogico**.
Para análise profunda: acione o sub-agente lendo `agents/pedagogico/CLAUDE.md` e os arquivos em `agents/pedagogico/data/`.
