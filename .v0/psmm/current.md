# PSMM — Persistent Session Memory Module

> Memória da sessão **atual**. O v0 atualiza este arquivo a cada virada de tarefa. Quando uma nova sessão começa, este arquivo é arquivado e zerado.

## Sessão atual

- **Início:** 2026-05-03
- **Operador:** Manoel Domingos
- **Tema:** Implantação do v0-OS (Caminho A com hooks para B)

## Resumo das ações desta sessão

1. Migração Supabase para `imprdimqcjbndqewioyt` (concluída)
2. Configuração DeepSeek + log de tokens
3. Criação da estrutura completa `.v0/`
4. Schema futuro do Caminho B documentado em `SCHEMA.md`

## Decisões emergentes nesta sessão

- D-0002: Migração Supabase via CSV manual
- D-0003: DeepSeek como provider de IA
- D-0004: Adoção do v0-OS

## Pendências para próxima sessão

- [ ] Colar `INSTRUCTIONS.md` em v0 Settings → Rules
- [ ] Concluir Google Drive (env vars)
- [ ] Validar fluxos no novo banco

## Drift events

Nenhum.

---

## Como o v0 deve manejar este arquivo

- Append linhas ao "Resumo" conforme avança
- Ao encerrar sessão (operador diz "encerra" ou silêncio prolongado), copiar este arquivo para `psmm/<data>-<tema>.md` e regenerar `current.md` zerado
- Nunca apagar histórico — apenas arquivar
