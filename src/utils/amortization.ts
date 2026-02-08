export type InterestType = 'fixed' | 'variable';

export type InsurancePeriodType = 'annual' | 'monthly';

export interface InterestPeriod {
  startMonth: number; // Mes inicial (1-based)
  endMonth: number; // Mes final (inclusive)
  interestType?: InterestType; // Fijo o variable (por defecto: fijo)
  annualInterestRate: number; // Interés anual (%) — solo para fijo
  // Solo para variable:
  euriborDifferential?: number; // Diferencial a sumar al Euribor (%)
  euriborMin?: number; // Mínimo Euribor (%)
  euriborMax?: number; // Máximo Euribor (%)
  euriborVolatility?: number; // 0 estable, 5 muy dinámico
  // Seguros aplicados solo en este periodo:
  lifeInsuranceAmount?: number;
  lifeInsurancePeriod?: InsurancePeriodType;
  homeInsuranceAmount?: number;
  homeInsurancePeriod?: InsurancePeriodType;
}

export interface MortgageConfig {
  name?: string; // Nombre de la hipoteca (opcional)
  principal: number; // Cantidad inicial
  months: number; // Duración total en meses
  periods: InterestPeriod[]; // Periodos con diferentes intereses
}

/** Paths de Euribor mensual (%) por índice de periodo (0-based). Solo para periodos variables. */
export type EuriborPaths = Record<number, number[]>;

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
  const stepScale = (volatility / 5) * range * 0.25;

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

export interface AmortizationRow {
  month: number;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  period: number; // Número del periodo (1-based)
  /** Importe mensual de seguros (vida + hogar) en este mes, según el periodo */
  monthlyInsurance?: number;
}

/** Calcula el importe mensual de seguros para un periodo (vida + hogar). */
function getMonthlyInsurance(period: InterestPeriod): number {
  const life = period.lifeInsuranceAmount ?? 0;
  const lifeMonthly =
    (period.lifeInsurancePeriod ?? 'annual') === 'annual' ? life / 12 : life;
  const home = period.homeInsuranceAmount ?? 0;
  const homeMonthly =
    (period.homeInsurancePeriod ?? 'annual') === 'annual' ? home / 12 : home;
  return lifeMonthly + homeMonthly;
}

function getMonthlyRateFixed(period: InterestPeriod): number {
  return period.annualInterestRate / 100 / 12;
}

function getMonthlyRateVariable(
  euriborPercent: number,
  differentialPercent: number
): number {
  return (euriborPercent + differentialPercent) / 100 / 12;
}

export function calculateAmortization(
  config: MortgageConfig,
  euriborPaths?: EuriborPaths
): AmortizationRow[] {
  const { principal, months, periods } = config;

  if (periods.length === 0) {
    throw new Error('Debe haber al menos un periodo de interés');
  }

  const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);
  const schedule: AmortizationRow[] = [];
  let remainingBalance = principal;

  for (let periodIndex = 0; periodIndex < sortedPeriods.length; periodIndex++) {
    const period = sortedPeriods[periodIndex];
    const periodStartMonth = period.startMonth;
    const periodEndMonth = Math.min(period.endMonth, months);
    const periodMonths = periodEndMonth - periodStartMonth + 1;

    if (periodMonths <= 0) continue;

    const totalRemainingMonths = months - periodStartMonth + 1;
    const isVariable = (period.interestType ?? 'fixed') === 'variable';
    const path = isVariable ? euriborPaths?.[periodIndex] : undefined;

    if (isVariable && (!path || path.length !== periodMonths)) {
      throw new Error(
        `Periodo variable ${periodIndex + 1} requiere euriborPaths con ${periodMonths} valores`
      );
    }

    if (!isVariable) {
      // Periodo fijo: lógica actual
      const monthlyRate = getMonthlyRateFixed(period);
      let monthlyPayment: number;
      if (totalRemainingMonths === 1) {
        monthlyPayment = remainingBalance * (1 + monthlyRate);
      } else {
        monthlyPayment =
          (remainingBalance *
            (monthlyRate * Math.pow(1 + monthlyRate, totalRemainingMonths))) /
          (Math.pow(1 + monthlyRate, totalRemainingMonths) - 1);
      }
      for (let m = 0; m < periodMonths; m++) {
        const month = periodStartMonth + m;
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        schedule.push({
          month,
          payment: monthlyPayment,
          principalPayment,
          interestPayment,
          remainingBalance: Math.max(0, remainingBalance),
          period: periodIndex + 1,
          monthlyInsurance: getMonthlyInsurance(period),
        });
      }
    } else {
      // Periodo variable: revisión anual (cada 12 meses se recalcula la cuota)
      const differential = period.euriborDifferential ?? 0;
      let m = 0;
      while (m < periodMonths) {
        const blockStart = m;
        const blockMonths = Math.min(12, periodMonths - m);
        const euriborAtRevision = path![blockStart];
        const annualRate = euriborAtRevision + differential;
        const monthlyRate = annualRate / 100 / 12;
        const remainingFromHere = totalRemainingMonths - m;

        let monthlyPayment: number;
        if (remainingFromHere === 1) {
          monthlyPayment = remainingBalance * (1 + monthlyRate);
        } else {
          monthlyPayment =
            (remainingBalance *
              (monthlyRate * Math.pow(1 + monthlyRate, remainingFromHere))) /
            (Math.pow(1 + monthlyRate, remainingFromHere) - 1);
        }

        for (let k = 0; k < blockMonths; k++) {
          const monthIndex = m + k;
          const month = periodStartMonth + monthIndex;
          const euriborK = path![monthIndex];
          const rateK = getMonthlyRateVariable(euriborK, differential);
          const interestPayment = remainingBalance * rateK;
          const principalPayment = monthlyPayment - interestPayment;
          remainingBalance -= principalPayment;
          schedule.push({
            month,
            payment: monthlyPayment,
            principalPayment,
            interestPayment,
            remainingBalance: Math.max(0, remainingBalance),
            period: periodIndex + 1,
            monthlyInsurance: getMonthlyInsurance(period),
          });
        }
        m += blockMonths;
      }
    }

    const isLastPeriod = periodIndex === sortedPeriods.length - 1;
    if (isLastPeriod && schedule.length > 0) {
      const lastRow = schedule[schedule.length - 1];
      if (lastRow.remainingBalance > 0.01) {
        lastRow.payment += lastRow.remainingBalance;
        lastRow.principalPayment += lastRow.remainingBalance;
        lastRow.remainingBalance = 0;
      }
    }
  }

  return schedule;
}
