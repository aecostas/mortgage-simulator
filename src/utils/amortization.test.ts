import { describe, it, expect } from 'vitest';
import {
  calculateAmortization,
  type MortgageConfig,
  type PartialAmortization,
} from './amortization';

function makeSimpleConfig(partialAmortizations?: PartialAmortization[]): MortgageConfig {
  return {
    principal: 100_000,
    months: 120, // 10 años
    periods: [
      {
        startMonth: 1,
        endMonth: 120,
        interestType: 'fixed',
        annualInterestRate: 3.5,
        lifeInsuranceAmount: 0,
        homeInsuranceAmount: 0,
        extraItems: [],
      },
    ],
    partialAmortizations,
  };
}

describe('calculateAmortization with partial amortizations', () => {
  it('100K a 10 años, 1000€ amortización parcial anual en capital: total pagado >= principal', () => {
    const config = makeSimpleConfig([
      { periodMonths: 12, amount: 1000, type: 'capital' },
    ]);
    const schedule = calculateAmortization(config);

    const totalPrincipalPaid = schedule.reduce((s, row) => s + row.principalPayment, 0);
    const totalInterestPaid = schedule.reduce((s, row) => s + row.interestPayment, 0);
    const totalPartialPaid = schedule.reduce((s, row) => s + (row.partialAmortization ?? 0), 0);
    const totalCuota = schedule.reduce((s, row) => s + row.payment, 0);
    const totalPaidIncludingPartial = totalCuota + totalPartialPaid;

    expect(schedule.length).toBe(120);
    expect(totalPrincipalPaid).toBeCloseTo(100_000, 2);
    expect(totalPaidIncludingPartial).toBeGreaterThanOrEqual(100_000);
    expect(schedule[schedule.length - 1].remainingBalance).toBeLessThanOrEqual(0.01);
  });

  it('100K a 10 años, 1000€ amortización parcial anual en tiempo: total pagado >= principal', () => {
    const config = makeSimpleConfig([
      { periodMonths: 12, amount: 1000, type: 'time' },
    ]);
    const schedule = calculateAmortization(config);

    const totalPrincipalPaid = schedule.reduce((s, row) => s + row.principalPayment, 0);
    const totalPartialPaid = schedule.reduce((s, row) => s + (row.partialAmortization ?? 0), 0);
    const totalCuota = schedule.reduce((s, row) => s + row.payment, 0);
    const totalPaidIncludingPartial = totalCuota + totalPartialPaid;

    expect(totalPrincipalPaid).toBeCloseTo(100_000, 2);
    expect(totalPaidIncludingPartial).toBeGreaterThanOrEqual(100_000);
    expect(schedule[schedule.length - 1].remainingBalance).toBeLessThanOrEqual(0.01);
  });

  it('208K a 30 años, 1000€ cada 3 meses (capital): total pagado >= principal', () => {
    const config: MortgageConfig = {
      principal: 208_000,
      months: 360,
      periods: [
        {
          startMonth: 1,
          endMonth: 360,
          interestType: 'fixed',
          annualInterestRate: 3.5,
          lifeInsuranceAmount: 0,
          homeInsuranceAmount: 0,
          extraItems: [],
        },
      ],
      partialAmortizations: [{ periodMonths: 3, amount: 1000, type: 'capital' }],
    };
    const schedule = calculateAmortization(config);
    const totalCuota = schedule.reduce((s, row) => s + row.payment, 0);
    const totalPartial = schedule.reduce((s, row) => s + (row.partialAmortization ?? 0), 0);
    const totalPaid = totalCuota + totalPartial;
    const totalPrincipal = schedule.reduce((s, row) => s + row.principalPayment, 0);

    expect(totalPrincipal).toBeCloseTo(208_000, 2);
    expect(totalPaid).toBeGreaterThanOrEqual(208_000);
    expect(schedule[schedule.length - 1].remainingBalance).toBeLessThanOrEqual(0.01);
  });
});
