# RULE: debug

> Protocolo obrigatório ao receber qualquer arquivo de log ou erro (build, runtime, TypeScript, Vercel, console).

---

## Sequência de 4 Etapas

### 1. ENTENDER O ERRO
- Ler o log/stack trace completo antes de qualquer ação
- Identificar: tipo do erro, arquivo, linha, função afetada
- Checar se o erro é primário (raiz) ou secundário (cascata de outro)
- Se múltiplos erros, ordenar do mais profundo para o mais superficial

### 2. RESOLVER
- Aplicar a correção mínima necessária — não refatorar código não relacionado
- Se a causa exige mudança em mais de 1 arquivo, listar todos antes de editar
- Registrar qualquer desvio do comportamento esperado com "DESVIO:" no plano ativo
- Nunca remover imports antes de remover o uso; nunca adivinhar nomes de função

### 3. CHECK DE SOLUÇÃO
- Rodar `npx tsc --noEmit` para verificar erros TypeScript
- Buscar no código por referências ao símbolo corrigido para garantir que não há outras ocorrências quebradas
- Confirmar que o arquivo editado compila sem erros isoladamente

### 4. VALIDAÇÃO FINAL
- Confirmar: "zero erros de TypeScript" ou listar erros remanescentes se existirem
- Verificar que nenhuma outra página/componente foi quebrado indiretamente
- Atualizar `STATE.md` com a ação concluída
- Reportar resultado em formato:
  ```
  ERRO: <descrição curta>
  CAUSA: <motivo raiz>
  CORREÇÃO: <o que foi feito>
  VALIDAÇÃO: <resultado do tsc ou teste>
  ```

---

## Regras adicionais

- Nunca marcar como resolvido sem completar as 4 etapas
- Se o erro não for reproduzível, registrar em `DECISIONS.md` com contexto
- Logs de `console.log("[v0] ...")` adicionados para debug devem ser removidos após resolução
