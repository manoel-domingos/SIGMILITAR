// ============================================================
// TIPAGENS E CONFIGURAÇÕES
// ============================================================

export type ColumnType =
  | 'NOME'
  | 'TURMA'
  | 'CPF'
  | 'DATA_NASCIMENTO'
  | 'TELEFONE'
  | 'MATRICULA'
  | 'EMAIL'
  | 'ENDERECO'
  | 'GENERO'
  | 'RESPONSAVEL'
  | 'UNKNOWN';

export interface KeywordConfig {
  keywords: string[];
  abbreviations: string[];
  weight: number;
  required: boolean;
  validator: (value: any) => boolean;
  /** Penalidade quando a CÉLULA parece ser dado deste tipo (não cabeçalho) */
  dataPenalty: number;
}

export interface MappedColumn {
  index: number;
  headerValue: string;
  type: ColumnType;
  confidence: number;
}

export interface ScanResult {
  headerRowIndex: number;
  confidence: number;
  columns: MappedColumn[];
  needsAI: boolean;
  reason?: string;
  rawScore: number;
}

export interface ScanOptions {
  inheritedHeaderRow?: number;
  maxScanRows?: number;
  confidenceThreshold?: number;
  profileDepth?: number;
}

// ============================================================
// TIPAGENS DA CAMADA AVANÇADA (incorporadas do codigo22)
// ============================================================

export interface DensityRegion {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  density: number;
  rowCount: number;
  colCount: number;
  avgRowLength: number; // ← incorporado do codigo22
  cellCount: number;
}

export type TableOrientation = 'HORIZONTAL' | 'VERTICAL' | 'AMBIGUOUS';

export interface AdvancedScanResult {
  /** Melhor tabela encontrada (maior confiança + mais dados) */
  primary: ScanResult & { region: DensityRegion; orientation: TableOrientation };
  /** Demais tabelas detectadas na mesma aba */
  secondary: Array<ScanResult & { region: DensityRegion; orientation: TableOrientation }>;
  /** Todas as regiões detectadas (para debug) */
  regions: DensityRegion[];
  /** true se QUALQUER tabela precisar de IA */
  anyNeedsAI: boolean;
}

// ============================================================
// REGEX
// ============================================================

const RGX = {
  // ✅ FIX: CPF puro sem máscara (11 dígitos) agora tem regex própria e valida dígito verificador
  CPF_MASKED: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
  CPF_RAW: /^\d{11}$/,

  TELEFONE: /^(\+?\d{1,3}[\s-]?)?\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}$/,
  TELEFONE_RAW: /^\d{10,11}$/,

  DATA: /^(0[1-9]|[12]\d|3[01])[\/\-.](0[1-9]|1[0-2])[\/\-.]\d{4}$|^\d{4}[\/\-.](0[1-9]|1[0-2])[\/\-.](0[1-9]|[12]\d|3[01])$/,

  TURMA: /^\d{0,2}\s*[º°ªoa]?\s*(ano|série|serie)?\s*[A-Z]\d?$/i,

  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Nome: 2+ palavras, sem números
  NOME: /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[\s'-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/,

  MATRICULA: /^[A-Za-z]{0,4}\d{4,}$/,

  GENERO: /^(masculino|feminino|m|f|homem|mulher|outro)$/i,

  ENDERECO: /^[A-Za-zÀ-ÖØ-öø-ÿ].*\d+|.*s\/n/i,

  RESPONSAVEL: /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[\s'-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/,

  // ✅ NOVO: Sequencial puro (1, 2, 3...) = claramente dado de linha, nunca cabeçalho
  SEQUENTIAL_NUMBER: /^\d{1,4}$/,
};

// ============================================================
// VALIDADORES COM SUPORTE A CPF SEM MÁSCARA
// ============================================================

function validateCPF(v: any): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().replace(/\D/g, '');
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false; // todos dígitos iguais

  // Valida dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(s[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(s[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(s[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(s[10]);
}

function validateTelefone(v: any): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().replace(/\D/g, '');
  return (s.length >= 10 && s.length <= 13) && RGX.TELEFONE_RAW.test(s);
}

