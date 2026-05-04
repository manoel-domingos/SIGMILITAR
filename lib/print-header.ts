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
 * Logos: /logo-seduc-mt.png (SEDUC + Governo MT) | /logo-escola.png (brasão)
 * Margens via @page: 0.5cm top/bottom, 1cm left/right.
 */

const origin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : '';

export const getSchoolHeaderHTML = (): string => `
<div class="cabecalho-oficial">
  <img class="cab-logo-seduc"  src="${origin()}/logo-seduc-mt.png" alt="Logo SEDUC e Governo MT" />
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

// Mantém os exports antigos como alias para não quebrar imports existentes
export const SCHOOL_HEADER_HTML: string = '';
export const SCHOOL_FOOTER_HTML: string = '';

export const SCHOOL_HEADER_CSS = `
  /* Orientação retrato (A4) e margens iguais ao modelo */
  @page {
    size: A4 portrait;
    margin: 0.5cm 1cm;
  }

  html, body {
    width: 100%;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ==============================================
     Cabeçalho — SEDUC esq. / texto centro / brasão dir.
     ============================================== */
  .cabecalho-oficial {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 14px;
    padding-bottom: 6px;
    margin-bottom: 14px;
  }
  .cab-logo-seduc  { height: 52px; width: auto; object-fit: contain; }
  .cab-logo-escola { height: 78px; width: auto; object-fit: contain; }
  .cab-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    line-height: 1.4;
    color: #000;
    font-family: 'Times New Roman', Times, serif;
  }
  .cab-gov {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .cab-escola {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* ==============================================
     Rodapé — alinhado à direita, em múltiplas linhas
     (NÃO fixo, vai no fim do conteúdo)
     ============================================== */
  .rodape-oficial {
    margin-top: 60px;
    text-align: right;
    font-size: 9.5pt;
    color: #1a237e;
    line-height: 1.55;
    font-family: 'Times New Roman', Times, serif;
  }

  /* ==============================================
     Layout 2 colunas — Sidebar + ATA
     Linha vertical azul fina separa as colunas
     ============================================== */
  .ata-layout {
    display: grid;
    grid-template-columns: 30fr 70fr;
    gap: 18px;
    align-items: start;
  }

  /* SIDEBAR — sem caixa, só linha vertical à direita */
  .sidebar {
    border-right: 2px solid #1a237e;
    padding: 0 14px 0 4px;
    font-size: 9pt;
    color: #000;
  }
  .sidebar-titulo {
    color: #1a237e;
    font-weight: bold;
    font-size: 9.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding-top: 4px;
  }
  .sidebar-secao {
    color: #1a237e;
    font-weight: bold;
    font-size: 9.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 16px;
    margin-bottom: 8px;
  }
  .sid-item {
    margin-bottom: 8px;
    line-height: 1.35;
  }
  .sid-label {
    display: block;
    font-size: 7.5pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #1a237e;
    letter-spacing: 0.4px;
    margin-bottom: 1px;
  }
  .sid-valor {
    display: block;
    font-size: 9pt;
    color: #000;
    font-weight: bold;
    word-break: break-word;
  }
  .sid-medida-row {
    display: flex;
    gap: 6px;
    align-items: baseline;
    margin-bottom: 3px;
    font-size: 9pt;
  }
  .sid-medida-row .sid-medida-label {
    color: #1a237e;
    font-size: 8pt;
    font-weight: normal;
  }
  .sid-medida-row .sid-medida-valor {
    color: #000;
    font-weight: bold;
    font-size: 9pt;
  }

  /* COLUNA PRINCIPAL — ATA */
  .main-col {
    padding-top: 4px;
  }
  .ata-titulo-grande {
    font-size: 28pt;
    font-weight: bold;
    color: #1a237e;
    line-height: 1;
    margin-bottom: 2px;
    font-family: 'Times New Roman', Times, serif;
  }
  .ata-subtitulo {
    font-style: italic;
    color: #555;
    font-size: 10pt;
    border-bottom: 1px solid #c0a04a;
    padding-bottom: 4px;
    margin-bottom: 18px;
  }
  .ata-corpo {
    font-size: 11pt;
    line-height: 2;
    color: #000;
    white-space: pre-wrap;
    text-align: left;
    min-height: 150px;
    margin-bottom: 24px;
  }

  /* Assinaturas — label em cima, linha embaixo */
  .assinaturas-bloco {
    margin-top: 24px;
  }
  .sig-item {
    margin-bottom: 18px;
  }
  .sig-label {
    font-size: 8.5pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #444;
    letter-spacing: 0.5px;
    margin-bottom: 14px;
  }
  .sig-line {
    border-bottom: 1px solid #000;
    height: 0;
  }

  @media print {
    button { display: none !important; }
  }
`;
