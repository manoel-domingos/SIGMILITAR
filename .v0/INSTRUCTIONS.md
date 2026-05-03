# INSTRUCTIONS — Cole isto em v0 Settings → Rules

> Bloco mestre que ativa o v0-OS no v0. **Copie tudo abaixo da linha** e cole em **Settings → Rules**.

---

## v0-OS Operating Protocol

Este projeto opera sob o framework **v0-OS** (markdowns em `.v0/`). Siga rigorosamente:

### 1. Boot de cada sessão

Sempre que iniciar uma nova conversa OU receber a primeira mensagem após pull:

1. Leia `.v0/STATE.md` para saber onde paramos
2. Leia `.v0/PROJECT.md` se for primeira interação no projeto
3. Anuncie em 1 linha: "Retomando: [última ação]. Próximo: [próxima ação]."

### 2. Loop PAUL (Plan → Apply → Unify)

Para qualquer feature ou mudança não-trivial:

**PLAN** — antes de codar:
- Carregue regras relevantes de `.v0/rules/<dominio>.md` (development, disciplina, ai)
- Crie `.v0/plans/NNNN-titulo.md` usando `.v0/plans/template.md`
- O plano DEVE ter Acceptance Criteria em formato BDD (Given/When/Then)
- Mostre o plano e aguarde aprovação antes de implementar

**APPLY** — implementação:
- Siga o plano. Se desviar, registre no plano com "DESVIO:" antes de continuar
- Use Edit/Write conforme padrões do v0

**UNIFY** — fechamento:
- Atualize `.v0/STATE.md` (última ação, próxima ação, data)
- Se decidiu algo importante, append em `.v0/DECISIONS.md` (formato no topo do arquivo)
- Marque tarefas no plano

### 3. Mudanças triviais (skip PLAN)

Para typos, ajuste de copy, fix óbvio: implemente direto, mas ainda atualize STATE.md no final.

### 4. Decisões com 2+ opções

Quando houver bifurcação arquitetural, sempre apresente exatamente 2 caminhos com:
- Como funciona
- Vantagens / Desvantagens
- Recomendação

### 5. Drift Score

Em STATE.md há um campo Drift Score. Incremente em +1 toda vez que sair do plano sem registrar desvio. Se chegar a 3, pare e proponha replanejamento.

### 6. Comunicação

- Sempre em português pt-BR
- Conciso, sem emojis (a menos que pedido)
- Postamble curto (2-4 frases) após implementar

### 7. Comandos especiais (star-commands estilo CARL)

Reaja aos seguintes comandos especiais do operador:

- `*state` — mostre o conteúdo de `.v0/STATE.md`
- `*plan <titulo>` — entre em modo plano forçado e crie `.v0/plans/NNNN-titulo.md`
- `*decide <assunto>` — crie entrada em `.v0/DECISIONS.md`
- `*roadmap` — mostre `.v0/ROADMAP.md`
- `*rules <dominio>` — leia e mostre `.v0/rules/<dominio>.md`
- `*sync` — atualize STATE.md com sumário da sessão atual

### 8. Tabu

- NÃO reescrever `DECISIONS.md` — sempre append-only
- NÃO traduzir nomes técnicos, marcas, comandos
- NÃO assumir variáveis de ambiente sem checar
- NÃO criar features fora do `ROADMAP.md` sem perguntar

---

Fim das regras v0-OS.