// ============================================================
// KEYWORD MAP — com `dataPenalty`
// ============================================================

const KEYWORD_MAP: Record<ColumnType, KeywordConfig> = {
  NOME: {
    keywords: ['nome', 'nome completo', 'aluno', 'estudante', 'discente', 'nome do aluno'],
    abbreviations: ['nom', 'nomp', 'alun', 'estud', 'disc'],
    weight: 12,
    required: true,
    // ✅ FIX: penalidade alta — nome de aluno numa célula = dado, não cabeçalho
    dataPenalty: 18,
    validator: (v) => typeof v === 'string' && RGX.NOME.test(v.trim()),
  },
  TURMA: {
    keywords: ['turma', 'série', 'serie', 'classe', 'sala', 'ano', 'período', 'periodo'],
    abbreviations: ['tur', 'ser', 'cla', 'sal'],
    weight: 12,
    required: true,
    dataPenalty: 10,
    validator: (v) => {
      if (typeof v !== 'string' && typeof v !== 'number') return false;
      const s = String(v).trim();
      return RGX.TURMA.test(s) || /^[A-Z]\d?$/.test(s);
    },
  },
  CPF: {
    keywords: ['cpf', 'documento', 'cpf do aluno', 'cpf do responsável', 'cpf responsavel', 'doc'],
    abbreviations: ['cpf', 'doc'],
    weight: 10,
    required: false,
    // ✅ FIX: CPF sem máscara (11 dígitos) numa célula = dado real, enorme penalidade
    dataPenalty: 20,
    validator: validateCPF,
  },
  DATA_NASCIMENTO: {
    keywords: ['data de nascimento', 'nascimento', 'data nasc', 'dt nasc', 'nasc', 'dn', 'data de nasc'],
    abbreviations: ['nas', 'nasc', 'dt_nasc', 'dn', 'dt'],
    weight: 9,
    required: false,
    dataPenalty: 15,
    validator: (v) => {
      if (v instanceof Date) return true;
      if (typeof v !== 'string' && typeof v !== 'number') return false;
      return RGX.DATA.test(String(v).trim());
    },
  },
  TELEFONE: {
    keywords: ['telefone', 'celular', 'fone', 'contato', 'whatsapp', 'tel', 'phone', 'cel'],
    abbreviations: ['te', 'tel', 'cel', 'fon', 'cont'],
    weight: 8,
    required: false,
    dataPenalty: 14,
    validator: validateTelefone,
  },
  MATRICULA: {
    keywords: ['matrícula', 'matricula', 'número de matrícula', 'numero matricula', 'rm', 'ra', 'nº', 'numero', 'n°'],
    abbreviations: ['mat', 'rm', 'ra', 'nmat', 'num'],
    weight: 8,
    required: false,
    dataPenalty: 8,
    validator: (v) => {
      if (typeof v !== 'string' && typeof v !== 'number') return false;
      return RGX.MATRICULA.test(String(v).trim());
    },
  },
  EMAIL: {
    keywords: ['email', 'e-mail', 'correio eletrônico', 'correio eletronico', 'mail'],
    abbreviations: ['eml', 'mail'],
    weight: 7,
    required: false,
    dataPenalty: 16,
    validator: (v) => typeof v === 'string' && RGX.EMAIL.test(v.trim()),
  },
  GENERO: {
    keywords: ['sexo', 'gênero', 'genero', 'gender'],
    abbreviations: ['sex', 'gen'],
    weight: 6,
    required: false,
    dataPenalty: 5,
    validator: (v) => typeof v === 'string' && RGX.GENERO.test(v.trim()),
  },
  ENDERECO: {
    keywords: ['endereço', 'endereco', 'rua', 'av', 'avenida', 'logradouro', 'residência', 'residencia'],
    abbreviations: ['end', 'rua', 'av', 'logr', 'res'],
    weight: 5,
    required: false,
    dataPenalty: 6,
    validator: (v) => typeof v === 'string' && RGX.ENDERECO.test(v.trim()),
  },
  RESPONSAVEL: {
    keywords: ['responsável', 'responsavel', 'pai', 'mãe', 'mae', 'encarregado', 'tutor'],
    abbreviations: ['resp', 'pai', 'mae', 'tut'],
    weight: 7,
    required: false,
    dataPenalty: 12,
    validator: (v) => typeof v === 'string' && RGX.RESPONSAVEL.test(v.trim()),
  },
  UNKNOWN: {
    keywords: [],
    abbreviations: [],
    weight: 0,
    required: false,
    dataPenalty: 0,
    validator: () => false,
  },
};

