import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const schoolId = formData.get('school_id') as string;

    if (!file || !schoolId) {
      return NextResponse.json(
        { error: 'Arquivo e school_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Ler arquivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

    // Ignorar header (primeira linha)
    const dataRows = rows.slice(1);
    const results = { success: 0, errors: [] as string[] };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row[0]) continue; // Ignorar linhas vazias

      try {
        const nome = String(row[0] || '').trim();
        const turma = String(row[1] || '').trim();
        const cpf = String(row[2] || '').trim();
        const dataNascimento = String(row[3] || '').trim();
        const endereco = String(row[4] || '').trim();
        const resp1Nome = String(row[5] || '').trim();
        const resp1Tel = String(row[6] || '').trim();
        const resp2Nome = String(row[7] || '').trim();
        const resp2Tel = String(row[8] || '').trim();
        const observacoes = String(row[9] || '').trim();

        if (!nome) {
          results.errors.push(`Linha ${i + 2}: Nome é obrigatório`);
          continue;
        }

        // Preparar contatos
        const contacts = [];
        if (resp1Nome) {
          contacts.push({ name: resp1Nome, phone: resp1Tel });
        }
        if (resp2Nome) {
          contacts.push({ name: resp2Nome, phone: resp2Tel });
        }

        // Converter data de DD/MM/YYYY para YYYY-MM-DD
        let birthDate = null;
        if (dataNascimento) {
          const [day, month, year] = dataNascimento.split('/');
          if (day && month && year) {
            birthDate = `${year}-${month}-${day}`;
          }
        }

        // Inserir aluno no banco
        const { error } = await supabase.from('students').insert({
          name: nome,
          class: turma || null,
          cpf: cpf || null,
          birth_date: birthDate,
          address: endereco || null,
          contacts: contacts.length > 0 ? contacts : null,
          observation: observacoes || null,
          school_id: schoolId,
        });

        if (error) {
          results.errors.push(`Linha ${i + 2}: ${error.message}`);
        } else {
          results.success++;
        }
      } catch (err: any) {
        results.errors.push(`Linha ${i + 2}: ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[API] Import error:', error);
    return NextResponse.json(
      { error: 'Erro ao importar arquivo' },
      { status: 500 }
    );
  }
}
