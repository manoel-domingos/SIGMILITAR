# MEG Parte 2 — Formulários e Avaliação de Resultados

Continuação do módulo pedagógico. Assume tabelas e rotas já criadas (Parte 1).

## Dimensões de avaliação por eixo

| Dimensão | Pontuação máxima | O que avalia |
|---|---|---|
| Processos | 75 pts (eixos 1–4) / 100 pts (eixo 5) | Documentos/evidências por fase |
| Resultados | 110 pts (eixos 1–4) / 160 pts (eixo 5) | Checklist in loco (escala 0–4) |
| **Total** | **1000 pts** | "Oscar da Educação" |

## Escala de resultados (0–4)

| Nota | Critério |
|---|---|
| 0 | Não possui / Não atende |
| 1 | Atende parcialmente (até 25%) |
| 2 | Atende parcialmente (até 50%) |
| 3 | Atende parcialmente (até 75%) |
| 4 | Atende plenamente |

## Tabelas envolvidas

- `meg_avaliacao_resultados` — resultados do checklist in loco por escola/eixo/critério
- `meg_formularios` — formulários de avaliação preenchidos
- `meg_checklist` — estado das evidências por fase

## Interfaces (`lib/meg-data.ts`)

```ts
MegResultadoAnual {
  eixoId: string;
  ano: number;
  processos: number;
  maxProcessos: number;
  resultados: number;
  maxResultados: number;
}
```

## Regras de cálculo

- Pontuação de processos: somatório das notas das sub-etapas por eixo
- Pontuação de resultados: soma dos critérios × peso, normalizado para o máximo do eixo
- Total Oscar = soma de todos os eixos (máximo 1000)
- `MEG_TOTAIS_ANUAIS` agrega os totais por ano para exibição histórica

## Notas de implementação

- Checkboxes de evidência: `pendente` → `em_andamento` → `concluido` (3 estados circulares)
- Readonly para `PROFESSOR` e `MONITOR`
- Após 3 edições salvas → dispara entrada no sino de notificações
- Rollback otimista em falha de save