// ============================================================
// UTILITÁRIOS
// ============================================================

function normalizeText(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function looksLikeHeader(value: any): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).trim();
  if (s.length === 0) return false;
  // ✅ FIX: números sequenciais (1, 2, 3...) são dados, nunca cabeçalho
  if (RGX.SEQUENTIAL_NUMBER.test(s)) return false;
  if (RGX.CPF_MASKED.test(s) || RGX.CPF_RAW.test(s)) return false;
  if (RGX.DATA.test(s)) return false;
  if (RGX.NOME.test(s)) return false; // nome completo é dado, não cabeçalho
  return true;
}

function headerLikenessScore(row: any[]): number {
  if (!row || row.length === 0) return 0;
  const validCells = row.filter(v => v !== null && v !== undefined && String(v).trim() !== '').length;
  if (validCells === 0) return 0;
  return row.filter(looksLikeHeader).length / validCells;
}

// ============================================================
// MOTOR DE PONTUAÇÃO — com ANTI-DATA PENALTY ✅ FIX CRÍTICO
// ============================================================

interface HeaderCandidate {
  rowIndex: number;
  score: number;
  columns: MappedColumn[];
  coverage: number;
  penaltyApplied: number; // para debug
}

function scoreHeaderRow(row: any[], rowIndex: number): HeaderCandidate {
  let score = 0;
  let penalty = 0;
  const columns: MappedColumn[] = [];
  let knownColumns = 0;
  let totalNonEmpty = 0;

  for (let colIndex = 0; colIndex < row.length; colIndex++) {
    const rawValue = row[colIndex];
    if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') continue;

    totalNonEmpty++;
    const normalized = normalizeText(rawValue);
    if (normalized.length < 1) continue;

    let bestMatch: { type: ColumnType; confidence: number; weight: number } | null = null;
    let dataMatchPenalty = 0;

    for (const [type, config] of Object.entries(KEYWORD_MAP)) {
      if (type === 'UNKNOWN') continue;
      const colType = type as ColumnType;
      const cfg = config as KeywordConfig;

      // --- KEYWORD MATCHING (célula como cabeçalho) ---
      if (cfg.keywords.some(k => normalized === k)) {
        if (!bestMatch || cfg.weight > bestMatch.weight) {
          bestMatch = { type: colType, confidence: 100, weight: cfg.weight };
        }
        continue;
      }
      if (cfg.keywords.some(k => normalized.includes(k))) {
        const conf = 85;
        if (!bestMatch || cfg.weight * conf / 100 > (bestMatch?.weight ?? 0) * (bestMatch?.confidence ?? 0) / 100) {
          bestMatch = { type: colType, confidence: conf, weight: cfg.weight };
        }
        continue;
      }
      if (cfg.abbreviations.some(abbr => {
        const re = new RegExp(`(^|[^a-z])${abbr}([^a-z]|$)`);
        return re.test(normalized) || normalized === abbr;
      })) {
        const conf = 70;
        if (!bestMatch || cfg.weight * conf / 100 > (bestMatch?.weight ?? 0) * (bestMatch?.confidence ?? 0) / 100) {
          bestMatch = { type: colType, confidence: conf, weight: cfg.weight };
        }
      }

      // ✅ FIX CRÍTICO: ANTI-DATA PENALTY
      // Se a célula VALIDA como dado real deste tipo, aplicar penalidade
      // Isso é o que distingue "CPF" (cabeçalho) de "07446638141" (dado)
      if (cfg.validator(rawValue)) {
        dataMatchPenalty = Math.max(dataMatchPenalty, cfg.dataPenalty);
      }
    }

    // ✅ FIX: números sequenciais têm penalidade fixa (linha de dados numéricos)
    if (RGX.SEQUENTIAL_NUMBER.test(String(rawValue).trim())) {
      dataMatchPenalty = Math.max(dataMatchPenalty, 12);
    }

    if (bestMatch) {
      // Keyword match supera a penalidade de dado — é provavelmente um cabeçalho de verdade
      // Exemplo: "CPF" como texto → score positivo, mesmo que 3 letras possam ser outra coisa
      knownColumns++;
      score += bestMatch.weight * (bestMatch.confidence / 100);
      columns.push({ index: colIndex, headerValue: String(rawValue), type: bestMatch.type, confidence: bestMatch.confidence });
    } else {
      // Sem keyword match → só aplica penalidade se parece dado
      penalty += dataMatchPenalty;
    }
  }

  const coverage = totalNonEmpty > 0 ? knownColumns / totalNonEmpty : 0;
  const coverageBonus = coverage * 20;
  const likeness = headerLikenessScore(row);
  const likenessBonus = likeness * 10;
  const lengthBonus = Math.min(totalNonEmpty * 2, 10);

  const finalScore = score + coverageBonus + likenessBonus + lengthBonus - penalty;

  return {
    rowIndex,
    score: finalScore,
    columns,
    coverage,
    penaltyApplied: penalty,
  };
}

