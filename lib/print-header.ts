/**
 * lib/print-header.ts
 * Cabeçalho e rodapé oficiais da E.E. Cívico-Militar Prof. João Batista.
 * Use em todos os documentos impressos do sistema.
 */

export const SCHOOL_HEADER_HTML = `
  <div class="cabecalho-oficial">
    <div class="cabecalho-topo">GOVERNO DO ESTADO DE MATO GROSSO</div>
    <div class="cabecalho-topo">SECRETARIA DE ESTADO DE EDUCAÇÃO</div>
    <div class="cabecalho-escola">ESCOLA ESTADUAL CÍVICO-MILITAR</div>
    <div class="cabecalho-escola">PROF. JOÃO BATISTA</div>
  </div>
`;

export const SCHOOL_FOOTER_HTML = `
  <div class="rodape-oficial">
    E.E Cívico-Militar Prof. João Batista<br/>
    (65) 3329-1021 | (65) 99944-6304<br/>
    Av. Ismael José do Nascimento nº 892-N Jardim Europa — CEP 78.300-152 – TANGARÁ DA SERRA/MT<br/>
    escola.16020@edu.mt.gov.br
  </div>
`;

export const SCHOOL_HEADER_CSS = `
  .cabecalho-oficial {
    text-align: center;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 10px 0;
    margin-bottom: 20px;
    line-height: 1.5;
  }
  .cabecalho-topo {
    font-size: 10pt;
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .cabecalho-escola {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .rodape-oficial {
    margin-top: 32px;
    border-top: 1px solid #ccc;
    padding-top: 10px;
    text-align: center;
    font-size: 8.5pt;
    color: #555;
    line-height: 1.7;
  }
`;
