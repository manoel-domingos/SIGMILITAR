# PROMPT PARTE 2 — Módulo Gestão Pedagógica (MEG Educação)
## Formulários digitais, avaliação de resultados e pontuação Oscar da Educação

> Leia o `PROTOCOLO_DEV.md` antes de qualquer implementação.
> Apresente plano estruturado (Robustez · Segurança · UX · Mobile) antes de qualquer código.
> Este prompt é a continuação direta da Parte 1 — assume que as rotas, tabelas e seed já foram criados.

---

## Contexto acumulado

O MEG Educação possui **duas dimensões de avaliação por eixo**:

| Dimensão | Pontuação máxima | O que avalia |
|---|---|---|
| **Processos** | 75 pts (eixos 1–4) / 100 pts (eixo 5) | Execução dos documentos/evidências por fase |
| **Resultados** | 110 pts (eixos 1–4) / 160 pts (eixo 5) | Checklist de avaliação in loco (escala 0–4) |
| **Total geral** | **1000 pts** | "Oscar da Educação" |

Pontuação por eixo:
| Eixo | Processos | Resultados | Total |
|---|---|---|---|
| 1 — Patrimônio | 75 | 110 | 185 |
| 2 — Alimentação | 75 | 110 | 185 |
| 3 — Limpeza | 75 | 110 | 185 |
| 4 — Manutenção | 75 | 110 | 185 |
| 5 — Gestão Escolar | 100 | 160 | 260 |
| **Total** | **400** | **600** | **1000** |

Critérios de pontuação da escala 0–4:
| Resposta | Índice | Classificação |
|---|---|---|
| 0 | 0% | Não Conforme |
| 1 | 15% | Pouco Conforme |
| 2 | 50% | Parcialmente Conforme |
| 3 | 80% | Satisfatoriamente Conforme |
| 4 | 100% | Totalmente Conforme |
| NA | 100% | Não se aplica |

---

## PARTE 2A — Formulários digitais por eixo/fase

Cada evidência da Parte 1 agora ganha um **formulário digital interativo** dentro do painel.
Ao clicar em uma evidência na página da fase, em vez de só marcar o checklist, o usuário pode
**preencher o formulário diretamente no sistema**.

---

### Banco de dados adicional

```sql
-- Respostas dos formulários digitais
CREATE TABLE IF NOT EXISTS meg_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidencia_id UUID REFERENCES meg_evidencias(id),
  school_id TEXT NOT NULL,
  tipo_formulario TEXT NOT NULL,       -- slug do tipo: 'cronograma_patrimonial', 'ficha_imovel', etc.
  dados JSONB NOT NULL DEFAULT '{}',   -- campos do formulário em JSON
  status TEXT DEFAULT 'rascunho',      -- 'rascunho' | 'enviado' | 'aprovado'
  criado_por TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_por TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evidencia_id, school_id)
);

-- RLS obrigatória
ALTER TABLE meg_formularios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_isolation" ON meg_formularios
  USING (school_id = current_setting('app.school_id'));
```

---

### Formulários por eixo (baseados nos documentos reais)

---

#### EIXO 1 — Patrimônio Mobiliário e Imobiliário

**Formulário 1.1 — Cronograma Patrimonial**
```ts
tipo: 'cronograma_patrimonial'
campos: {
  unidade_escolar: string,
  subcomissao: string,
  acoes: Array<{
    data: string,
    acao: string,   // enum das ações do cronograma oficial
    situacao: 'pendente' | 'concluido' | 'em_andamento'
  }>
}
// Ações fixas do cronograma (pré-populadas):
// 1. Ata de Abertura de Inventário Anual
// 2. Formação/substituição da Subcomissão local
// 3. Verificação das Notas Fiscais para tombamento
// 4. Levantamento físico dos bens móveis e Ficha cadastral imóveis
// 5. Período de ajuste patrimonial
// 6. Elaboração de relatório final e ata de encerramento
```

