# MASTER.md — Sub-agente: Escolas

> Changelog automático. Atualizado pelo Ralph Loop e pelo Sub-agente após cada análise relevante.
> O Agente Orquestrador lê este arquivo para obter um resumo rápido do domínio sem precisar acionar o sub-agente completo.

---

## Resumo do Domínio

**Sub-agente:** Escolas
**Última atualização:** 2026-06-08 (Ralph Loop)
**Status geral:** ✓ Normal

---

## Changelog

### 2026-06-08 — Ciclo Ralph Loop (inicialização)
**Trigger:** ralph-loop --init
**Resumo:** Configurações de tenant e OAuth
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
| Escolas ativas | 3 (joaobatista, heliodoro, tangara) | 2026-06-08 |
| Arquivos em data/ | 0 | 2026-06-08 |
| Integrações OAuth | Verificar em school_settings | 2026-06-08 |

---

## Alertas Ativos

### ⚠️ Google OAuth — Client Secret
**Data:** 2026-06-09
**Erro:** `oauth2: "invalid_client" "The provided client secret is invalid."` → login Google falha, redireciona para landing com `error=server_error`.
**Fix:** Supabase Dashboard → Authentication → Providers → Google → atualizar **Client Secret** (gerar novo em Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client).
**Status:** Pendente correção manual

---

## Instruções para o Orquestrador

Para análise superficial: este arquivo contém o resumo mais recente do domínio **Escolas**.
Para análise profunda: acione o sub-agente lendo `agents/escolas/CLAUDE.md` e os arquivos em `agents/escolas/data/`.