// ============================================================
// VALIDAÇÃO POR CONTEÚDO (PROFILING)
// ============================================================

function validateContentProfiling(
  rows: any[][],
  headerRowIndex: number,
  mappedColumns: MappedColumn[],
  profileDepth: number
): { validatedColumns: MappedColumn[]; contentScore: number } {
  let totalValidationScore = 0;
  let totalPossibleScore = 0;
  const validatedColumns: MappedColumn[] = [];

  for (const col of mappedColumns) {
    const config = KEYWORD_MAP[col.type];
    let validCount = 0;
    let checkedCount = 0;

    for (let i = 1; i <= profileDepth; i++) {
      const dataRowIndex = headerRowIndex + i;
      if (dataRowIndex >= rows.length) break;
      const dataRow = rows[dataRowIndex];
      if (!dataRow || col.index >= dataRow.length) continue;
      const cellValue = dataRow[col.index];
      if (cellValue === null || cellValue === undefined || String(cellValue).trim() === '') continue;
      checkedCount++;
      if (config.validator(cellValue)) validCount++;
    }

    const hitRate = checkedCount > 0 ? validCount / checkedCount : 0;
    const adjustedConfidence = Math.round(col.confidence * (0.3 + 0.7 * hitRate));

    validatedColumns.push({ ...col, confidence: adjustedConfidence });
    totalValidationScore += config.weight * hitRate;
    totalPossibleScore += config.weight;
  }

  const contentScore = totalPossibleScore > 0
    ? (totalValidationScore / totalPossibleScore) * 100
    : 0;

  return { validatedColumns, contentScore };
}

// ============================================================
// SMART HEURISTIC SCAN (base — recebe rows[][] de uma região)
// ============================================================