**Formulário 1.2 — DFD e PCR (Documento de Formalização de Demanda)**
```ts
tipo: 'dfd_pcr'
campos: {
  orgao: 'SECRETARIA DE ESTADO DE EDUCAÇÃO - SEDUC',  // fixo
  unidade_orcamentaria: '14101',                        // fixo
  setor_requisitante: string,
  responsavel_demanda: string,
  matricula: string,
  email: string,
  telefone: string,
  tipo_recurso: 'RU' | 'FNDE' | 'ambos',
  objeto: string,
  descricao_demanda: string,
  justificativa: string,
  valor_estimado: number,
  enviado_dre: boolean,
  data_envio_dre: string
}
```

**Formulário 1.3 — Ficha de Levantamento Cadastral Imobiliário**
```ts
tipo: 'ficha_cadastral_imovel'
campos: {
  identificacao_imovel_rip: string,
  matricula: string,
  municipio: string,
  endereco: string,
  numero: string,
  cep: string,
  bairro: string,
  complemento: string,
  latitude: string,
  longitude: string,
  ponto_referencia: string,
  ocupacao: 'Ocupado' | 'Desocupado',
  tipo_uso: 'Individual' | 'Coletivo/Compartilhado',
  orgao_entidade: string,
  destinacao: string,
  responsavel: string,
  telefone: string,
  email: string,
  possui_termo_outorga: boolean,
  tipo_outorga: 'Cessão' | 'Locação' | 'Permissão' | 'Concessão' | 'Autorização' | 'Outros',
  area_terreno_m2: number,
  area_construida_m2: number,
  num_pisos: number,
  tipo_imovel: 'Urbano' | 'Rural',
  categoria: 'Prédio' | 'Sala' | 'Casa' | 'Fazenda' | 'Galpão' | 'Terreno' | 'Sítio',
  estado_conservacao: 'Ótimo' | 'Bom' | 'Ruim' | 'Péssimo',
  caracteristicas_topograficas: 'Plana' | 'Declive' | 'Aclive' | 'Outros',
  pesquisa_cartoraria: boolean,
  num_matricula: string
}
```

**Formulário 1.4 — Checklist TTI (Termo de Transferência Interna)**
```ts
tipo: 'checklist_tti'
campos: {
  assinaturas_presentes: boolean,           // patrimônio + cedente + recebedor
  pasta_fisica_identificada: boolean,
  digitalizacao_pdf: boolean,
  observacoes: string
}
```

---

#### EIXO 2 — Alimentação Escolar

**Formulário 2.1 — Lançamento de Nota Fiscal no GPO**
```ts
tipo: 'lancamento_nota_fiscal'
campos: {
  total_notas_pagas: number,
  saldo_atual: number,
  notas_lancadas: Array<{
    numero_nf: string,
    fornecedor: string,
    valor: number,
    data_lancamento: string,
    tipo: 'agricultura_familiar' | 'fornecedor_licitado'
  }>
}
```

**Formulário 2.2 — Relatório de Ações de Educação Alimentar (EAN)**
```ts
tipo: 'relatorio_ean'
campos: {
  dre: string,
  municipio: string,
  codigo_escola: string,
  responsavel: string,
  introducao: string,
  contexto_justificativa: string,
  ponto_de_partida: string,
  objetivos: string[],
  acoes: Array<{
    titulo: string,
    periodo: string,
    publico_alvo: string,
    objetivos_especificos: string,
    metodologia: string,
    materiais: string,
    parceiros: string,
    resultados: string
  }>,
  fotos_urls: string[]   // upload de fotos
}
```

**Formulário 2.3 — Pesquisa de Satisfação Alimentação**
```ts
tipo: 'pesquisa_satisfacao_alimentacao'
campos: {
  respostas: Array<{
    pergunta: string,
    resposta: 'Muito Ruim' | 'Ruim' | 'Regular' | 'Bom' | 'Excelente'
  }>
}
// Perguntas fixas:
// 1. Como você avalia o SABOR da alimentação escolar?
// 2. Como você avalia a VARIEDADE dos alimentos?
// 3. Como você avalia a QUANTIDADE servida?
// 4. Como você avalia a HIGIENE no preparo?
// 5. Como você avalia a TEMPERATURA dos alimentos?
```

---

