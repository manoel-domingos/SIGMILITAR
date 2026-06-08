import { describe, expect, it } from 'vitest'
import { jaccardScore, matchAluno, normalizeName, parsePct } from './parser'
import type { AlunoRecord, FICAICSVRow } from '@/types/ficai'

function ficaiRow(overrides: Partial<FICAICSVRow>): FICAICSVRow {
  return {
    Ano: '2026',
    DRE: 'DRE TGA',
    Municipio: 'Tangará da Serra',
    'Cod Lotacao': '1',
    Lotacao: 'Escola Teste',
    Turma: '7º A',
    'Cod Matriz': '10',
    Matriz: 'Ensino Fundamental',
    'Etapa Educacenso': 'Fundamental',
    Modalidade: 'Regular',
    Turno: 'Matutino',
    'Cod Matricula': '456',
    'Cod Aluno': '123',
    'Nome Aluno': 'Maria da Silva',
    Idade: '12',
    EJA: 'Não',
    'CH Anual': '800',
    'TF Geral': '20',
    'TF Geral Final': '20',
    'Perc Faltas Geral': '10%',
    'Perc Faltas Geral Final': '10%',
    'Qtde Lancamentos': '5',
    'Perc Faltas Lancamento': '10%',
    'Perc Faltas Lancamento Final': '10%',
    'TF 1 Bim': '5',
    'TF Final 1 Bim': '5',
    'Perc Faltas 1 Bim': '8%',
    'Perc Faltas Final 1 Bim': '8%',
    'TF 2 Bim': '15',
    'TF Final 2 Bim': '15',
    'Perc Faltas 2 Bim': '12%',
    'Perc Faltas Final 2 Bim': '12%',
    'Data Abertura Ficha Ficai': '',
    'Data Encaminhamento Conselho': '',
    ...overrides,
  }
}

const alunos: AlunoRecord[] = [
  {
    id: 'aluno-1',
    cod_aluno: 123,
    nome: 'Maria Eduarda da Silva',
    telefone: null,
    nome_responsavel: null,
    telefone_responsavel: null,
  },
  {
    id: 'aluno-2',
    cod_aluno: 999,
    nome: 'João Pedro Santos',
    telefone: '(65) 99999-0000',
    nome_responsavel: 'Mãe',
    telefone_responsavel: '(65) 99999-0000',
  },
]

describe('normalizeName', () => {
  it('remove acentos, pontuação e stopwords de nomes', () => {
    expect(normalizeName('João da Silva e Souza!')).toEqual(['JOAO', 'SILVA', 'SOUZA'])
  })
})

describe('jaccardScore', () => {
  it('calcula similaridade por interseção sobre união', () => {
    expect(jaccardScore(['MARIA', 'SILVA'], ['MARIA', 'EDUARDA', 'SILVA'])).toBeCloseTo(2 / 3)
  })

  it('retorna zero quando uma lista está vazia', () => {
    expect(jaccardScore([], ['MARIA'])).toBe(0)
  })
})

describe('matchAluno', () => {
  it('prioriza match exato por código do aluno', () => {
    const result = matchAluno(ficaiRow({ 'Cod Aluno': '123', 'Nome Aluno': 'Nome Divergente' }), alunos)

    expect(result.aluno?.id).toBe('aluno-1')
    expect(result.score).toBe(1)
  })

  it('usa similaridade de nome como fallback quando código não existe', () => {
    const result = matchAluno(ficaiRow({ 'Cod Aluno': '0', 'Nome Aluno': 'João Pedro dos Santos' }), alunos)

    expect(result.aluno?.id).toBe('aluno-2')
    expect(result.score).toBeGreaterThanOrEqual(0.45)
  })

  it('não faz match quando similaridade fica abaixo do limite', () => {
    const result = matchAluno(ficaiRow({ 'Cod Aluno': '0', 'Nome Aluno': 'Ana Clara Ferreira' }), alunos)

    expect(result.aluno).toBeNull()
  })
})

describe('parsePct', () => {
  it('converte porcentagem textual para número inteiro', () => {
    expect(parsePct(' 25% ')).toBe(25)
  })

  it('retorna null para valor vazio ou inválido', () => {
    expect(parsePct('')).toBeNull()
    expect(parsePct('abc')).toBeNull()
  })
})