export function smartHeuristicScan(rows: any[][], options: ScanOptions = {}): ScanResult {
  const {
    inheritedHeaderRow,
    maxScanRows = 20,
    confidenceThreshold = 80,
    profileDepth = 5,
  } = options;

  if (!rows || rows.length === 0) {
    return { headerRowIndex: -1, confidence: 0, columns: [], needsAI: true, reason: 'Planilha vazia', rawScore: 0 };
  }

  const candidates: HeaderCandidate[] = [];
  const scanLimit = Math.min(maxScanRows, rows.length);

  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const candidate = scoreHeaderRow(row, i);
    if (inheritedHeaderRow !== undefined && i === inheritedHeaderRow) {
      candidate.score += 25;
    }
    candidates.push(candidate);
  }

  if (candidates.length === 0) {
    return { headerRowIndex: -1, confidence: 0, columns: [], needsAI: true, reason: 'Nenhuma linha candidata', rawScore: 0 };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  const { validatedColumns, contentScore } = validateContentProfiling(rows, best.rowIndex, best.columns, profileDepth);

  const requiredWeight = Object.values(KEYWORD_MAP).filter(c => c.required).reduce((s, c) => s + c.weight, 0);
  const optionalWeight = Object.values(KEYWORD_MAP).filter(c => !c.required && c.weight > 0).reduce((s, c) => s + c.weight, 0);
  const maxTheoreticalScore = requiredWeight + optionalWeight * 0.5;

  const normalizedHeaderScore = Math.min((best.score / maxTheoreticalScore) * 100, 100);
  const finalConfidence = Math.round(normalizedHeaderScore * 0.6 + contentScore * 0.4);

  const foundRequired = validatedColumns.filter(c => KEYWORD_MAP[c.type].required).map(c => c.type);
  const missingRequired = Object.entries(KEYWORD_MAP)
    .filter(([, cfg]) => cfg.required)
    .map(([t]) => t as ColumnType)
    .filter(t => !foundRequired.includes(t));

  let needsAI = false;
  let reason: string | undefined;
  if (missingRequired.length > 0) { needsAI = true; reason = 'Colunas obrigat\u00f3rias n\u00e3o encontradas: ' + missingRequired.join(', '); }
  else if (finalConfidence < confidenceThreshold) { needsAI = true; reason = 'Confian\u00e7a ' + finalConfidence + '% abaixo do limiar ' + confidenceThreshold + '%'; }
  else if (contentScore < 40) { needsAI = true; reason = 'Valida\u00e7\u00e3o de conte\u00fado baixa (' + Math.round(contentScore) + '%)'; }

  return {
    headerRowIndex: best.rowIndex,
    confidence: finalConfidence,
    columns: validatedColumns,
    needsAI,
    reason,
    rawScore: Math.round(best.score),
  };
}

// ============================================================
// DATA DENSITY ANALYSIS
// ============================================================

function detectMaxColumns(rows: any[][]): number {
  let max = 0;
  for (const row of rows) {
    if (!row) continue;
    for (let c = row.length - 1; c >= 0; c--) {
      const v = row[c];
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        if (c + 1 > max) max = c + 1;
        break;
      }
    }
  }
  return max;
}

function computeRegionDensity(rows: any[][], sr: number, er: number, sc: number, ec: number): { density: number; cellCount: number } {
  let total = 0, nonEmpty = 0;
  for (let r = sr; r <= er; r++) {
    for (let c = sc; c <= ec; c++) {
      total++;
      const v = rows[r]?.[c];
      if (v !== null && v !== undefined && String(v).trim() !== '') nonEmpty++;
    }
  }
  return { density: total > 0 ? nonEmpty / total : 0, cellCount: nonEmpty };
}

export function detectDataRegions(
  rows: any[][],
  options: {
    minRowDensity?: number;
    minBlockRows?: number;
    minCellCount?: number;
    gapTolerance?: number;
  } = {}
): DensityRegion[] {
  const { minRowDensity = 0.2, minBlockRows = 2, minCellCount = 4, gapTolerance = 1 } = options;
  const maxCols = detectMaxColumns(rows);
  if (maxCols === 0) return [];

  type RowProfile = { index: number; nonEmpty: number; density: number; colStart: number; colEnd: number };
  const profiles: RowProfile[] = rows.map((row, i) => {
    let nonEmpty = 0, colStart = maxCols, colEnd = -1;
    for (let c = 0; c < maxCols; c++) {
      const v = row?.[c];
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        nonEmpty++;
        if (c < colStart) colStart = c;
        if (c > colEnd) colEnd = c;
      }
    }
    return { index: i, nonEmpty, density: nonEmpty / maxCols, colStart: nonEmpty > 0 ? colStart : maxCols, colEnd: nonEmpty > 0 ? colEnd : -1 };
  });

  const regions: DensityRegion[] = [];
  let blockStart = -1, consecutiveGaps = 0, blockColStart = maxCols, blockColEnd = -1;

  const flushBlock = (endIndex: number) => {
    if (blockStart === -1) return;
    let realEnd = endIndex;
    while (realEnd > blockStart && profiles[realEnd].nonEmpty === 0) realEnd--;
    if (realEnd - blockStart + 1 < minBlockRows) return;

    const { density, cellCount } = computeRegionDensity(rows, blockStart, realEnd, blockColStart, blockColEnd);
    if (cellCount < minCellCount) return;

    // avgRowLength (incorporado do codigo22)
    let totalFilled = 0;
    for (let r = blockStart; r <= realEnd; r++) {
      for (let c = blockColStart; c <= blockColEnd; c++) {
        const v = rows[r]?.[c];
        if (v !== null && v !== undefined && String(v).trim() !== '') totalFilled++;
      }
    }
    const rowCount = realEnd - blockStart + 1;

    regions.push({
      startRow: blockStart, endRow: realEnd,
      startCol: blockColStart, endCol: blockColEnd,
      density, cellCount, rowCount,
      colCount: blockColEnd - blockColStart + 1,
      avgRowLength: rowCount > 0 ? totalFilled / rowCount : 0,
    });
  };

  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i];
    if (p.density >= minRowDensity && p.nonEmpty > 0) {
      if (blockStart === -1) blockStart = i;
      consecutiveGaps = 0;
      blockColStart = Math.min(blockColStart, p.colStart);
      blockColEnd = Math.max(blockColEnd, p.colEnd);
    } else if (blockStart !== -1) {
      consecutiveGaps++;
      if (consecutiveGaps > gapTolerance) {
        flushBlock(i - 1);
        blockStart = -1; consecutiveGaps = 0; blockColStart = maxCols; blockColEnd = -1;
      }
    }
  }
  flushBlock(profiles.length - 1);

  return regions.sort((a, b) => b.cellCount - a.cellCount);
}