#### EIXO 3 — Limpeza e Organização

**Formulário 3.1 — Planejamento e Controle de Recursos de Limpeza**
```ts
tipo: 'controle_recursos_limpeza'
campos: {
  materiais_consumo: Array<{
    material: string,    // pré-populado: Detergente, Desinfetante, Álcool 70%, etc.
    quantidade_atual: number,
    unidade: string,
    consumo_mensal_medio: number,
    ponto_reposicao: number
  }>,
  equipamentos: Array<{
    equipamento: string,  // pré-populado: Mop, Baldes, Vassouras, etc.
    quantidade_em_uso: number,
    situacao: 'Bom' | 'Ruim',
    necessita_reposicao: boolean
  }>
}
```

**Formulário 3.2 — Cronograma de Verificação de Limpeza**
```ts
tipo: 'cronograma_verificacao_limpeza'
campos: {
  ambiente: string,
  mes: string,
  registros: Array<{
    frequencia: 'DIÁRIA' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL',
    data: string,
    turno: 'D' | 'M' | 'A',   // Diurno, Matutino, Alternativo
    assinatura: string
  }>
}
```

**Formulário 3.3 — Registro de Ocorrências de Limpeza**
```ts
tipo: 'registro_ocorrencia_limpeza'
campos: {
  servidor: string,
  turno: 'Matutino' | 'Vespertino' | 'Noturno',
  data_ocorrencia: string,
  horario: string,
  ambiente: string,
  descricao_problema: string,
  gravidade: 'Baixa' | 'Média' | 'Alta',
  providencia_tomada: string,
  foto_url: string
}
```

**Formulário 3.4 — Pesquisa de Percepção de Limpeza**
```ts
tipo: 'pesquisa_percepcao_limpeza'
campos: {
  publico: 'Aluno(a)' | 'Professor(a)' | 'Funcionário(a)',
  respostas: Array<{
    pergunta: string,
    resposta: 'Sempre' | 'Na maioria das vezes' | 'Raramente' | 'Nunca'
  }>
}
// Perguntas fixas:
// 1. Os ambientes estão, em geral, limpos?
// 2. Os banheiros estão em condições adequadas de uso?
// 3. O pátio e áreas externas estão limpos e organizados?
// 4. A cozinha e refeitório estão higienizados?
// 5. Há materiais de limpeza disponíveis (sabonete, papel)?
```

---

#### EIXO 4 — Manutenção e Conservação

**Formulário 4.1 — Cronograma de Inspeções**
```ts
tipo: 'cronograma_inspecoes'
campos: {
  nome_escola: string,
  codigo_escola: string,
  municipio: string,
  dre: string,
  diretor: string,
  coordenadores: string,
  secretario: string,
  itens: Array<{
    numero: number,
    item: string,             // pré-populado com os 15+ itens do Manual
    periodicidade: string,    // texto oficial do Manual
    meses_programados: string[]  // 'JAN' | 'FEV' | ... | 'DEZ'
    opcional: boolean
    escola_nao_possui: boolean
  }>
}
// Itens pré-populados (do Manual de Manutenção 2025):
// 1. Sistema Construtivo — 1x ao ano
// 2. Cobertura — 2x ao ano (pré-chuvas)
// 3. Forro — 2x ao ano (férias) [OPCIONAL]
// 4. Pisos e Revestimentos — 1x ao ano (férias)
// 5. Pintura — internas 3 anos / externas 2 anos
// 6. Esquadrias — 2 ou 3 anos
// 7. Instalações Elétricas Baixa Tensão — 1x ao ano + limpeza 3x
// 8. SPDA — conforme Manual
// 9. Posto de Transformação [OPCIONAL]
// 10. Caixa d'água e Cisterna
// 11. Ralos e Sifões
// 12. Válvulas e Registros
// 13. Tubulações
// 14. Sistema de Tratamento de Esgoto
// 15. Caixa de Gordura
// 16. Instalações de Gás [OPCIONAL]
// 17. Extintores
// 18. Hidrantes e Mangueiras [OPCIONAL]
// 19. Sinalização de Emergência [OPCIONAL]
// 20. Pórtico [OPCIONAL]
// 21. Muro e Gradil
// 22. Calçamentos
// 23. Quadra Poliesportiva [OPCIONAL]
```

