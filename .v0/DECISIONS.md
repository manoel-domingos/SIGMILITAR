# DECISIONS

> Log append-only de decisões importantes. Nunca editar entradas antigas — apenas adicionar abaixo.

## Formato

```
## NNNN — Título curto
- Data: AAAA-MM-DD
- Domínio: development | disciplina | ai | infra | ux
- Contexto: por que precisamos decidir agora
- Opções: alternativas consideradas
- Escolha: o que ficou
- Razão: por que essa
- Trade-offs: o que perdemos com a escolha
- Reversível?: sim | não | difícil
```

---

## 0001 — Adoção do Supabase como banco e auth

- Data: 2026-01-15
- Domínio: infra
- Contexto: precisávamos de banco + auth + storage rapidamente
- Opções: Supabase, Neon + Auth.js, Firebase
- Escolha: Supabase
- Razão: integra banco, auth e RLS num só serviço; SDK simples
- Trade-offs: vendor lock-in moderado
- Reversível?: difícil (RLS espalhado)

## 0002 — Migração para novo projeto Supabase

- Data: 2026-05-03
- Domínio: infra
- Contexto: necessidade de reorganizar dados num novo projeto limpo
- Opções: dump+restore via CLI; CSV manual via console; integração v0
- Escolha: CSV manual via Supabase Console
- Razão: usuário só usa v0 + Supabase, sem terminal local
- Trade-offs: trabalho manual por tabela
- Reversível?: sim (banco antigo continua disponível)

## 0003 — DeepSeek como provider de IA

- Data: 2026-05-03
- Domínio: ai
- Contexto: substituir Anthropic anterior por opção mais barata
- Opções: DeepSeek, Groq, OpenAI direto, Claude
- Escolha: DeepSeek (`deepseek-chat` principal, `deepseek-reasoner` fallback)
- Razão: custo significativamente menor mantendo qualidade aceitável
- Trade-offs: menos benchmarks públicos, latência variável
- Reversível?: sim (basta trocar baseURL e key)

## 0004 — Adoção do v0-OS (framework de trabalho)

- Data: 2026-05-03
- Domínio: development
- Contexto: sessões v0 sem memória entre conversas, decisões se perdem
- Opções:
  - A) Markdown + Custom Instructions
  - B) Markdown + Supabase + Dashboard `/admin/v0-os`
- Escolha: Caminho A com schema do Caminho B já desenhado
- Razão: zero infra adicional, portátil, versionado no git, evolutível
- Trade-offs: sem dashboard visual por enquanto
- Reversível?: sim (basta deletar `.v0/`)
