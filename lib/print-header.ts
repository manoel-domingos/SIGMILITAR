/**
 * lib/print-header.ts
 * Cabeçalho e rodapé oficiais — E.E. Cívico-Militar Prof. João Batista.
 * Logos: /logo-escola.png (brasão) | /logo-seduc-mt.png (SEDUC + Governo MT)
 * Margens via @page: 0.5cm top/bottom, 1cm left/right.
 */

const origin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : '';

export const getSchoolHeaderHTML = (): string => `
<div class="cabecalho-oficial">
  <img class="cab-logo-left"  src="${origin()}/logo-escola.png"   alt="Logo EECM Prof. Joao Batista" />
  <div class="cab-center">
    <span class="cab-gov">GOVERNO DO ESTADO DE MATO GROSSO</span>
    <span class="cab-gov">SECRETARIA DE ESTADO DE EDUCAÇÃO — SEDUC/MT</span>
    <span class="cab-escola">ESCOLA ESTADUAL CÍVICO-MILITAR</span>
    <span class="cab-escola">PROF. JOÃO BATISTA</span>
  </div>
  <img class="cab-logo-right" src="${origin()}/logo-seduc-mt.png" alt="Logo SEDUC e Governo MT" />
</div>
`;

export const getSchoolFooterHTML = (): string => `
<div class="rodape-oficial">
  <span class="rod-nome">E.E Cívico-Militar Prof. João Batista</span>
  <span class="rod-sep">|</span>
  <span class="rod-end">Av. Ismael José do Nascimento nº 892-N Jardim Europa — CEP 78.300-152 – TANGARÁ DA SERRA/MT</span>
  <span class="rod-sep">|</span>
  <span class="rod-tel">(65) 3329-1021 / (65) 99944-6304</span>
  <span class="rod-sep">|</span>
  <span class="rod-email">escola.16020@edu.mt.gov.br</span>
</div>
`;

// Mantém os exports antigos como alias para não quebrar imports existentes
export const SCHOOL_HEADER_HTML: string = '';   // substituído por getSchoolHeaderHTML()
export const SCHOOL_FOOTER_HTML: string = '';   // substituído por getSchoolFooterHTML()

export const SCHOOL_HEADER_CSS = `
  /* Força orientação retrato (A4 vertical) e margens proporcionais */
  @page {
    size: A4 portrait;
    margin: 0.5cm 1cm;
  }

  html, body {
    width: 100%;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Cabeçalho — proporcional, com logos harmonizadas */
  .cabecalho-oficial {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    border-bottom: 2.5px solid #1a237e;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .cab-logo-left  { height: 78px; width: auto; object-fit: contain; }
  .cab-logo-right { height: 56px; width: auto; object-fit: contain; }
  .cab-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    line-height: 1.45;
  }
  .cab-gov    { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #444; letter-spacing: 0.3px; }
  .cab-escola { font-size: 12.5pt; font-weight: bold; text-transform: uppercase; color: #1a237e; letter-spacing: 1px; margin-top: 2px; }

  /* Rodapé — fixo no fundo */
  .rodape-oficial {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px 8px;
    border-top: 1px solid #bbb;
    padding: 4px 1cm;
    font-size: 7pt;
    color: #555;
    background: #fff;
    line-height: 1.4;
  }
  .rod-nome  { font-weight: bold; white-space: nowrap; }
  .rod-sep   { color: #aaa; }
  .rod-end   { text-align: center; }
  .rod-tel, .rod-email { white-space: nowrap; }

  /* Espaço para o rodapé não sobrepor conteúdo */
  body { padding-bottom: 30px; }

  /* ==============================================
     Layout 2 colunas (sidebar + ATA)
     Proporcional via grid: 28% sidebar / 72% ATA
     ============================================== */
  .ata-layout {
    display: grid;
    grid-template-columns: 28fr 72fr;
    gap: 12px;
    align-items: start;
  }
`;