**Formulário 4.2 — Checklist de Intervenções**
```ts
tipo: 'checklist_intervencoes'
campos: {
  nome_escola: string,
  codigo_escola: string,
  municipio: string,
  dre: string,
  diretor: string,
  intervencoes: Array<{
    item: string,
    data_execucao: string,
    tipo_manutencao: string,
    valor_investido: number,
    executado_por: 'equipe_escolar' | 'terceirizado',
    fornecedor: string
  }>
}
```

**Formulário 4.3 — Justificativa de Pendências**
```ts
tipo: 'justificativa_pendencias'
campos: {
  pendencias: Array<{
    item: string,
    motivo: 'sem_recurso' | 'aguardando_dre' | 'em_licitacao' | 'outros',
    descricao_motivo: string,
    previsao_resolucao: string
  }>
}
```

---

#### EIXO 5 — Gestão Escolar e Pedagógica

**Formulário 5.1 — Indicadores de Busca Ativa**
```ts
tipo: 'indicadores_busca_ativa'
campos: {
  indice_abandono: number,          // %
  indice_evasao: number,            // %
  total_alunos_matriculados: number,
  acoes_inicio_ano: string,
  acoes_enfrentamento_abandono: string,
  acoes_escola_protege: string,
  acoes_cartilha_escolar_iii: string
}
```

**Formulário 5.2 — Gestão Financeira (PDDE e Recursos)**
```ts
tipo: 'gestao_financeira'
campos: {
  alimentacao: { executado: number, saldo: number },
  recurso_unico: { executado: number, saldo: number },
  pdde_estrutura: {
    agua: boolean, esgoto: boolean, sanitario: boolean,
    escola_campo: boolean, sala_recursos_multifuncionais: boolean,
    escola_acessivel: boolean
  },
  pdde_qualidade: {
    inovacao_educacao_conectada: boolean,
    novo_ensino_medio: boolean,
    escola_familia: boolean,
    escola_adolescencias: boolean,
    escola_tempo_integral: boolean,
    itinerario_formativo: boolean
  },
  pdde_basico: { executado: number, saldo: number }
}
```

---

## PARTE 2B — Avaliação de Resultados por eixo (escala 0–4)

Esta é a **Dimensão Resultados** do MEG — avaliação in loco com pontuação 0 a 4.

### Tabela adicional no banco

```sql
CREATE TABLE IF NOT EXISTS meg_avaliacao_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eixo_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  avaliador TEXT NOT NULL,
  data_avaliacao DATE NOT NULL,
  respostas JSONB NOT NULL DEFAULT '{}',
  -- respostas: { "1.1": 4, "1.2": 3, "1.3": "NA", ... }
  pontuacao_obtida NUMERIC(6,2),
  pontuacao_maxima NUMERIC(6,2),
  percentual NUMERIC(5,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(eixo_id, school_id, data_avaliacao)
);

ALTER TABLE meg_avaliacao_resultados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_isolation" ON meg_avaliacao_resultados
  USING (school_id = current_setting('app.school_id'));
```

---

### Checklists de avaliação por eixo (itens reais dos documentos)

**EIXO 1 — Avaliação de Resultado Patrimônio** (pontuação máx: 110)

Categorias de critério (cada item avaliado de 0 a 4):
- **Conservação dos Bens Móveis**: estado físico do mobiliário por ambiente
- **Emplaquetamento e Registro Patrimonial**: % de bens com plaqueta legível
- **Conformidade**: itens presentes conforme lista
- **Alocação Correta**: bens no ambiente designado

Itens avaliados (por ambiente):
Sala de Aula, Secretaria, Diretoria, Laboratório, Biblioteca, Refeitório, Cozinha, Banheiros,
Quadra, Depósito, Sala de Professores (preencher dinamicamente por ambiente real da escola)

---

**EIXO 2 — Avaliação de Resultado Alimentação** (pontuação máx: 110)

