import { describe, it, expect } from 'vitest';
import { calculateAmortization } from './amortization';

describe('calculateAmortization', () => {
  describe('periodo único', () => {
    it('calcula la tabla de amortización con un solo tramo', () => {
      const config = {
        principal: 100_000,
        months: 12,
        periods: [{ startMonth: 1, endMonth: 12, interestType: 'fixed', annualInterestRate: 3.5 }],
      };

      const schedule = calculateAmortization(config);

      expect(schedule).toHaveLength(12);

      // Primera fila: mes 1
      expect(schedule[0].month).toBe(1);
      expect(schedule[0].period).toBe(1);
      expect(schedule[0].interestPayment).toBeCloseTo(100_000 * (0.035 / 12), 2);
      expect(schedule[0].principalPayment).toBeGreaterThan(0);
      expect(schedule[0].payment).toBe(schedule[0].interestPayment + schedule[0].principalPayment);

      // Todas las cuotas del periodo único deben ser iguales
      const payment = schedule[0].payment;
      schedule.forEach((row) => {
        expect(row.payment).toBeCloseTo(payment, 2);
        expect(row.period).toBe(1);
      });

      // Balance final debe ser 0 (o redondeo por coma flotante)
      expect(schedule[11].remainingBalance).toBeCloseTo(0, 2);

      // Suma de principal amortizado = principal inicial
      const totalPrincipal = schedule.reduce((sum, row) => sum + row.principalPayment, 0);
      expect(totalPrincipal).toBeCloseTo(config.principal, 2);

      // Balance decrece mes a mes
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].remainingBalance).toBeLessThanOrEqual(schedule[i - 1].remainingBalance);
      }
    });

    it('lanza error si no hay periodos', () => {
      expect(() =>
        calculateAmortization({
          principal: 100_000,
          months: 12,
          periods: [],
        })
      ).toThrow('Debe haber al menos un periodo de interés');
    });
  });

  describe('dos periodos', () => {
    it('calcula la tabla con dos tramos de interés distintos', () => {
      const config = {
        principal: 100_000,
        months: 12,
        periods: [
          { startMonth: 1, endMonth: 6, interestType: 'fixed', annualInterestRate: 3 },
          { startMonth: 7, endMonth: 12, interestType: 'fixed', annualInterestRate: 4 },
        ],
      };

      const schedule = calculateAmortization(config);

      expect(schedule).toHaveLength(12);

      // Tramo 1: meses 1-6, cuota constante
      const paymentPeriod1 = schedule[0].payment;
      for (let i = 0; i < 6; i++) {
        expect(schedule[i].month).toBe(i + 1);
        expect(schedule[i].period).toBe(1);
        expect(schedule[i].payment).toBeCloseTo(paymentPeriod1, 2);
      }

      // Tramo 2: meses 7-12, otra cuota (mayor si el tipo sube)
      const balanceAfterPeriod1 = schedule[5].remainingBalance;
      expect(balanceAfterPeriod1).toBeGreaterThan(0);

      const paymentPeriod2 = schedule[6].payment;
      for (let i = 6; i < 12; i++) {
        expect(schedule[i].month).toBe(i + 1);
        expect(schedule[i].period).toBe(2);
        expect(schedule[i].payment).toBeCloseTo(paymentPeriod2, 2);
      }

      // Balance final 0 (o redondeo por coma flotante)
      expect(schedule[11].remainingBalance).toBeCloseTo(0, 2);

      // Suma de principal = principal inicial
      const totalPrincipal = schedule.reduce((sum, row) => sum + row.principalPayment, 0);
      expect(totalPrincipal).toBeCloseTo(config.principal, 2);
    });

    it('el primer tramo no cambia al cambiar solo el interés del segundo', () => {
      const baseConfig = {
        principal: 100_000,
        months: 12,
        periods: [
          { startMonth: 1, endMonth: 6, interestType: 'fixed', annualInterestRate: 3 },
          { startMonth: 7, endMonth: 12, interestType: 'fixed', annualInterestRate: 4 },
        ],
      };

      const scheduleA = calculateAmortization(baseConfig);
      const firstPeriodRowsA = scheduleA.slice(0, 6);

      // Mismo primer tramo, distinto interés en el segundo
      const configB = {
        ...baseConfig,
        periods: [
          { startMonth: 1, endMonth: 6, interestType: 'fixed', annualInterestRate: 3 },
          { startMonth: 7, endMonth: 12, interestType: 'fixed', annualInterestRate: 5 },
        ],
      };
      const scheduleB = calculateAmortization(configB);
      const firstPeriodRowsB = scheduleB.slice(0, 6);

      // Las filas del primer tramo deben ser idénticas
      expect(firstPeriodRowsA).toHaveLength(6);
      expect(firstPeriodRowsB).toHaveLength(6);
      for (let i = 0; i < 6; i++) {
        expect(firstPeriodRowsB[i].payment).toBeCloseTo(firstPeriodRowsA[i].payment, 2);
        expect(firstPeriodRowsB[i].principalPayment).toBeCloseTo(firstPeriodRowsA[i].principalPayment, 2);
        expect(firstPeriodRowsB[i].interestPayment).toBeCloseTo(firstPeriodRowsA[i].interestPayment, 2);
        expect(firstPeriodRowsB[i].remainingBalance).toBeCloseTo(firstPeriodRowsA[i].remainingBalance, 2);
      }

      // El segundo tramo sí debe ser distinto (cuota mayor con 5 %)
      expect(scheduleB[6].payment).toBeGreaterThan(scheduleA[6].payment);
    });
  });
})