// ============================================================
// ORIENTATION DETECTOR
// ============================================================

function detectOrientation(rows: any[][], region: DensityRegion): { orientation: TableOrientation; normalizedRows: any[][] } {
  const regionRows = rows
    .slice(region.startRow, region.endRow + 1)
    .map(r => (r ?? []).slice(region.startCol, region.endCol + 1));

  const numRows = regionRows.length;
  const numCols = region.endCol - region.startCol + 1;

  const keywordScore = (values: any[]): number => {
    let matches = 0;
    for (const val of values) {
      const norm = normalizeText(val);
      for (const [type, cfg] of Object.entries(KEYWORD_MAP)) {
        if (type === 'UNKNOWN') continue;
        const c = cfg as KeywordConfig;
        if (c.keywords.some(k => norm.includes(k)) || c.abbreviations.some(a => norm === a)) {
          matches++;
          break;
        }
      }
    }
    return values.length > 0 ? matches / values.length : 0;
  };

  const firstRowScore = keywordScore(regionRows[0] ?? []) * 0.6 +
    (regionRows[0]?.filter(looksLikeHeader).length ?? 0) / Math.max(numCols, 1) * 0.4;

  const firstColValues = regionRows.map(r => r[0]);
  const firstColScore = keywordScore(firstColValues) * 0.6 +
    firstColValues.filter(looksLikeHeader).length / Math.max(numRows, 1) * 0.4;

  let orientation: TableOrientation;
  if (Math.abs(firstRowScore - firstColScore) < 0.15) {
    orientation = numRows >= numCols ? 'HORIZONTAL' : 'VERTICAL';
  } else {
    orientation = firstRowScore >= firstColScore ? 'HORIZONTAL' : 'VERTICAL';
  }

  let normalizedRows: any[][];
  if (orientation === 'VERTICAL') {
    const maxLen = Math.max(...regionRows.map(r => r.length), 0);
    normalizedRows = Array.from({ length: maxLen }, (_, ci) => regionRows.map(r => r[ci] ?? null));
  } else {
    normalizedRows = regionRows;
  }

  return { orientation, normalizedRows };
}

// ============================================================
// FUNÇÃO PRINCIPAL: advancedSmartHeuristicScan
// Incorpora primary/secondary do codigo22 + density + vertical
// ============================================================