Itens fixos:
```
1. Merendeiras
  1.1 Utilizar uniformes completos, limpos e em bom estado
  1.2 Disponibilizar e utilizar corretamente luvas, toucas, aventais, calçados fechados

2. Alimentos e Cardápios
  2.1 Seguir o cardápio da alimentação escolar
  2.2 Gêneros alimentícios são de marcas adjudicadas
  2.3 Dispor corretamente os alimentos na prateleira

3. Equipamentos e Utensílios
  3.1 Equipamentos e mobiliários da cozinha funcionando normalmente
  3.2 Existência de móveis de madeira na cozinha (verificar conformidade ANVISA)
  3.3 Utilização de utensílios de madeira (verificar conformidade ANVISA)
  3.4 Existência de lixeira com tampa e pedal
  3.5 Existência de despensa separada da cozinha
  3.6 Limpeza dos freezers e geladeiras
  3.7 Tela milimétrica nas portas e janelas
```

---

**EIXO 3 — Avaliação de Resultado Limpeza** (pontuação máx: 110)

Avaliação visual por equipamento/mobiliário em cada ambiente.

Itens avaliados — Ambientes Gerais (Parte 1):
Aparelhos de TV, Armários, Balcões, Batentes, Bebedouros, Cadeiras, Carteiras, Cestos de lixo,
Cortinas, Corrimãos, Divisórias, Dispensadores de papel toalha, Dispensadores de papel higiênico,
Escadas, Extintores de incêndio, Espelhos, Interruptores

Itens avaliados — Ambientes Gerais (Parte 2):
Mesas, Murais, Móveis em geral, Prateleiras, Paredes, Pias, Torneiras, Placas indicativas,
Tomadas, Pisos, Peitoril das janelas, Portas, Persianas, Quadros, Ralos, Rodapés

Escala: `Ótimo | Bom | Regular | Ruim | Não se aplica`

---

**EIXO 4 — Avaliação de Resultado Manutenção** (pontuação máx: 110)

Itens fixos (do Manual de Manutenção 2025):
```
1. Geral
  1.1 Sistema Construtivo (Identificação de Patologias)
  1.2 Cobertura
  1.3 Forro [OPCIONAL]
  1.4 Pisos e Revestimentos
  1.5 Pintura
  1.6 Esquadrias
  1.7 Áreas Molhadas (Louças, Metais, Bancadas e Divisórias)
  1.8 Piscina e Casa de Máquinas [OPCIONAL]

2. Instalações Elétricas
  2.1 Baixa Tensão

3. Instalações Hidrossanitárias
  3.1 Caixa d'água e Cisterna
  3.2 Ralos e Sifões
  3.3 Válvulas e Registros
  3.4 Sistema de Tratamento de Esgoto
  3.5 Caixa de Gordura
  3.6 Instalações de Gás [OPCIONAL]

4. Instalações de Combate a Incêndio
  4.1 Extintores
  4.2 Hidrantes e Mangueiras [OPCIONAL]
  4.3 Sinalização de Emergência e Rotas de Fuga [OPCIONAL]
  4.4 Acionamentos [OPCIONAL]

5. Implantação
  5.1 Pórtico [OPCIONAL]
  5.2 Muro e Gradil
  5.3 Depósito de Resíduos Sólidos [OPCIONAL]
  5.4 Calçamentos
  5.5 Paisagismo [OPCIONAL]

6. Acessibilidade
  6.1 Escada e Rampa [OPCIONAL]
  6.2 Corrimão, Guarda-Corpo e Barra de Apoio [OPCIONAL]
  6.3 Placa de Sinalização, Mapa e Piso Tátil [OPCIONAL]

7. Quadra Poliesportiva
  7.1 Pintura e demarcação [OPCIONAL]
```

Itens marcados como `[OPCIONAL]` devem ter checkbox "Escola não possui este item" → resposta `NA` automática.

---

**EIXO 5 — Avaliação de Resultado Gestão Escolar** (pontuação máx: 160)

