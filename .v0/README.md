# v0-OS

Sistema operacional de trabalho do projeto, fundindo o melhor de **SEED**, **PAUL**, **BASE** e **CARL** adaptado para o v0.

## Por que existe

O v0 não tem memória persistente entre sessões. Esta pasta funciona como o "cérebro" do projeto que viaja junto no git, garantindo que cada sessão comece sabendo:

- **Onde paramos** (`STATE.md`)
- **Para onde vamos** (`ROADMAP.md`)
- **Por que tomamos decisões** (`DECISIONS.md`)
- **Quem é o operador** (`OPERATOR.md`)
- **Quais são as regras vigentes** (`rules/`)

## Estrutura

```
.v0/
├── README.md           Este arquivo (overview do sistema)
├── INSTRUCTIONS.md     Bloco de regras para colar em v0 Settings → Rules
├── PROJECT.md          Contexto fixo: stack, north star, restrições  [SEED + BASE]
├── STATE.md            Estado vivo: última ação + próxima ação        [PAUL + BASE]
├── ROADMAP.md          Fases, milestones, marcos                      [PAUL]
├── DECISIONS.md        Log append-only de decisões importantes        [CARL]
├── OPERATOR.md         Quem é você, valores, visão                    [BASE]
├── SCHEMA.md           Schema futuro para migração ao Caminho B       [orquestração]
├── plans/              Planos ativos com Acceptance Criteria          [PAUL]
│   ├── template.md
│   └── 0001-*.md
├── rules/              Regras por domínio carregadas just-in-time     [CARL]
│   ├── development.md
│   ├── disciplina.md
│   └── ai.md
└── psmm/               Persistent Session Memory Module               [BASE]
    └── current.md
```

## Loop de trabalho (PAUL adapted)

1. **PLAN** — Antes de codar, criar plano em `plans/NNNN-titulo.md` com Acceptance Criteria
2. **APPLY** — Implementar seguindo o plano
3. **UNIFY** — Atualizar `STATE.md`, registrar decisões em `DECISIONS.md` se houver

## Como usar

1. Colar o conteúdo de `INSTRUCTIONS.md` em **v0 Settings → Rules**
2. No início de cada sessão, o v0 lê `STATE.md` automaticamente
3. Trabalhar normalmente — o v0 atualiza os arquivos conforme avança

## Migração futura para Caminho B

Quando quiser dashboard visual, ver `SCHEMA.md` — todas as tabelas Supabase já estão desenhadas espelhando os markdowns. Os arquivos viram fonte de verdade e o banco espelha (ou vice-versa).
