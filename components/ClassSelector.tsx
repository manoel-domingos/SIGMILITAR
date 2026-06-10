'use client';

/**
 * ClassSelector — seletor de turma adaptável por tenant.
 *
 * - Tenant com turmas simples (joaobatista, tangara):
 *   [select ano] [input/datalist letra] → className = "1º Ano A"
 *   Novos valores digitados persistem em school_settings.custom_class_letters (Supabase).
 *
 * - Tenant com turmas compostas (heliodoro):
 *   Um <select> único com todas as combinações.
 */

import React from 'react';
import { useTenantConfig } from '@/lib/useTenantConfig';
import { useAppContext } from '@/lib/store';

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
  const { grades, classLetters, allClassNames, hasCompoundClasses } = useTenantConfig();
  const { customClassLetters, addCustomClassLetter } = useAppContext();

  const baseSelect = `bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60 ${selectClassName}`;

  if (hasCompoundClasses) {
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

  // ── Modo simples: select ano + input livre letra ──────────────────────────
  const currentGrade = value.replace(/ [^ ]+$/, '').trim() || grades[0] || '';
  const currentLetter = value.slice(currentGrade.length).trim() || classLetters[0] || '';

  const handleGradeChange = (newGrade: string) => {
    onChange(`${newGrade} ${currentLetter}`);
  };

  const handleLetterChange = (newLetter: string) => {
    onChange(`${currentGrade} ${newLetter.slice(0, 8)}`);
  };

  const handleLetterBlur = (val: string) => {
    const trimmed = val.trim().toUpperCase().slice(0, 8);
    if (!trimmed) return;
    const allKnown = [...classLetters, ...customClassLetters];
    if (!allKnown.includes(trimmed)) {
      addCustomClassLetter(trimmed);
    }
    onChange(`${currentGrade} ${trimmed}`);
  };

  const allLetterOptions = Array.from(new Set([...classLetters, ...customClassLetters]));
  const datalistId = 'class-letters-datalist';

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
      <input
        type="text"
        list={datalistId}
        required={required}
        disabled={disabled}
        value={currentLetter}
        maxLength={8}
        placeholder="Turma"
        onChange={e => handleLetterChange(e.target.value)}
        onBlur={e => handleLetterBlur(e.target.value)}
        className={`w-1/3 ${baseSelect} cursor-text`}
        style={{ minWidth: 0 }}
      />
      <datalist id={datalistId}>
        {allLetterOptions.map(v => (
          <option key={v} value={v} />
        ))}
      </datalist>
    </div>
  );
}
