# ROADMAP

> Fases macro do projeto. Não é backlog detalhado — é mapa do território.

## Fase 0 — Fundação ✓

- [x] Schema inicial Supabase (students, rules, occurrences, accidents, praises)
- [x] Seed das 91 regras de disciplina
- [x] Auth Supabase básica
- [x] Migração para novo projeto Supabase

## Fase 1 — Operação Disciplinar (em andamento)

- [x] Cadastro de alunos
- [x] Registro de ocorrências
- [x] Termos de conduta
- [x] Intimações
- [x] Logs de auditoria
- [ ] Filtros avançados na lista de ocorrências
- [ ] Exportação XLSX de relatórios
- [ ] Dashboard de KPIs disciplinares

## Fase 2 — IA e Automação (parcial)

- [x] Integração DeepSeek
- [x] Log de tokens
- [ ] Templates de geração assistida (ocorrências, termos, intimações)
- [ ] Análise automática de padrões disciplinares
- [ ] Sugestão de regra mais provável dado um relato

## Fase 3 — Documentos e Anexos

- [ ] Integração Google Drive (em andamento — faltam env vars)
- [ ] Upload direto via Vercel Blob como fallback
- [ ] Anexar documentos a ocorrências e termos
- [ ] Visualizador inline (PDF, imagem)

## Fase 4 — Notificações e Comunicação

- [ ] E-mail aos responsáveis
- [ ] WhatsApp via API (stretch)
- [ ] Painel de notificações in-app

## Fase 5 — Pedagógico (futuro)

- [ ] Acidentes (existe estrutura, falta UI completa)
- [ ] Elogios (existe estrutura, falta UI completa)
- [ ] Plano de ação por aluno

---

## Marcos / Milestones

| ID | Nome | Critério | Status |
|----|------|---------|--------|
| M1 | Banco migrado | Schema + dados no novo Supabase | Concluído |
| M2 | IA operacional | DeepSeek respondendo com log de tokens | Concluído |
| M3 | Drive funcional | Upload e anexo via Google Drive | Aberto |
| M4 | Relatórios completos | Exportação XLSX + dashboard | Aberto |
