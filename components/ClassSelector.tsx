'use client';

/**
 * ClassSelector — seletor de turma adaptável por tenant.
 *
 * - Tenant com turmas simples (joaobatista, tangara):
 *   Dois <select> lado a lado: [ano] [letra] → className = "1º Ano A"
 *
 * - Tenant com turmas compostas (heliodoro):
 *   Um <select> único com todas as combinações: "1º Ano A-LING", "2º Ano B-CHS", "EPT-AUTOMAC", etc.
 */

import React from 'react';
import { useTenantConfig } from '@/lib/useTenantConfig';

interface ClassSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  selectClassName?: string;
}

export function ClassSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  selectClassName = '',
}: ClassSelectorProps) {
  const { grades, classLetters, allClassNames, hasCompoundClasses, standaloneClasses } = useTenantConfig();

  const baseSelect = `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60 ${selectClassName}`;

  if (hasCompoundClasses) {
    // ── Modo composto: um único select com todas as turmas ──────────────────
    // Agrupa por ano para facilitar a leitura
    const byGrade: Record<string, string[]> = {};
    const standalone: string[] = [];

    for (const name of allClassNames) {
      const gradeMatch = grades.find(g => name.startsWith(g + ' '));
      if (gradeMatch) {
        if (!byGrade[gradeMatch]) byGrade[gradeMatch] = [];
        byGrade[gradeMatch].push(name);
      } else {
        standalone.push(name);
      }
    }

    return (
      <select
        required={required}
        disabled={disabled}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full ${baseSelect}`}
      >
        <option value="">Selecione a turma</option>
        {grades.map(grade => {
          const options = byGrade[grade];
          if (!options?.length) return null;
          return (
            <optgroup key={grade} label={grade}>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt.replace(`${grade} `, '')}</option>
              ))}
            </optgroup>
          );
        })}
        {standalone.length > 0 && (
          <optgroup label="EPT / Cursos Técnicos">
            {standalone.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </optgroup>
        )}
      </select>
    );
  }

  // ── Modo simples: dois selects (ano + letra) ──────────────────────────────
  const currentGrade = value.replace(/ [A-Z]$/, '').trim() || grades[0];
  const currentLetter = value.match(/ ([A-Z])$/i)?.[1] || classLetters[0];

  const handleGradeChange = (newGrade: string) => {
    onChange(`${newGrade} ${currentLetter}`);
  };

  const handleLetterChange = (newLetter: string) => {
    onChange(`${currentGrade} ${newLetter}`);
  };

  return (
    <div className="flex gap-2">
      <select
        required={required}
        disabled={disabled}
        value={currentGrade}
        onChange={e => handleGradeChange(e.target.value)}
        className={`w-2/3 ${baseSelect}`}
      >
        {grades.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
      <select
        required={required}
        disabled={disabled}
        value={currentLetter}
        onChange={e => handleLetterChange(e.target.value)}
        className={`w-1/3 ${baseSelect}`}
      >
        {classLetters.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}
