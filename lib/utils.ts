import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function getLocalTimeString() {
  const now = new Date();
  return now.toTimeString().split(' ')[0].substring(0, 5);
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  // Force Brazilian format DD/MM/YYYY for strings in YYYY-MM-DD format
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return day + '/' + month + '/' + year;
  }
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatDateTime(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatPhoneForWhatsApp(phone: string, studentName: string, turma?: string | null, faltasGeral?: number | null) {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length < 10) return '';
  const hasCountryCode = numbers.startsWith('55') && numbers.length >= 12;
  const baseUrl = 'https://wa.me/' + (hasCountryCode ? '' : '55') + numbers;

  const turmaStr = turma || 'N/A';
  const pctStr = faltasGeral != null ? String(faltasGeral) : '—';

  const message =
    `Olá, Srs. Pais ou Responsáveis pelo(a) estudante ${studentName}, da turma ${turmaStr}.\n` +
    `.\n` +
    `Identificamos que o(a) aluno(a) apresenta, atualmente, um índice de ${pctStr}% de faltas.\n` +
    `.\n` +
    `Preocupados com o desenvolvimento pedagógico e em cumprimento à Lei Estadual nº 11.236/2020 (que institui a Política de Busca Ativa Escolar em Mato Grosso pela SEDUC-MT), precisamos regularizar essa situação com urgência para evitar a perda do ano letivo.\n` +
    `.\n` +
    `Pedimos que compareça à secretaria/ coordenação da escola para conversarmos e justificarmos essas ausências.\n` +
    `.\n` +
    `A presença frequente na escola é um direito do estudante e um dever previsto por lei. Contamos com sua colaboração!\n` +
    `.\n` +
    `Atenciosamente, ponto focal BAE.`;

  return baseUrl + '?text=' + encodeURIComponent(message);
}
