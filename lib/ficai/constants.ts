export const FICAI_THRESHOLDS = { necessaria: 10, grave: 15 } as const

export function deriveFicaiFlags(perc: number | null, ficaiAberto: boolean) {
  const alerta = perc !== null && perc >= FICAI_THRESHOLDS.necessaria
  const alertaGrave = perc !== null && perc >= FICAI_THRESHOLDS.grave
  const ficaiNecessaria = alerta && !ficaiAberto
  return { alerta, alertaGrave, ficaiNecessaria }
}
