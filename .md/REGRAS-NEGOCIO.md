# REGRAS-NEGOCIO.md — Regras do Domínio SIGMilitar

> Leia antes de tocar em: ocorrências, pontos, permissões, cargos, filtros de dados.

---

## 1. Modelo de escola e tenant

- Cada escola é um tenant isolado no Supabase via coluna `school_id`
- Um usuário pertence a **uma escola** (campo `school_id` em `user_profiles`)
- Exceção: `admin_global` tem `school_id = 'DRE'` e pode ver todas as escolas
- O filtro `school_id` **nunca pode ser omitido** em queries, exceto para `admin_global` ou `DRE`

---

## 2. Cargos e hierarquia

| Cargo (`AppUserRole`) | Descrição | Pode ver outras escolas? |
|-----------------------|-----------|--------------------------|
| `admin_global` | Acesso total, todas as escolas | Sim — via modal DRE |
| `GESTOR` | Gestor da escola (diretor, G1, G2) | Não |
| `COORD` | Coordenador pedagógico | Não |
| `MONITOR` | Monitor de pátio/disciplina | Não |
| `PROFESSOR` | Professor vinculado | Não — só vê suas próprias ocorrências |

**Regra crítica para PROFESSOR:**
Um professor só visualiza ocorrências onde ele aparece em **um dos três campos**:
- `registeredBy` (quem registrou)
- `locatedBy` (quem localizou)
- `linkedProfessor` (professor vinculado explicitamente)

Nunca mostre ocorrências de outro professor para um PROFESSOR logado.

---

## 3. Sistema de pontos de alunos

- Pontuação inicial: **10,0 pontos**
- Cada infração deduz pontos conforme a gravidade da `DisciplineRule`
- Elogios (`Praise`) **não somam pontos** — são registros qualitativos
- `ataNumber` é sequencial e **imutável** após criação — representa o número da ata oficial

| Faixa de pontos | Classificação (`BehaviorClass`) |
|----------------|-------------------------------|
| 9,0 – 10,0 | Excepcional |
| 7,5 – 8,9 | Ótimo |
| 6,0 – 7,4 | Bom |
| 4,0 – 5,9 | Regular |
| 2,0 – 3,9 | Insuficiente |
| 0,0 – 1,9 | Incompatível |

---

## 4. Matriz de permissões

As permissões são carregadas do Supabase (tabela `settings`) e têm fallback em `DEFAULT_PERMISSIONS` (`lib/store.tsx`).

**Módulos do sistema e permissões padrão por cargo:**

| Módulo | admin_global | GESTOR | COORD | MONITOR | PROFESSOR |
|--------|:-----------:|:------:|:-----:|:-------:|:---------:|
| dashboard | ✓ | ✓ | ✓ | ✓ | ✗ |
| alunos_lista | ✓ | ✓ | ✓ | ✓ | ✓ |
| alunos_ficha | ✓ | ✓ | ✓ | ✗ | ✗ |
| alunos_xerife | ✓ | ✓ | ✓ | ✓ | ✗ |
| alunos_arquivados | ✓ | ✓ | ✗ | ✗ | ✗ |
| disciplina_registro | ✓ | ✓ | ✓ | ✓ | ✓ |
| disciplina_faltas | ✓ | ✓ | ✓ | ✗ | ✗ |
| disciplina_termo | ✓ | ✓ | ✓ | ✗ | ✗ |
| disciplina_convocacao | ✓ | ✓ | ✓ | ✗ | ✗ |
| disciplina_documentos | ✓ | ✓ | ✓ | ✗ | ✗ |
| comportamento_rankings | ✓ | ✓ | ✓ | ✓ | ✗ |
| comportamento_elogios | ✓ | ✓ | ✓ | ✗ | ✗ |
| comportamento_acidentes | ✓ | ✓ | ✓ | ✓ | ✗ |
| relatorios | ✓ | ✓ | ✓ | ✗ | ✓ |
| sistema_implantacao | ✓ | ✓ | ✗ | ✗ | ✗ |
| sistema_fechamento | ✓ | ✓ | ✗ | ✗ | ✗ |
| sistema_auditoria | ✓ | ✓ | ✗ | ✗ | ✗ |

> Qualquer alteração nesta tabela deve ser registrada no `CHANGELOG.md`.

---

## 5. Gravidade das infrações

| Severidade | Dedução de pontos | Exemplo de medida |
|-----------|-------------------|-------------------|
| Leve | -0,1 | Advertência Oral |
| Média | -0,3 | Advertência Escrita |
| Grave | -0,5 | Suspensão / Convocação dos pais |

---

## 6. Tipos de elogio (`PraiseType`)

- `Individual` — elogio nominal ao aluno
- `Coletivo` — elogio à turma
- `Art. 50` — elogio baseado em artigo do regimento
- `Art. 51` — elogio baseado em artigo do regimento

---

## 7. Medidas disciplinares disponíveis

Definidas em `AVAILABLE_MEASURES` em `lib/data.ts`. Nunca adicione medidas ad-hoc fora desta lista sem atualizar o arquivo e este documento.

- Advertência Oral
- Advertência Escrita
- Acionar os pais
- Medida pedagógica
- Suspensão de Recreação
- Suspensão Escolar
- Ação Educativa
- Transferência Educativa

---

## 8. Whitelist de acesso

Todo usuário que loga no sistema deve ter um registro em `user_profiles` no Supabase.
Usuários sem perfil são redirecionados para `/login?error=whitelist`.
O `admin_global` tem acesso independente da whitelist (verificado via e-mail hardcoded e role).
