/**
 * lib/print-header.ts
 * Cabeçalho, rodapé e layout da ATA — E.E. Cívico-Militar Prof. João Batista.
 *
 * Modelo de referência: ATA institucional (PDF oficial).
 * - Cabeçalho: SEDUC/MT à esquerda | texto institucional centralizado | brasão à direita
 * - Sidebar de identificação com linha vertical separadora
 * - Coluna principal com título "ATA" grande em azul
 * - Rodapé alinhado à direita em múltiplas linhas (NÃO fixo)
 *
 * Logos: /logo-seduc-mt.svg (SEDUC + Governo MT) | /logo-escola.png (brasão)
 * Margens via @page: 0.5cm top/bottom, 1cm left/right.
 */

const origin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : '';

export const getSchoolHeaderHTML = (): string => `
<div class="cabecalho-oficial">
  <img class="cab-logo-seduc"  src="${origin()}/logo-seduc-mt.svg" alt="Logo SEDUC e Governo MT" />
  <div class="cab-center">
    <span class="cab-gov">GOVERNO DO ESTADO DE MATO GROSSO</span>
    <span class="cab-gov">SECRETARIA DE ESTADO DE EDUCAÇÃO</span>
    <span class="cab-escola">ESCOLA ESTADUAL CÍVICO-MILITAR</span>
    <span class="cab-escola">PROF. JOÃO BATISTA</span>
  </div>
  <img class="cab-logo-escola" src="${origin()}/logo-escola.png" alt="Logo EECM Prof. Joao Batista" />
</div>
`;

export const getSchoolFooterHTML = (): string => `
<div class="rodape-oficial">
  <div>E.E Cívico-Militar Prof. João Batista</div>
  <div>(65) 3329-1021 | (65) 99944-6304</div>
  <div>Av. Ismael José do Nascimento nº 892-N Jardim Europa</div>
  <div>CEP 78.300-152 – TANGARÁ DA SERRA/MT</div>
  <div>escola.16020@edu.mt.gov.br</div>
</div>
`;

/**
 * Converte marcação simples **negrito** → <strong>negrito</strong>
 * para uso no corpo da ATA impressa.
 */
export const markdownBoldToHtml = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

// Mantém os exports antigos como alias para não quebrar imports existentes
export const SCHOOL_HEADER_HTML: string = '';
export const SCHOOL_FOOTER_HTML: string = '';

export const SCHOOL_HEADER_CSS = `
  /* ================================================
     Força A4 retrato com tamanho explícito.
     O Chrome respeita o size apenas se a impressora
     também estiver em retrato — definir width/height
     no html garante a proporção correta na tela e no
     preview de impressão.
     ================================================ */
  @page {
    size: 210mm 297mm;
    margin: 8mm 12mm 8mm 12mm;
  }

  html {
    width: 210mm;
  }

  body {
    width: 210mm;
    max-width: 210mm;
    margin: 0 auto;
    font-family: 'Times New Roman', Times, serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding-bottom: 40px;
    border-left: 2px solid #1a237e;
    padding-left: 8px;
  }

  /* ================================================
     Cabeçalho — SEDUC esq. / texto centro / brasão dir.
     Ambas as logos grandes e proporcionais.
     ================================================ */
  .cabecalho-oficial {
    display: grid;
    grid-template-columns: 200px 1fr 80px;
    align-items: center;
    gap: 10px;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }
  .cab-logo-seduc {
    height: auto;
    width: 200px;
    max-height: 72px;
    display: block;
    object-fit: contain;
    object-position: left center;
  }
  .cab-logo-escola {
    height: 80px;
    width: 80px;
    object-fit: contain;
    object-position: right center;
  }
  .cab-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    line-height: 1.5;
  }
  .cab-gov {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  .cab-escola {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
  }

  /* ================================================
     Rodapé — fixo no fundo, alinhado à direita
     com linha azul no topo
     ================================================ */
  .rodape-oficial {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 2px solid #1a237e;
    padding: 4px 12mm 3px 12mm;
    text-align: right;
    font-size: 8pt;
    color: #1a237e;
    line-height: 1.45;
    background: #fff;
  }

  /* ================================================
     Layout 2 colunas — 28% sidebar | 72% ATA
     Linha vertical azul fina à direita da sidebar
     ================================================ */
  .ata-layout {
    display: grid;
    grid-template-columns: 28fr 72fr;
    gap: 14px;
    align-items: start;
  }

  /* SIDEBAR */
  .sidebar {
    border-right: 2px solid #1a237e;
    padding: 0 12px 0 0;
  }
  .sidebar-titulo {
    color: #1a237e;
    font-weight: bold;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .sidebar-divisor {
    border-top: 2px solid #1a237e;
    margin: 10px 0 0 0;
  }
  .sidebar-secao {
    color: #1a237e;
    font-weight: bold;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 6px;
    margin-bottom: 6px;
  }
  .sid-item {
    margin-bottom: 6px;
    line-height: 1.3;
  }
  .sid-label {
    display: block;
    font-size: 7pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #1a237e;
    letter-spacing: 0.4px;
    margin-bottom: 1px;
  }
  .sid-valor {
    display: block;
    font-size: 8.5pt;
    color: #000;
    font-weight: bold;
    word-break: break-word;
  }
  .sid-medida-row {
    display: flex;
    gap: 5px;
    align-items: baseline;
    margin-bottom: 3px;
  }
  .sid-medida-label {
    color: #1a237e;
    font-size: 7.5pt;
    font-weight: normal;
    white-space: nowrap;
  }
  .sid-medida-valor {
    color: #000;
    font-weight: bold;
    font-size: 8.5pt;
  }

  /* COLUNA PRINCIPAL — ATA */
  .main-col {
    padding-top: 2px;
  }
  .ata-titulo-grande {
    font-size: 24pt;
    font-weight: bold;
    color: #1a237e;
    line-height: 1;
    margin-bottom: 2px;
  }
  .ata-subtitulo {
    font-style: italic;
    color: #555;
    font-size: 9pt;
    border-bottom: 1px solid #c0a04a;
    padding-bottom: 3px;
    margin-bottom: 12px;
  }
  .ata-corpo {
    font-size: 9.5pt;
    line-height: 1.7;
    color: #000;
    white-space: pre-wrap;
    text-align: left;
    min-height: 100px;
    margin-bottom: 16px;
  }

  /* Assinaturas — 3 colunas lado a lado */
  .assinaturas-bloco {
    margin-top: 24px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
  .sig-item {
    display: flex;
    flex-direction: column;
  }
  .sig-espaco {
    height: 28px;
  }
  .sig-line {
    border-bottom: 1px solid #000;
    width: 100%;
    margin-bottom: 4px;
  }
  .sig-cargo {
    font-size: 7.5pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #333;
    letter-spacing: 0.4px;
    text-align: center;
    margin-bottom: 6px;
  }
  .sig-nome {
    font-size: 7.5pt;
    color: #333;
    border-bottom: 1px dotted #999;
    padding-bottom: 2px;
  }
  .sig-nome-label {
    font-size: 6.5pt;
    color: #666;
    text-transform: uppercase;
  }

  @media print {
    button { display: none !important; }
    html, body { width: 210mm; }
  }
`;
