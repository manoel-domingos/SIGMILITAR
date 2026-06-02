import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [
        'Nome do Aluno',
        'Turma',
        'CPF',
        'Data de Nascimento (DD/MM/YYYY)',
        'Endereço',
        'Responsável 1 - Nome',
        'Responsável 1 - Telefone',
        'Responsável 2 - Nome',
        'Responsável 2 - Telefone',
        'Observações',
        'Sob Laudo PAED/CID',
      ],
      // Exemplo de linha
      [
        'João Silva Santos',
        '1º Ano A',
        '123.456.789-00',
        '10/05/2008',
        'Rua das Flores, 123 - Apto 45',
        'Maria Silva Santos',
        '(11) 98765-4321',
        'Pedro Silva Santos',
        '(11) 97654-3210',
        'Aluno transferido de outra escola',
        'F90 - TDAH',
      ],
    ]);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 30 },
      { wch: 20 },
    ];

    // Congelar primeira linha (header)
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, 'Alunos');

    // Gerar arquivo Excel
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_alunos.xlsx"',
      },
    });
  } catch (error) {
    console.error('[API] Template generation error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar template' },
      { status: 500 }
    );
  }
}
