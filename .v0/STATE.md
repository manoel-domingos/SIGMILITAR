# STATE

> Estado vivo do projeto. **Atualizar SEMPRE ao final de cada sessão de trabalho.**

## Última atualização

**Data:** 2026-05-13  
**Sessão:** Número fixo de ATA (ata_number), Limpeza Duplicatas, Supabase Storage para Uploads  
**Operador:** Manoel Domingos

## Foco atual

Implementação de sistema robusto de armazenamento de arquivos no Supabase Storage com feedback visual ao usuário durante uploads.

## Última ação concluída

- **Número fixo de ATA:** Adicionada coluna `ata_number` (SERIAL auto-incremento) na tabela `occurrences`, garantindo ID sequencial fixo (1, 2, 3...) independente de filtros
- **Limpeza de duplicatas:** Removidas 22 ocorrências duplicadas geradas por duplo-envio do formulário (mantendo primeira ocorrência de cada grupo baseado em student_id, date, hour, rule_code)
- **Supabase Storage para uploads:** 
  - Bucket `student-files` criado com limite 50MB, policies RLS (leitura pública, escrita/delete públicos)
  - Função `uploadFile` reescrita para fazer upload real com debug logs detalhados
  - Campos de vídeo/documento na ocorrência com spinner "Enviando...", tratamento de erros e alert ao usuário
  - Upload de foto de aluno adicionado (coluna `photo_url` em students, modal de edição com campo circular)
  - Tabelas exibem foto do aluno quando disponível

## Próxima ação

- [ ] Verificar se uploads estão funcionando corretamente após mudanças nas políticas RLS
- [ ] Melhorar UX de preview dos arquivos após upload (gallery/thumbnail)
- [ ] Implementar deleção de arquivos do Storage quando ocorrência/aluno é deletado

## Bloqueios

Nenhum no momento.

## Drift Score

`0` (sessão alinhada)

---

## Como atualizar este arquivo

A cada virada de tarefa:
1. Mover "Próxima ação" → "Última ação concluída"
2. Definir nova "Próxima ação"
3. Atualizar data
4. Se algo decidido, anotar em `DECISIONS.md`
