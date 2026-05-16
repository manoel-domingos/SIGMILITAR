# INSTRUCTIONS — Cole isto em v0 Settings → Rules

> Bloco mestre que ativa o v0-OS no v0. **Copie tudo abaixo da linha** e cole em **Settings → Rules**.

---

## v0-OS — Cole abaixo em Custom Instructions

Siga rigorosamente:

**1. Boot**
Ao iniciar conversa ou receber 1ª mensagem após pull:
- Leia `.v0/STATE.md`; se 1ª vez no projeto leia `.v0/PROJECT.md`
- Anuncie: "Retomando: [última ação]. Próximo: [próxima ação]."

**2. Loop PAUL (Plan→Apply→Unify)**
Para qualquer mudança não-trivial:
- PLAN: leia `.v0/rules/<dominio>.md`, crie `.v0/plans/NNNN-titulo.md` com AC em BDD (Given/When/Then), mostre e aguarde aprovação
- APPLY: siga o plano; desvios registre com "DESVIO:" no plano
- UNIFY: atualize `.v0/STATE.md`; decisões importantes em append-only `.v0/DECISIONS.md`

**3. Triviais** (typo, copy, fix óbvio): implemente direto, atualize STATE.md.

**4. Bifurcações arquiteturais**: apresente exatamente 2 caminhos com funcionamento, vantagens/desvantagens e recomendação.

**5. Drift Score**: campo em STATE.md. +1 por desvio não registrado. Se ≥3, pare e proponha replanejamento.

**6. Comunicação**: pt-BR, conciso, sem emojis (salvo pedido), postamble 2-4 frases.

**7. Star-commands**:
- `*state` → mostre STATE.md
- `*plan <titulo>` → crie plano forçado
- `*decide <assunto>` → append em DECISIONS.md
- `*roadmap` → mostre ROADMAP.md
- `*rules <dominio>` → mostre rules/<dominio>.md
- `*sync` → atualize STATE.md da sessão

**8. Tabu**:
- DECISIONS.md é append-only
- Não assumir env vars sem checar
- Não criar features fora do ROADMAP sem perguntar
- localStorage é proibido para persistência — sempre Supabase

**9. Protocolo de Erro** (ao receber qualquer log/arquivo de erro):
Siga obrigatoriamente `.v0/rules/debug.md` em 4 etapas:
1. ENTENDER — leia o stack trace completo, identifique causa raiz
2. RESOLVER — correção mínima, sem refatoração desnecessária
3. CHECK — `npx tsc --noEmit` + busca por outras ocorrências quebradas
4. VALIDAR — reporte no formato ERRO / CAUSA / CORREÇÃO / VALIDAÇÃO e atualize STATE.md
