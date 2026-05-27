# PROMPT-PADRAO.md — Como Iniciar Qualquer Sessão com IA

Cole este bloco no início de toda conversa com IA antes de pedir qualquer alteração.

---

## Prompt de abertura de sessão

```
Você está trabalhando no projeto **SIGMilitar** — sistema de gestão disciplinar
para Escolas Cívico-Militares (Next.js 14, TypeScript, Supabase, Vercel).

Antes de qualquer ação, leia obrigatoriamente os seguintes arquivos do projeto:

1. docs/AGENTS.md         → regras absolutas e checklist obrigatório
2. docs/ARQUITETURA.md    → rotas, tenant, autenticação, CSP
3. docs/REGRAS-NEGOCIO.md → cargos, permissões, pontos, ocorrências
4. docs/BANCO-DE-DADOS.md → tabelas, queries, migrations
5. docs/CHANGELOG.md      → histórico de mudanças críticas já feitas

Após ler, confirme com:
"Li todos os docs. Pronto para receber a tarefa."

Regras que nunca podem ser violadas:
- Nunca misture dados de escolas diferentes (filtro school_id obrigatório)
- Nunca crie um segundo createClient do Supabase (use o singleton de lib/supabase.ts)
- Nunca use .single() sem garantir que a linha existe (use .maybeSingle())
- Nunca faça router.push('/') fixo após login no sigmilitar.com.br (/ é landing page)
- Nunca adicione referência ao domínio kallyteros em código novo
- Nunca altere ataNumber de uma ocorrência (é imutável e juridicamente vinculante)

Para QUALQUER alteração que toque estes arquivos:
middleware.ts | lib/store.tsx | lib/useTenantConfig.ts | app/login/page.tsx | next.config.ts | DEFAULT_PERMISSIONS | migrations SQL

Você DEVE parar e apresentar este resumo antes de implementar:

🔍 ANÁLISE ANTES DE IMPLEMENTAR
- O que será alterado: [arquivo(s) e linhas]
- Por que: [motivo técnico]
- Impacto em outras escolas: [sim/não — qual]
- Risco de regressão: [baixo/médio/alto]
- Rollback possível: [sim/não — como]

Posso prosseguir?
```

---

## Como registrar uma mudança crítica no CHANGELOG

Após qualquer correção ou feature significativa, adicione uma entrada no `docs/CHANGELOG.md`:

```markdown
## [DATA] Título da mudança
**Arquivos:** lista de arquivos alterados
**Motivo:** por que foi feito
**Impacto:** o que mudou no comportamento
**Rollback:** como desfazer se necessário
```

---

## Dicas de uso com IA

- Sempre envie o `.zip` do projeto atualizado ou cole os arquivos relevantes
- Se o repositório for público: `npx -y degit manoel-domingos/eecmprofjoaobatista . --force`
- Descreva o bug com: o que acontece, o que deveria acontecer, e os logs do console (F12)
- Para bugs de redirecionamento, sempre informe a URL completa (incluindo path)
- Para bugs de banco, sempre inclua o erro exato (código HTTP + mensagem)