```
1. Busca Ativa
  1.1 Índice de Abandono      → escala 0–4
  1.2 Índice de Evasão        → escala 0–4

2. Gestão Financeira
  2.1 Alimentação             → 0 (não executado) | 4 (executado)
  2.2 Recurso Único           → 0 | 4
  2.3 PDDE Estrutura
      2.3.1 Água
      2.3.2 Esgoto
      2.3.3 Sanitário
      2.3.4 Escola do Campo
      2.3.5 Sala de Recursos Multifuncionais
      2.3.6 Escola Acessível
  2.4 PDDE Qualidade
      2.4.1 Inovação e Educação Conectada
      2.4.2 Novo Ensino Médio
      2.4.3 Escola da Família
      2.4.4 Escola das Adolescências
      2.4.5 Escola em Tempo Integral
      2.4.6 Itinerário Formativo
  2.5 PDDE Básico

3. Pedagógico
  3.1 Avalia MT               → escala 0–4
  3.2 Participação no Avalia MT → escala 0–4
```

---

## PARTE 2C — Painel "Oscar da Educação" (pontuação total)

### Rota
```
app/[escola]/pedagogico/oscar
```

### O que exibir

**Card de pontuação geral:**
- Pontuação total: `X / 1000 pts`
- Classificação: Não Conforme / Pouco Conforme / Parcialmente / Satisfatório / Excelente
- Barra de progresso circular animada (ring chart)

**Breakdown por eixo** (tabela + mini barras):
| Eixo | Processos (pts) | Resultados (pts) | Total | % |
|---|---|---|---|---|
| Patrimônio | X/75 | X/110 | X/185 | X% |
| Alimentação | X/75 | X/110 | X/185 | X% |
| Limpeza | X/75 | X/110 | X/185 | X% |
| Manutenção | X/75 | X/110 | X/185 | X% |
| Gestão Escolar | X/100 | X/160 | X/260 | X% |
| **Total** | **X/400** | **X/600** | **X/1000** | **X%** |

**Cálculo da pontuação de Processos:**
```ts
// Para cada fase de cada eixo:
// pontos_fase = (itens_concluidos / total_itens) * peso_fase
// peso_fase = pontuacao_maxima_processos_eixo / num_fases
// pontuacao_processos_eixo = soma(pontos_fase)
```

**Cálculo da pontuação de Resultados:**
```ts
// Para cada item do checklist de avaliação:
// item_score = (resposta === 'NA') ? peso_item : (resposta / 4) * peso_item
// pontuacao_resultados_eixo = soma(item_scores)
```

---

## PARTE 2D — Arquitetura de componentes

### Novos componentes a criar

```
components/meg/
  MegFormulario.tsx          → renderizador dinâmico de formulários por tipo
  MegChecklist.tsx           → checklist de avaliação 0–4 com itens opcionais
  MegProgressRing.tsx        → ring chart de pontuação (SVG animado)
  MegEixoCard.tsx            → card de eixo com progresso dual (processos + resultados)
  MegFaseAccordion.tsx       → fase expansível com lista de evidências
  MegEvidenciaItem.tsx       → item individual: checkbox + formulário + upload
  MegOscarPanel.tsx          → painel de pontuação geral Oscar da Educação
  MegItemOpcional.tsx        → item com toggle "escola não possui"
```

### Lógica do `MegFormulario.tsx`

```tsx
// Renderizador dinâmico — lê o tipo e monta o formulário correto
interface MegFormularioProps {
  tipo: string              // ex: 'cronograma_patrimonial'
  evidenciaId: string
  schoolId: string
  readOnly?: boolean        // true para PROFESSOR e MONITOR
  onSave?: (dados: any) => void
}

// Internamente usa um map de tipo → componente de formulário:
const FORMULARIO_MAP: Record<string, React.FC<FormProps>> = {
  'cronograma_patrimonial': CronogramaPatrimonialForm,
  'dfd_pcr': DfdPcrForm,
  'ficha_cadastral_imovel': FichaCadastralImovelForm,
  // ... todos os tipos
}
```

---

## Segurança — RLS e controle de acesso

### Políticas Supabase obrigatórias para todas as tabelas MEG

