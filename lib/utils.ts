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

export function formatPhoneForWhatsApp(phone: string, studentName: string) {
  // Remove tudo que não for número
  const numbers = phone.replace(/\D/g, '');
  // Se o número tiver menos de 10 dígitos, provavelmente não tem DDD, então não formata o link
  if (numbers.length < 10) return '';
  // Adiciona o código do DDI do Brasil (55) se não o usuário não colocou
  const hasCountryCode = numbers.startsWith('55') && numbers.length >= 12;
  const baseUrl = 'https://wa.me/' + (hasCountryCode ? '' : '55') + numbers;
  
  // Greeting depending on time
  const hour = new Date().getHours();
  let greeting = 'Bom dia';
  if (hour >= 12 && hour < 18) {
    greeting = 'Boa tarde';
  } else if (hour >= 18) {
    greeting = 'Boa noite';
  }

  const message = encodeURIComponent('Ol\u00e1, ' + greeting + '! Estou entrando em contato para falar sobre o aluno(a) ' + studentName + '.');
  return baseUrl + '?text=' + message;
}