export function advancedSmartHeuristicScan(
  rows: any[][],
  options: ScanOptions & {
    densityOptions?: Parameters<typeof detectDataRegions>[1];
    maxRegions?: number;
    detectVertical?: boolean;
  } = {}
): AdvancedScanResult {
  const { maxRegions = 5, densityOptions, detectVertical = true, ...scanOptions } = options;

  const emptyResult = () => ({
    primary: null as any,
    secondary: [],
    regions: [],
    anyNeedsAI: true,
  });

  if (!rows || rows.length === 0) return emptyResult();

  const rawRegions = detectDataRegions(rows, densityOptions);

  // Fallback: usa planilha inteira se nenhuma região detectada
  const regionsToProcess = rawRegions.length > 0 ? rawRegions.slice(0, maxRegions) : [{
    startRow: 0, endRow: Math.min(rows.length - 1, 19),
    startCol: 0, endCol: detectMaxColumns(rows) - 1,
    density: 0.5, cellCount: 0, rowCount: rows.length, colCount: detectMaxColumns(rows), avgRowLength: 0,
  } as DensityRegion];

  type RegionResult = ScanResult & { region: DensityRegion; orientation: TableOrientation };
  const results: RegionResult[] = [];

  for (const region of regionsToProcess) {
    const { orientation, normalizedRows } = detectVertical
      ? detectOrientation(rows, region)
      : { orientation: 'HORIZONTAL' as TableOrientation, normalizedRows: rows.slice(region.startRow, region.endRow + 1).map(r => (r ?? []).slice(region.startCol, region.endCol + 1)) };

    const scanResult = smartHeuristicScan(normalizedRows, { ...scanOptions, inheritedHeaderRow: undefined });

    // Remapeia índices de volta ao espaço original (horizontal)
    if (orientation === 'HORIZONTAL') {
      scanResult.columns = scanResult.columns.map(col => ({ ...col, index: col.index + region.startCol }));
      if (scanResult.headerRowIndex >= 0) scanResult.headerRowIndex += region.startRow;
    }

    results.push({ ...scanResult, region, orientation });
  }

  // primary = maior confiança com dados reais (penaliza regiões muito pequenas)
  const sorted = [...results].sort((a, b) => {
    const sa = a.confidence * 0.7 + Math.min(a.region.cellCount / 100, 30) * 0.3;
    const sb = b.confidence * 0.7 + Math.min(b.region.cellCount / 100, 30) * 0.3;
    return sb - sa;
  });

  const [primary, ...secondary] = sorted;

  return {
    primary: primary ?? null,
    secondary,
    regions: rawRegions,
    anyNeedsAI: !primary || primary.needsAI || secondary.some(s => s.needsAI),
  };
}

// ============================================================
// MULTI-SHEET (compatível com xlsx)
// ============================================================

export interface SheetScanInput { sheetName: string; rows: any[][] }
export interface MultiSheetScanResult {
  sheets: Record<string, AdvancedScanResult>;
  globalNeedsAI: boolean;
}

export function scanMultipleSheets(sheets: SheetScanInput[]): MultiSheetScanResult {
  const results: Record<string, AdvancedScanResult> = {};
  let inheritedHeaderRow: number | undefined;

  for (const sheet of sheets) {
    const result = advancedSmartHeuristicScan(sheet.rows, {
      inheritedHeaderRow,
      maxScanRows: 20,
      confidenceThreshold: 80,
      profileDepth: 5,
    });
    results[sheet.sheetName] = result;
    if (inheritedHeaderRow === undefined && result.primary?.confidence >= 80 && result.primary.headerRowIndex >= 0) {
      inheritedHeaderRow = result.primary.headerRowIndex;
    }
  }

  return {
    sheets: results,
    globalNeedsAI: Object.values(results).some(r => r.anyNeedsAI),
  };
}

// ============================================================
// DEBUG: mapa de calor de densidade
// ============================================================

export function debugDensityMap(rows: any[][], regions: DensityRegion[]): string {
  const maxCols = detectMaxColumns(rows);
  return rows.map((_, r) => {
    let line = `${String(r).padStart(3)} │`;
    for (let c = 0; c < maxCols; c++) {
      const v = rows[r]?.[c];
      const hasVal = v !== null && v !== undefined && String(v).trim() !== '';
      const inRegion = regions.some(reg => r >= reg.startRow && r <= reg.endRow && c >= reg.startCol && c <= reg.endCol);
      line += !hasVal ? (inRegion ? '░' : ' ') : (inRegion ? '█' : '▒');
    }
    return line;
  }).join('\n');
}