```sql
-- Isolamento por school_id em TODAS as tabelas meg_*
-- Usuário só acessa dados da sua escola

-- Leitura: qualquer usuário autenticado da escola
CREATE POLICY "select_own_school" ON meg_formularios
  FOR SELECT USING (school_id = current_setting('app.school_id'));

-- Inserção: somente GESTOR, COORD, admin_global
CREATE POLICY "insert_authorized" ON meg_formularios
  FOR INSERT WITH CHECK (
    school_id = current_setting('app.school_id')
    AND current_setting('app.user_role') IN ('GESTOR', 'COORD', 'admin_global')
  );

-- Atualização: somente GESTOR, COORD, admin_global
CREATE POLICY "update_authorized" ON meg_formularios
  FOR UPDATE USING (
    school_id = current_setting('app.school_id')
    AND current_setting('app.user_role') IN ('GESTOR', 'COORD', 'admin_global')
  );
```

### Controle no frontend

```tsx
// Em MegEvidenciaItem.tsx e MegFormulario.tsx:
const canEdit = ['GESTOR', 'COORD', 'admin_global'].includes(currentUserRole);

// Botões de salvar, marcar e editar: visíveis apenas se canEdit
// PROFESSOR e MONITOR: visualização em modo readOnly
// admin_global: pode editar qualquer escola (sem filtro de school_id no fetch)
```

---

## Robustez — edge cases críticos

- **Itens opcionais [OPCIONAL]:** campo `escola_nao_possui: boolean` — ao marcar, resposta vira `NA` automaticamente e não conta negativamente na pontuação
- **Formulário com dados parciais:** salvar como `status: 'rascunho'` — não bloquear submissão parcial
- **Recálculo de pontuação:** sempre recalcular no momento da leitura (`useMemo`) — nunca persistir pontuação calculada diretamente (evitar desync)
- **`UNIQUE(evidencia_id, school_id)` no banco:** usar `upsert` com `onConflict('evidencia_id, school_id')` no Supabase
- **Sincronização entre Parte 1 (checklist) e Parte 2 (formulário):** ao preencher e salvar um formulário, atualizar automaticamente o `meg_checklist.status` para `'em_andamento'` se estava `'pendente'`, e para `'concluido'` se todos os campos obrigatórios foram preenchidos

---

## UX — diretrizes específicas para este módulo

- **Formulários longos** (ex: Cronograma de Inspeções com 20+ itens): dividir em seções expansíveis com `MegFaseAccordion`, nunca em uma única página scrollável infinita
- **Itens opcionais:** toggle visual claro — ao marcar "Escola não possui", o item fica visualmente apagado (opacidade 40%) com badge "N/A"
- **Pontuação em tempo real:** ao preencher o checklist de avaliação, a pontuação do eixo atualiza instantaneamente via `useMemo` (sem precisar salvar)
- **Upload de evidências:** suportar imagens e PDF; mostrar preview de imagem ou ícone de PDF com nome do arquivo
- **Autopreenchimento:** campos `nome_escola`, `codigo_escola`, `municipio`, `dre`, `diretor` devem ser pré-preenchidos automaticamente com os dados do `activeSchoolContext` (já disponível no store)
- **Mobile:** formulários com muitas colunas (tabelas de itens) devem colapsar para layout de cards empilhados em telas < 768px

---

## Resumo do que implementar nesta Parte 2

| Componente | Arquivo | Prioridade |
|---|---|---|
| Formulários digitais por eixo | `components/meg/MegFormulario.tsx` + forms individuais | Alta |
| Checklist de avaliação 0–4 | `components/meg/MegChecklist.tsx` | Alta |
| RLS + políticas Supabase | `supabase/migrations/` | Alta |
| Painel Oscar da Educação | `app/[escola]/pedagogico/oscar/page.tsx` | Média |
| Ring chart de pontuação | `components/meg/MegProgressRing.tsx` | Média |
| Autopreenchimento de campos escola | Integrar com `useAppContext()` | Alta |
| Itens opcionais com toggle N/A | `components/meg/MegItemOpcional.tsx` | Alta |
| Recálculo de pontuação em tempo real | `useMemo` em `MegOscarPanel.tsx` | Alta |
