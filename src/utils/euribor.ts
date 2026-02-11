import type { InterestPeriod, EuriborPaths } from './amortization';

/**
 * Serie de valores de Euribor para visualización en gráficos.
 */
export interface EuriborSeries {
  /** Mes global de inicio del periodo (1-based) */
  startMonth: number;
  /** Valores de Euribor (%) por mes del periodo */
  values: number[];
}

/**
 * Genera un path aleatorio de Euribor mensual (%) para un periodo variable.
 * @param periodMonths Número de meses del periodo
 * @param euriborMin Mínimo Euribor (%)
 * @param euriborMax Máximo Euribor (%)
 * @param volatility 0 estable, 5 muy dinámico
 * @param seed Opcional: semilla para reproducibilidad
 */
export function generateEuriborPath(
  periodMonths: number,
  euriborMin: number,
  euriborMax: number,
  volatility: number,
  seed?: number
): number[] {
  const min = Math.min(euriborMin, euriborMax);
  const max = Math.max(euriborMin, euriborMax);
  const range = max - min;
  // Factor reducido para que "baja" volatilidad sea suave; escala cuadrática suaviza más los valores bajos
  const volNorm = volatility / 5;
  const stepScale = volNorm * volNorm * range * 0.15;

  let rng: () => number;
  if (seed != null) {
    let s = seed;
    rng = () => {
      s = (s * 1103515245 + 12345) & 0x7fff_ffff;
      return s / 0x7fff_ffff;
    };
  } else {
    rng = () => Math.random();
  }

  const path: number[] = [];
  let current = min + range * rng();
  for (let i = 0; i < periodMonths; i++) {
    if (volatility === 0) {
      path.push(current);
      continue;
    }
    const step = (2 * rng() - 1) * stepScale;
    current = Math.max(min, Math.min(max, current + step));
    path.push(current);
  }
  return path;
}

/**
 * Parámetros para generar series de preview de Euribor.
 */
interface GeneratePreviewSeriesParams {
  /** Periodos de interés ordenados por startMonth */
  sortedPeriods: InterestPeriod[];
  /** Valores de Euribor guardados previamente (índice de periodo -> valores) */
  savedPaths?: EuriborPaths;
}

/**
 * Genera series de preview de Euribor para visualización.
 * Usa los valores guardados si existen y coinciden con la longitud del periodo,
 * o genera nuevos valores con semilla fija para consistencia.
 */
export function generateEuriborPreviewSeries({
  sortedPeriods,
  savedPaths,
}: GeneratePreviewSeriesParams): EuriborSeries[] {
  const series: EuriborSeries[] = [];

  for (let i = 0; i < sortedPeriods.length; i++) {
    const period = sortedPeriods[i];
    if (period.interestType === 'variable') {
      const periodMonths = period.endMonth - period.startMonth + 1;
      let values: number[];

      // Si hay valores guardados para este periodo, usarlos
      if (savedPaths && savedPaths[i] && savedPaths[i].length === periodMonths) {
        values = savedPaths[i];
      } else {
        // Si no, generar nuevos con semilla fija para consistencia
        const euriborMin = period.euriborMin ?? 2;
        const euriborMax = period.euriborMax ?? 5;
        const volatility = period.euriborVolatility ?? 2;
        const seed = period.startMonth * 1000 + period.endMonth;
        values = generateEuriborPath(
          periodMonths,
          euriborMin,
          euriborMax,
          volatility,
          seed,
        );
      }

      series.push({
        startMonth: period.startMonth,
        values,
      });
    }
  }

  return series;
}

/**
 * Parámetros para recalcular valores de Euribor de un periodo.
 */
interface RecalculateEuriborParams {
  /** Periodo de interés */
  period: InterestPeriod;
}

/**
 * Recalcula los valores de Euribor para un periodo específico.
 * Genera nuevos valores aleatorios sin semilla.
 * 
 * @returns Array de valores de Euribor (%) para cada mes del periodo
 */
export function recalculateEuriborForPeriod({
  period,
}: RecalculateEuriborParams): number[] {
  if (period.interestType !== 'variable') {
    throw new Error('Solo se puede recalcular Euribor para periodos variables');
  }

  const periodMonths = period.endMonth - period.startMonth + 1;
  const euriborMin = period.euriborMin ?? 2;
  const euriborMax = period.euriborMax ?? 5;
  const volatility = period.euriborVolatility ?? 2;

  // Generar nuevos valores sin semilla (aleatorios)
  return generateEuriborPath(
    periodMonths,
    euriborMin,
    euriborMax,
    volatility,
  );
}

/**
 * Convierte series de Euribor a formato EuriborPaths.
 * Útil para convertir desde el formato de preview al formato usado en cálculos.
 */
export function convertEuriborSeriesToPaths(
  series: EuriborSeries[],
  sortedPeriods: InterestPeriod[],
): EuriborPaths {
  const paths: EuriborPaths = {};

  for (let i = 0; i < sortedPeriods.length; i++) {
    const period = sortedPeriods[i];
    if (period.interestType === 'variable') {
      const seriesItem = series.find((s) => s.startMonth === period.startMonth);
      if (seriesItem) {
        paths[i] = seriesItem.values;
      }
    }
  }

  return paths;
}
