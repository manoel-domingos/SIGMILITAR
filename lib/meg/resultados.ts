// lib/meg/resultados.ts
// Itens de Resultado Estrutural (vistoria in loco) por eixo — FRAMEWORK PURO
// Fonte: Formulário MEG SEDUC-MT 2025 — escalas de conformidade

export type MegConformidade = 'satisfatorio' | 'parcial' | 'nao_conforme' | 'na';

export interface MegResultadoItem {
  id: string;
  eixoId: string;
  ambiente: string;  // agrupamento por ambiente
  item: string;      // descrição do item avaliado
  pesoMax: number;   // pontuação máxima do item
  opcional?: boolean;
}

// Ratios de conformidade → % do pesoMax
export const CONFORMIDADE_RATIOS: Record<MegConformidade, number> = {
  satisfatorio: 1.0,
  parcial: 0.5,
  nao_conforme: 0.0,
  na: 0,            // NA exclui do denominador (não reduz nota)
};

export const CONFORMIDADE_LABELS: Record<MegConformidade, string> = {
  satisfatorio: 'Satisfatoriamente Conforme',
  parcial: 'Parcialmente Conforme',
  nao_conforme: 'Não Conforme',
  na: 'Não se Aplica',
};

export const CONFORMIDADE_COLORS: Record<MegConformidade, string> = {
  satisfatorio: 'bg-emerald-500 text-white',
  parcial: 'bg-amber-500 text-white',
  nao_conforme: 'bg-rose-500 text-white',
  na: 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

// Peso unitário por eixo calculado com base no total de itens
// E1: 110pts / ~21 itens; E2: 110pts / ~12 itens; E3: 110pts / ~70 itens; E4: 110pts / ~28 itens; E5: 160pts / ~15 itens

export const MEG_RESULTADO_ITENS: MegResultadoItem[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 1 — Patrimônio Mobiliário e Imobiliário (total resultado: 110)
  // ═══════════════════════════════════════════════════════════════════════
  // ~21 itens × 5.24 cada ≈ 110

  // Sala de Aula
  { id: 'e1_r1_1', eixoId: 'patrimonio', ambiente: 'Sala de Aula',
    item: 'Mobiliário (carteiras/cadeiras/mesa do professor) em bom estado de conservação', pesoMax: 5.24 },
  { id: 'e1_r1_2', eixoId: 'patrimonio', ambiente: 'Sala de Aula',
    item: 'Plaquetamento patrimonial legível nos bens móveis da sala', pesoMax: 5.24 },
  { id: 'e1_r1_3', eixoId: 'patrimonio', ambiente: 'Sala de Aula',
    item: 'Quadro branco/negro em perfeitas condições de uso', pesoMax: 5.24 },

  // Secretaria / Diretoria
  { id: 'e1_r2_1', eixoId: 'patrimonio', ambiente: 'Secretaria e Diretoria',
    item: 'Equipamentos de informática (computadores/impressoras) funcionais e com plaqueta patrimonial', pesoMax: 5.24 },
  { id: 'e1_r2_2', eixoId: 'patrimonio', ambiente: 'Secretaria e Diretoria',
    item: 'Mobiliário (armários/arquivos/mesas) em bom estado e identificados', pesoMax: 5.24 },
  { id: 'e1_r2_3', eixoId: 'patrimonio', ambiente: 'Secretaria e Diretoria',
    item: 'Arquivos com documentação escolar organizados e identificados', pesoMax: 5.24 },

  // Laboratório / Biblioteca
  { id: 'e1_r3_1', eixoId: 'patrimonio', ambiente: 'Laboratório e Biblioteca',
    item: 'Equipamentos de laboratório catalogados e em condições de uso', pesoMax: 5.24 },
  { id: 'e1_r3_2', eixoId: 'patrimonio', ambiente: 'Laboratório e Biblioteca',
    item: 'Acervo bibliográfico catalogado e com controle de empréstimo', pesoMax: 5.24 },

  // Refeitório / Cozinha
  { id: 'e1_r4_1', eixoId: 'patrimonio', ambiente: 'Refeitório e Cozinha',
    item: 'Mesas e bancos do refeitório em bom estado e com plaqueta', pesoMax: 5.24 },
  { id: 'e1_r4_2', eixoId: 'patrimonio', ambiente: 'Refeitório e Cozinha',
    item: 'Equipamentos da cozinha (fogão/freezer/geladeira) com plaqueta e funcionais', pesoMax: 5.24 },

  // Banheiros
  { id: 'e1_r5_1', eixoId: 'patrimonio', ambiente: 'Banheiros',
    item: 'Louças, metais e acessórios dos banheiros em perfeitas condições', pesoMax: 5.24 },
  { id: 'e1_r5_2', eixoId: 'patrimonio', ambiente: 'Banheiros',
    item: 'Espelhos e divisórias dos sanitários íntegros e fixados', pesoMax: 5.24 },

  // Quadra / Área Externa
  { id: 'e1_r6_1', eixoId: 'patrimonio', ambiente: 'Quadra e Área Externa',
    item: 'Equipamentos esportivos (traves/cestas/redes) com plaqueta e funcionais', pesoMax: 5.24, opcional: true },
  { id: 'e1_r6_2', eixoId: 'patrimonio', ambiente: 'Quadra e Área Externa',
    item: 'Bancos/arquibancadas da quadra em bom estado de conservação', pesoMax: 5.24, opcional: true },

  // Sala dos Professores / Coordenação
  { id: 'e1_r7_1', eixoId: 'patrimonio', ambiente: 'Sala dos Professores e Coordenação',
    item: 'Mobiliário e equipamentos da sala dos professores em bom estado e identificados', pesoMax: 5.24 },
  { id: 'e1_r7_2', eixoId: 'patrimonio', ambiente: 'Sala dos Professores e Coordenação',
    item: 'Bens de alto valor (projetores/notebooks) fisicamente presentes e identificados', pesoMax: 5.24 },

  // Depósito / Almoxarifado
  { id: 'e1_r8_1', eixoId: 'patrimonio', ambiente: 'Depósito e Almoxarifado',
    item: 'Materiais e bens no depósito organizados e catalogados', pesoMax: 5.24 },
  { id: 'e1_r8_2', eixoId: 'patrimonio', ambiente: 'Depósito e Almoxarifado',
    item: 'Bens inservíveis separados e aguardando regularização/desfazimento', pesoMax: 5.24 },

  // Geral
  { id: 'e1_r9_1', eixoId: 'patrimonio', ambiente: 'Conformidade Geral',
    item: 'Alocação correta: bens móveis nos ambientes designados sem deslocamentos indevidos', pesoMax: 5.24 },
  { id: 'e1_r9_2', eixoId: 'patrimonio', ambiente: 'Conformidade Geral',
    item: 'Bens patrimoniais de alto valor fisicamente presentes e conferidos', pesoMax: 5.24 },
  { id: 'e1_r9_3', eixoId: 'patrimonio', ambiente: 'Conformidade Geral',
    item: 'Plaquetamento geral: percentual elevado de bens com placa legível e cadastrada', pesoMax: 5.24 },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 2 — Alimentação Escolar (total resultado: 110)
  // ═══════════════════════════════════════════════════════════════════════
  // ~12 itens; peso unitário ≈ 9.17 para itens obrigatórios, menor para opcionais

  // 1. Merendeiras / AAE
  { id: 'e2_r1_1', eixoId: 'alimentacao', ambiente: 'Merendeiras / AAE',
    item: '1.1 Utilizar uniformes completos, limpos e em bom estado de conservação', pesoMax: 9.17 },
  { id: 'e2_r1_2', eixoId: 'alimentacao', ambiente: 'Merendeiras / AAE',
    item: '1.2 Disponibilizar e utilizar corretamente luvas, toucas, aventais e calçados fechados', pesoMax: 9.17 },

  // 2. Alimentos e Cardápios
  { id: 'e2_r2_1', eixoId: 'alimentacao', ambiente: 'Alimentos e Cardápios',
    item: '2.1 Seguir rigorosamente o cardápio oficial de alimentação escolar', pesoMax: 9.17 },
  { id: 'e2_r2_2', eixoId: 'alimentacao', ambiente: 'Alimentos e Cardápios',
    item: '2.2 Gêneros alimentícios adquiridos pertencem às marcas homologadas/adjudicadas', pesoMax: 9.17 },
  { id: 'e2_r2_3', eixoId: 'alimentacao', ambiente: 'Alimentos e Cardápios',
    item: '2.3 Alimentos organizados na despensa de forma higiênica, separados do chão', pesoMax: 9.17 },

  // 3. Equipamentos e Utensílios
  { id: 'e2_r3_1', eixoId: 'alimentacao', ambiente: 'Equipamentos e Utensílios',
    item: '3.1 Equipamentos da cozinha (freezers, geladeiras, fogão) funcionando normalmente', pesoMax: 9.17 },
  { id: 'e2_r3_2', eixoId: 'alimentacao', ambiente: 'Equipamentos e Utensílios',
    item: '3.2 Inexistência de móveis de madeira na cozinha (ANVISA)', pesoMax: 9.17 },
  { id: 'e2_r3_3', eixoId: 'alimentacao', ambiente: 'Equipamentos e Utensílios',
    item: '3.3 Utensílios em materiais permitidos, sem utensílios de madeira (ANVISA)', pesoMax: 9.17 },
  { id: 'e2_r3_4', eixoId: 'alimentacao', ambiente: 'Equipamentos e Utensílios',
    item: '3.4 Lixeiras com tampa acionada por pedal e saco plástico', pesoMax: 9.17 },
  { id: 'e2_r3_5', eixoId: 'alimentacao', ambiente: 'Equipamentos e Utensílios',
    item: '3.5 Despensa separada da área de preparo da cozinha', pesoMax: 9.17 },
  { id: 'e2_r3_6', eixoId: 'alimentacao', ambiente: 'Equipamentos e Utensílios',
    item: '3.6 Limpeza periódica interna e externa dos freezers e geladeiras', pesoMax: 9.17 },
  { id: 'e2_r3_7', eixoId: 'alimentacao', ambiente: 'Equipamentos e Utensílios',
    item: '3.7 Tela milimétrica instalada nas portas e janelas da cozinha', pesoMax: 9.17 },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 3 — Limpeza e Organização dos Ambientes (total resultado: 110)
  // ═══════════════════════════════════════════════════════════════════════
  // ~70+ itens; peso unitário ≈ 1.55 por item

  // Ambientes Gerais — Parte 1 (itens A-P)
  { id: 'e3_r1_1', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'A — Aparelhos de TV limpos e livres de pó/resíduos', pesoMax: 1.55 },
  { id: 'e3_r1_2', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'B — Armários externos limpos, sem manchas ou resíduos', pesoMax: 1.55 },
  { id: 'e3_r1_3', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'C — Balcões e bancadas limpos e sem acúmulo de resíduos', pesoMax: 1.55 },
  { id: 'e3_r1_4', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'D — Batentes e molduras de portas/janelas sem acúmulo de sujeira', pesoMax: 1.55 },
  { id: 'e3_r1_5', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'E — Bebedouros higienizados e com torneiras limpas', pesoMax: 1.55 },
  { id: 'e3_r1_6', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'F — Cadeiras limpas sem manchas ou resíduos impregnados', pesoMax: 1.55 },
  { id: 'e3_r1_7', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'G — Carteiras/mesas limpas e sem grafites ou sujeira acumulada', pesoMax: 1.55 },
  { id: 'e3_r1_8', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'H — Cestos de lixo limpos, com saco plástico e sem odor', pesoMax: 1.55 },
  { id: 'e3_r1_9', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'I — Cortinas/persianas limpas sem pó, mofos ou manchas', pesoMax: 1.55 },
  { id: 'e3_r1_10', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'J — Corrimãos higienizados sem acúmulo de gordura ou sujeira', pesoMax: 1.55 },
  { id: 'e3_r1_11', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'K — Divisórias internas limpas, sem manchas ou grafites', pesoMax: 1.55 },
  { id: 'e3_r1_12', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'L — Dispensadores de papel toalha e papel higiênico abastecidos e limpos', pesoMax: 1.55 },
  { id: 'e3_r1_13', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'M — Escadas limpas, sem poeira acumulada nos degraus', pesoMax: 1.55 },
  { id: 'e3_r1_14', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'N — Extintores de incêndio limpos e sem poeira ou manchas', pesoMax: 1.55 },
  { id: 'e3_r1_15', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'O — Espelhos limpos sem marcas, manchas ou resíduos', pesoMax: 1.55 },
  { id: 'e3_r1_16', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de A a P',
    item: 'P — Interruptores e tomadas limpas sem marcas de dedos ou sujeira', pesoMax: 1.55 },

  // Ambientes Gerais — Parte 2 (itens Q-Z)
  { id: 'e3_r2_1', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Q — Mesas limpas, sem resíduos ou manchas visíveis', pesoMax: 1.55 },
  { id: 'e3_r2_2', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'R — Murais/quadros de avisos limpos e organizados', pesoMax: 1.55 },
  { id: 'e3_r2_3', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'S — Móveis em geral sem acúmulo de sujeira ou poeira', pesoMax: 1.55 },
  { id: 'e3_r2_4', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'T — Prateleiras limpas e organizadas sem poeira acumulada', pesoMax: 1.55 },
  { id: 'e3_r2_5', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'U — Paredes limpas sem manchas, grafites ou sujeira visível', pesoMax: 1.55 },
  { id: 'e3_r2_6', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'V — Pias e cubas higienizadas sem resíduos ou manchas de calcário', pesoMax: 1.55 },
  { id: 'e3_r2_7', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'X — Torneiras limpas sem depósito de calcário ou ferrugem', pesoMax: 1.55 },
  { id: 'e3_r2_8', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Y — Placas indicativas/sinalizações limpas e legíveis', pesoMax: 1.55 },
  { id: 'e3_r2_9', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Z1 — Tomadas e espelhos elétricos limpos sem marcas ou sujeira', pesoMax: 1.55 },
  { id: 'e3_r2_10', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Z2 — Pisos limpos, sem resíduos, manchas ou sujeira visível', pesoMax: 1.55 },
  { id: 'e3_r2_11', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Z3 — Peitoril das janelas limpos sem acúmulo de pó ou objetos', pesoMax: 1.55 },
  { id: 'e3_r2_12', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Z4 — Portas limpas sem manchas, gordura ou resíduos', pesoMax: 1.55 },
  { id: 'e3_r2_13', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Z5 — Quadros brancos/negros limpos sem resíduos de tinta/giz', pesoMax: 1.55 },
  { id: 'e3_r2_14', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Z6 — Ralos limpos e desobstruídos', pesoMax: 1.55 },
  { id: 'e3_r2_15', eixoId: 'limpeza', ambiente: 'Ambientes Gerais — Elementos de Q a Z',
    item: 'Z7 — Rodapés limpos sem acúmulo de sujeira ou manchas', pesoMax: 1.55 },

  // Banheiros dos Alunos
  { id: 'e3_r3_1', eixoId: 'limpeza', ambiente: 'Banheiros dos Alunos',
    item: 'Piso do banheiro limpo sem poças d\'água ou resíduos', pesoMax: 1.55 },
  { id: 'e3_r3_2', eixoId: 'limpeza', ambiente: 'Banheiros dos Alunos',
    item: 'Vasos sanitários limpos, sem manchas de calcário ou resíduos orgânicos', pesoMax: 1.55 },
  { id: 'e3_r3_3', eixoId: 'limpeza', ambiente: 'Banheiros dos Alunos',
    item: 'Pias e torneiras do banheiro higienizadas', pesoMax: 1.55 },
  { id: 'e3_r3_4', eixoId: 'limpeza', ambiente: 'Banheiros dos Alunos',
    item: 'Espelhos limpos e lixeiras com saco plástico e tampadas', pesoMax: 1.55 },
  { id: 'e3_r3_5', eixoId: 'limpeza', ambiente: 'Banheiros dos Alunos',
    item: 'Paredes e box/divisórias do banheiro sem mofos ou manchas', pesoMax: 1.55 },

  // Banheiros dos Professores / Funcionários
  { id: 'e3_r4_1', eixoId: 'limpeza', ambiente: 'Banheiros dos Professores e Funcionários',
    item: 'Piso limpo sem poças ou resíduos', pesoMax: 1.55 },
  { id: 'e3_r4_2', eixoId: 'limpeza', ambiente: 'Banheiros dos Professores e Funcionários',
    item: 'Vasos sanitários limpos e higienizados', pesoMax: 1.55 },
  { id: 'e3_r4_3', eixoId: 'limpeza', ambiente: 'Banheiros dos Professores e Funcionários',
    item: 'Pias, torneiras, espelhos e lixeiras higienizados', pesoMax: 1.55 },

  // Áreas de Circulação / Corredores
  { id: 'e3_r5_1', eixoId: 'limpeza', ambiente: 'Áreas de Circulação e Corredores',
    item: 'Corredores livres de objetos, lixo ou resíduos no piso', pesoMax: 1.55 },
  { id: 'e3_r5_2', eixoId: 'limpeza', ambiente: 'Áreas de Circulação e Corredores',
    item: 'Paredes dos corredores limpas sem manchas ou grafites', pesoMax: 1.55 },
  { id: 'e3_r5_3', eixoId: 'limpeza', ambiente: 'Áreas de Circulação e Corredores',
    item: 'Área da entrada principal limpa e organizada', pesoMax: 1.55 },
  { id: 'e3_r5_4', eixoId: 'limpeza', ambiente: 'Áreas de Circulação e Corredores',
    item: 'Pátio interno / quadra coberta limpa sem lixo ou resíduos', pesoMax: 1.55 },

  // Área Externa / Pátio
  { id: 'e3_r6_1', eixoId: 'limpeza', ambiente: 'Área Externa e Pátio',
    item: 'Área externa limpa sem acúmulo de lixo ou entulho', pesoMax: 1.55 },
  { id: 'e3_r6_2', eixoId: 'limpeza', ambiente: 'Área Externa e Pátio',
    item: 'Jardinagem/áreas verdes aparadas e sem lixo', pesoMax: 1.55 },
  { id: 'e3_r6_3', eixoId: 'limpeza', ambiente: 'Área Externa e Pátio',
    item: 'Lixeiras externas identificadas, com tampa e saco plástico', pesoMax: 1.55 },

  // Cozinha / Refeitório
  { id: 'e3_r7_1', eixoId: 'limpeza', ambiente: 'Cozinha e Refeitório',
    item: 'Piso da cozinha e refeitório limpo, seco e sem resíduos', pesoMax: 1.55 },
  { id: 'e3_r7_2', eixoId: 'limpeza', ambiente: 'Cozinha e Refeitório',
    item: 'Bancadas e equipamentos da cozinha limpos e higienizados', pesoMax: 1.55 },
  { id: 'e3_r7_3', eixoId: 'limpeza', ambiente: 'Cozinha e Refeitório',
    item: 'Mesas e bancos do refeitório limpos antes e após as refeições', pesoMax: 1.55 },
  { id: 'e3_r7_4', eixoId: 'limpeza', ambiente: 'Cozinha e Refeitório',
    item: 'Ralos e caixas de gordura sem entupimento e limpos', pesoMax: 1.55 },

  // Equipamentos de Limpeza
  { id: 'e3_r8_1', eixoId: 'limpeza', ambiente: 'Equipamentos e Materiais de Limpeza',
    item: 'Vassouras, rodos, panos e escovas em bom estado e armazenados corretamente', pesoMax: 1.55 },
  { id: 'e3_r8_2', eixoId: 'limpeza', ambiente: 'Equipamentos e Materiais de Limpeza',
    item: 'Produtos de limpeza identificados, armazenados em local adequado', pesoMax: 1.55 },
  { id: 'e3_r8_3', eixoId: 'limpeza', ambiente: 'Equipamentos e Materiais de Limpeza',
    item: 'EPIs de limpeza (luvas, botas, avental) disponíveis e em uso', pesoMax: 1.55 },

  // Apresentação / Uniformes dos Agentes
  { id: 'e3_r9_1', eixoId: 'limpeza', ambiente: 'Apresentação e Uniformes dos Agentes de Limpeza',
    item: 'Agentes de limpeza com uniforme completo, limpo e em bom estado', pesoMax: 1.55 },
  { id: 'e3_r9_2', eixoId: 'limpeza', ambiente: 'Apresentação e Uniformes dos Agentes de Limpeza',
    item: 'Agentes utilizando EPIs durante a execução das tarefas', pesoMax: 1.55 },
  { id: 'e3_r9_3', eixoId: 'limpeza', ambiente: 'Apresentação e Uniformes dos Agentes de Limpeza',
    item: 'Escala de limpeza afixada e acessível ao público', pesoMax: 1.55 },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 4 — Manutenção e Conservação da Infraestrutura (total resultado: 110)
  // ═══════════════════════════════════════════════════════════════════════
  // ~28 itens; peso unitário ≈ 3.93

  // 1. Estrutura Geral
  { id: 'e4_r1_1', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.1 Sistema construtivo e alvenaria sem patologias graves (rachaduras, fissuras)', pesoMax: 3.93 },
  { id: 'e4_r1_2', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.2 Coberturas e telhados sem vazamentos ou infiltrações aparentes', pesoMax: 3.93 },
  { id: 'e4_r1_3', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.3 Forros e tetos em perfeitas condições (sem buracos ou desplacamentos)', pesoMax: 3.93, opcional: true },
  { id: 'e4_r1_4', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.4 Pisos e revestimentos sem quebras ou desgastes graves', pesoMax: 3.93 },
  { id: 'e4_r1_5', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.5 Pintura interna e externa limpa e bem conservada', pesoMax: 3.93 },
  { id: 'e4_r1_6', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.6 Esquadrias, portas e janelas abrindo e fechando corretamente', pesoMax: 3.93 },
  { id: 'e4_r1_7', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.7 Áreas molhadas (louças, metais, bancadas e divisórias dos sanitários) íntegras', pesoMax: 3.93 },
  { id: 'e4_r1_8', eixoId: 'manutencao', ambiente: 'Estrutura Geral',
    item: '1.8 Piscina e casa de máquinas limpas e em conformidade', pesoMax: 3.93, opcional: true },

  // 2. Instalações Elétricas
  { id: 'e4_r2_1', eixoId: 'manutencao', ambiente: 'Instalações Elétricas',
    item: '2.1 Redes de baixa tensão e quadros elétricos seguros e tampados', pesoMax: 3.93 },
  { id: 'e4_r2_2', eixoId: 'manutencao', ambiente: 'Instalações Elétricas',
    item: '2.2 Tomadas, interruptores e pontos de luz sem fiações expostas', pesoMax: 3.93 },

  // 3. Instalações Hidrossanitárias
  { id: 'e4_r3_1', eixoId: 'manutencao', ambiente: 'Instalações Hidrossanitárias',
    item: '3.1 Caixa d\'água e cisterna limpas e vedadas', pesoMax: 3.93 },
  { id: 'e4_r3_2', eixoId: 'manutencao', ambiente: 'Instalações Hidrossanitárias',
    item: '3.2 Ralos e sifões sem vazamento ou entupimento', pesoMax: 3.93 },
  { id: 'e4_r3_3', eixoId: 'manutencao', ambiente: 'Instalações Hidrossanitárias',
    item: '3.3 Válvulas e registros de água funcionando corretamente', pesoMax: 3.93 },
  { id: 'e4_r3_4', eixoId: 'manutencao', ambiente: 'Instalações Hidrossanitárias',
    item: '3.4 Sistema de tratamento de esgoto / fossa séptica regular', pesoMax: 3.93 },
  { id: 'e4_r3_5', eixoId: 'manutencao', ambiente: 'Instalações Hidrossanitárias',
    item: '3.5 Caixas de gordura higienizadas e desobstruídas', pesoMax: 3.93 },
  { id: 'e4_r3_6', eixoId: 'manutencao', ambiente: 'Instalações Hidrossanitárias',
    item: '3.6 Instalações e abrigos de gás conformes', pesoMax: 3.93, opcional: true },

  // 4. Combate a Incêndio
  { id: 'e4_r4_1', eixoId: 'manutencao', ambiente: 'Combate a Incêndio',
    item: '4.1 Extintores de incêndio com carga dentro da validade', pesoMax: 3.93 },
  { id: 'e4_r4_2', eixoId: 'manutencao', ambiente: 'Combate a Incêndio',
    item: '4.2 Hidrantes e mangueiras em perfeito estado', pesoMax: 3.93, opcional: true },
  { id: 'e4_r4_3', eixoId: 'manutencao', ambiente: 'Combate a Incêndio',
    item: '4.3 Sinalização de emergência e rotas de fuga desobstruídas', pesoMax: 3.93, opcional: true },
  { id: 'e4_r4_4', eixoId: 'manutencao', ambiente: 'Combate a Incêndio',
    item: '4.4 Sistemas de acionamento de alarme conformes', pesoMax: 3.93, opcional: true },

  // 5. Implantação Externa
  { id: 'e4_r5_1', eixoId: 'manutencao', ambiente: 'Implantação Externa',
    item: '5.1 Pórtico da escola bem conservado e com logo oficial', pesoMax: 3.93, opcional: true },
  { id: 'e4_r5_2', eixoId: 'manutencao', ambiente: 'Implantação Externa',
    item: '5.2 Muro e gradil da escola seguros e pintados', pesoMax: 3.93 },
  { id: 'e4_r5_3', eixoId: 'manutencao', ambiente: 'Implantação Externa',
    item: '5.3 Depósito de resíduos sólidos (lixeira externa) estruturado', pesoMax: 3.93, opcional: true },
  { id: 'e4_r5_4', eixoId: 'manutencao', ambiente: 'Implantação Externa',
    item: '5.4 Calçamentos externos e acessos seguros sem buracos', pesoMax: 3.93 },
  { id: 'e4_r5_5', eixoId: 'manutencao', ambiente: 'Implantação Externa',
    item: '5.5 Paisagismo e áreas verdes limpas e cuidadas', pesoMax: 3.93, opcional: true },

  // 6. Acessibilidade
  { id: 'e4_r6_1', eixoId: 'manutencao', ambiente: 'Acessibilidade',
    item: '6.1 Rampa de acesso normativa e em bom estado', pesoMax: 3.93, opcional: true },
  { id: 'e4_r6_2', eixoId: 'manutencao', ambiente: 'Acessibilidade',
    item: '6.2 Corrimão, guarda-corpo e barras de apoio em banheiros PNE', pesoMax: 3.93, opcional: true },
  { id: 'e4_r6_3', eixoId: 'manutencao', ambiente: 'Acessibilidade',
    item: '6.3 Placas de sinalização PNE, mapas e pisos táteis', pesoMax: 3.93, opcional: true },

  // 7. Quadra Poliesportiva
  { id: 'e4_r7_1', eixoId: 'manutencao', ambiente: 'Quadra Poliesportiva',
    item: '7.1 Pintura, traves, redes e demarcação da quadra em bom estado', pesoMax: 3.93, opcional: true },

  // ═══════════════════════════════════════════════════════════════════════
  // EIXO 5 — Gestão Escolar e Pedagógica (total resultado: 160)
  // ═══════════════════════════════════════════════════════════════════════
  // ~15 itens; peso unitário ≈ 10.67

  // 1. Busca Ativa
  { id: 'e5_r1_1', eixoId: 'gestao', ambiente: 'Busca Ativa e Frequência',
    item: '1.1 Índice de Abandono Escolar mantido abaixo da meta anual', pesoMax: 10.67 },
  { id: 'e5_r1_2', eixoId: 'gestao', ambiente: 'Busca Ativa e Frequência',
    item: '1.2 Índice de Evasão Escolar zerado ou drasticamente reduzido', pesoMax: 10.67 },

  // 2. Gestão Financeira
  { id: 'e5_r2_1', eixoId: 'gestao', ambiente: 'Gestão Financeira',
    item: '2.1 Alimentação escolar executada e com prestação de contas regular', pesoMax: 10.67 },
  { id: 'e5_r2_2', eixoId: 'gestao', ambiente: 'Gestão Financeira',
    item: '2.2 Recurso Único (RU) executado em conformidade com plano de aplicação', pesoMax: 10.67 },
  { id: 'e5_r2_3', eixoId: 'gestao', ambiente: 'Gestão Financeira',
    item: '2.3 PDDE Estrutura com módulos concluídos (Água, Esgoto, Sanitário, Sala de Recursos)', pesoMax: 10.67 },
  { id: 'e5_r2_4', eixoId: 'gestao', ambiente: 'Gestão Financeira',
    item: '2.4 PDDE Qualidade executado (Itinerários, Inovação, Educação Integral)', pesoMax: 10.67 },
  { id: 'e5_r2_5', eixoId: 'gestao', ambiente: 'Gestão Financeira',
    item: '2.5 PDDE Básico com regularidade na execução e saldo conciliado', pesoMax: 10.67 },

  // 3. Resultados Pedagógicos
  { id: 'e5_r3_1', eixoId: 'gestao', ambiente: 'Resultados Pedagógicos',
    item: '3.1 Desempenho geral nas avaliações do Avalia MT (escala satisfatória)', pesoMax: 10.67 },
  { id: 'e5_r3_2', eixoId: 'gestao', ambiente: 'Resultados Pedagógicos',
    item: '3.2 Taxa de participação dos alunos no Avalia MT acima de 85%', pesoMax: 10.67 },
  { id: 'e5_r3_3', eixoId: 'gestao', ambiente: 'Resultados Pedagógicos',
    item: '3.3 Resultados do SAEB publicados e com plano de ação de melhoria', pesoMax: 10.67 },
  { id: 'e5_r3_4', eixoId: 'gestao', ambiente: 'Resultados Pedagógicos',
    item: '3.4 Índice de aprovação/progressão acima da meta estadual', pesoMax: 10.67 },
  { id: 'e5_r3_5', eixoId: 'gestao', ambiente: 'Resultados Pedagógicos',
    item: '3.5 Plano de Recuperação Paralela implementado e com alunos atendidos', pesoMax: 10.67 },

  // 4. Gestão e Ambiente Escolar
  { id: 'e5_r4_1', eixoId: 'gestao', ambiente: 'Gestão e Ambiente Escolar',
    item: '4.1 Organização e disciplina no ambiente escolar evidentes (civismo, ordem)', pesoMax: 10.67 },
  { id: 'e5_r4_2', eixoId: 'gestao', ambiente: 'Gestão e Ambiente Escolar',
    item: '4.2 Comunicação visual (murais, painéis, identificações) organizada e atualizada', pesoMax: 10.67 },
  { id: 'e5_r4_3', eixoId: 'gestao', ambiente: 'Gestão e Ambiente Escolar',
    item: '4.3 Rotinas administrativas e pedagógicas documentadas e executadas', pesoMax: 10.67 },
];
