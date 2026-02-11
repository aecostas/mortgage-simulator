export type InterestType = 'fixed' | 'variable';

export type InsurancePeriodType = 'annual' | 'monthly';

/** Tipo de amortización parcial: reduce plazo (misma cuota) o reduce cuota (mismo plazo). */
export type PartialAmortizationType = 'time' | 'capital';

/** Amortización parcial periódica: cada X meses se amortiza un importe; reduce tiempo o capital. */
export interface PartialAmortization {
  /** Cada cuántos meses se aplica (ej. 12 = anual) */
  periodMonths: number;
  /** Importe a amortizar en cada aplicación (€) */
  amount: number;
  /** 'time' = reducir plazo (misma cuota); 'capital' = reducir cuota (mismo plazo) */
  type: PartialAmortizationType;
}

/** Ítem genérico que se suma al pago (ej. comunidad, IBI). */
export interface ExtraItem {
  name: string;
  amount: number;
  period: InsurancePeriodType;
}

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
  // Ítems adicionales (nombre + cantidad, anual o mensual)
  extraItems?: ExtraItem[];
}

export interface MortgageConfig {
  name?: string; // Nombre de la hipoteca (opcional)
  principal: number; // Cantidad inicial
  months: number; // Duración total en meses
  periods: InterestPeriod[]; // Periodos con diferentes intereses
  /** Amortizaciones parciales periódicas (opcional) */
  partialAmortizations?: PartialAmortization[];
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

export interface AmortizationRow {
  month: number;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  period: number; // Número del periodo (1-based)
  /** Importe mensual de seguros (vida + hogar) en este mes, según el periodo */
  monthlyInsurance?: number;
  /** Importe mensual de ítems adicionales genéricos en este mes */
  monthlyExtraItems?: number;
  /** Amortización parcial aplicada este mes (€) */
  partialAmortization?: number;
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

/** Calcula el importe mensual de ítems adicionales para un periodo. */
function getMonthlyExtraItems(period: InterestPeriod): number {
  const items = period.extraItems ?? [];
  return items.reduce((sum, item) => {
    const monthly =
      (item.period ?? 'annual') === 'annual' ? item.amount / 12 : item.amount;
    return sum + monthly;
  }, 0);
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

/** Devuelve cuota mensual para amortizar balance en n meses a tipo mensual r. */
function monthlyPaymentFor(balance: number, monthlyRate: number, n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return balance * (1 + monthlyRate);
  return (
    (balance * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
    (Math.pow(1 + monthlyRate, n) - 1)
  );
}

/** Número de meses para amortizar balance con cuota fija y tipo r (aprox.). */
function monthsToPayOff(balance: number, monthlyPayment: number, monthlyRate: number): number {
  if (balance <= 0 || monthlyPayment <= balance * monthlyRate) return 0;
  const n =
    Math.log(monthlyPayment / (monthlyPayment - balance * monthlyRate)) /
    Math.log(1 + monthlyRate);
  return Math.max(1, Math.ceil(n));
}

function getPeriodForMonth(
  month: number,
  sortedPeriods: InterestPeriod[]
): { period: InterestPeriod; periodIndex: number; monthIndexInPeriod: number } | null {
  for (let i = 0; i < sortedPeriods.length; i++) {
    const p = sortedPeriods[i];
    if (month >= p.startMonth && month <= p.endMonth) {
      return {
        period: p,
        periodIndex: i,
        monthIndexInPeriod: month - p.startMonth,
      };
    }
  }
  return null;
}

/** Comprueba si en el mes dado aplica una amortización parcial y devuelve el importe a aplicar (acotado al balance). */
function getPartialAmortizationAmount(
  month: number,
  remainingBalance: number,
  partials: PartialAmortization[]
): number {
  let total = 0;
  for (const pa of partials) {
    if (pa.periodMonths <= 0 || pa.amount <= 0) continue;
    if (month % pa.periodMonths !== 0) continue;
    const extra = Math.min(pa.amount, remainingBalance - total);
    if (extra > 0) total += extra;
  }
  return total;
}

/** Indica si alguna amortización parcial aplicada en este mes es de tipo 'time' o 'capital'. */
function getPartialAmortizationTypes(
  month: number,
  partials: PartialAmortization[]
): { hasCapital: boolean; hasTime: boolean } {
  let hasCapital = false;
  let hasTime = false;
  for (const pa of partials) {
    if (pa.periodMonths <= 0 || pa.amount <= 0) continue;
    if (month % pa.periodMonths !== 0) continue;
    if (pa.type === 'capital') hasCapital = true;
    else hasTime = true;
  }
  return { hasCapital, hasTime };
}

export function calculateAmortization(
  config: MortgageConfig,
  euriborPaths?: EuriborPaths
): AmortizationRow[] {
  const { principal, months, periods } = config;
  const partials = config.partialAmortizations ?? [];

  if (periods.length === 0) {
    throw new Error('Debe haber al menos un periodo de interés');
  }

  const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);
  // Validar paths de Euribor para periodos variables
  for (let i = 0; i < sortedPeriods.length; i++) {
    const p = sortedPeriods[i];
    if ((p.interestType ?? 'fixed') === 'variable') {
      const end = Math.min(p.endMonth, months);
      const periodMonths = end - p.startMonth + 1;
      const path = euriborPaths?.[i];
      if (!path || path.length !== periodMonths) {
        throw new Error(
          `Periodo variable ${i + 1} requiere euriborPaths con ${periodMonths} valores`
        );
      }
    }
  }

  const schedule: AmortizationRow[] = [];
  let remainingBalance = principal;
  let effectiveEndMonth = months;
  let currentPayment: number | null = null;
  let currentPaymentValidUntilMonth = 0;

  let month = 1;
  while (month <= effectiveEndMonth && remainingBalance > 0.01) {
    const info = getPeriodForMonth(month, sortedPeriods);
    if (!info) break;
    const { period, periodIndex, monthIndexInPeriod } = info;
    const isVariable = (period.interestType ?? 'fixed') === 'variable';
    const path = isVariable ? euriborPaths?.[periodIndex] : undefined;
    const monthlyRate = isVariable
      ? getMonthlyRateVariable(
          path![monthIndexInPeriod],
          period.euriborDifferential ?? 0
        )
      : getMonthlyRateFixed(period);

    const remainingMonths = effectiveEndMonth - month + 1;
    if (
      currentPayment === null ||
      month > currentPaymentValidUntilMonth ||
      remainingMonths <= 0
    ) {
      if (remainingMonths <= 0) break;
      currentPayment = monthlyPaymentFor(remainingBalance, monthlyRate, remainingMonths);
      if (isVariable) {
        const nextRevision = month + Math.min(12, period.endMonth - month + 1);
        currentPaymentValidUntilMonth = nextRevision - 1;
      } else {
        currentPaymentValidUntilMonth = period.endMonth;
      }
    }

    let interestPayment = remainingBalance * monthlyRate;
    let principalPayment = currentPayment - interestPayment;
    // No amortizar más del balance pendiente (evita sobrepago en último mes)
    const cappedPrincipal = principalPayment > remainingBalance ? remainingBalance : principalPayment;
    principalPayment = cappedPrincipal;
    remainingBalance -= principalPayment;

    const partialAmount = getPartialAmortizationAmount(month, remainingBalance, partials);
    if (partialAmount > 0) {
      remainingBalance -= partialAmount;
      principalPayment += partialAmount;
      const { hasCapital, hasTime } = getPartialAmortizationTypes(month, partials);
      if (hasCapital && remainingBalance > 0.01) {
        const rem = effectiveEndMonth - month;
        if (rem > 0) {
          currentPayment = monthlyPaymentFor(remainingBalance, monthlyRate, rem);
          currentPaymentValidUntilMonth = month;
        }
      }
      if (hasTime && remainingBalance > 0.01 && currentPayment > remainingBalance * monthlyRate) {
        const n = monthsToPayOff(remainingBalance, currentPayment, monthlyRate);
        effectiveEndMonth = Math.min(effectiveEndMonth, month + n);
      }
    }

    // Pago mostrado: cuota estándar; si hubo cap usamos el importe real (interés + principal)
    const paymentToShow =
      cappedPrincipal < currentPayment - interestPayment
        ? interestPayment + principalPayment
        : currentPayment;
    schedule.push({
      month,
      payment: paymentToShow,
      principalPayment,
      interestPayment,
      remainingBalance: Math.max(0, remainingBalance),
      period: periodIndex + 1,
      monthlyInsurance: getMonthlyInsurance(period),
      monthlyExtraItems: getMonthlyExtraItems(period),
      partialAmortization: partialAmount > 0 ? partialAmount : undefined,
    });

    month++;
  }

  // Asegurar que todo el capital quede reflejado como pagado (evita que capital pagado < principal
  // cuando el plazo se acorta por amort. parcial "time" y hay redondeos o cambio de cuota)
  if (schedule.length > 0) {
    const lastRow = schedule[schedule.length - 1];
    if (lastRow.remainingBalance > 0) {
      lastRow.payment += lastRow.remainingBalance;
      lastRow.principalPayment += lastRow.remainingBalance;
      lastRow.remainingBalance = 0;
    }
  }

  return schedule;
}
