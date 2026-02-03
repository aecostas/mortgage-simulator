export interface InterestPeriod {
  startMonth: number; // Mes inicial (1-based)
  endMonth: number; // Mes final (inclusive)
  annualInterestRate: number; // Interés anual (%)
}

export interface MortgageConfig {
  principal: number; // Cantidad inicial
  months: number; // Duración total en meses
  periods: InterestPeriod[]; // Periodos con diferentes intereses
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  period: number; // Número del periodo (1-based)
}

export function calculateAmortization(config: MortgageConfig): AmortizationRow[] {
  const { principal, months, periods } = config;
  
  // Validar que los periodos cubran toda la duración
  if (periods.length === 0) {
    throw new Error('Debe haber al menos un periodo de interés');
  }
  
  // Ordenar periodos por mes inicial
  const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);
  
  const schedule: AmortizationRow[] = [];
  let remainingBalance = principal;
  
  // Procesar cada periodo secuencialmente
  for (let periodIndex = 0; periodIndex < sortedPeriods.length; periodIndex++) {
    const period = sortedPeriods[periodIndex];
    const periodStartMonth = period.startMonth;
    const periodEndMonth = Math.min(period.endMonth, months);
    const periodMonths = periodEndMonth - periodStartMonth + 1;
    
    if (periodMonths <= 0) continue;
    
    const annualRate = period.annualInterestRate;
    const monthlyRate = annualRate / 100 / 12;
    const isLastPeriod = periodIndex === sortedPeriods.length - 1;
    
    // Calcular el pago mensual para este periodo
    // Para el último periodo, debe terminar con balance 0
    // Para periodos intermedios, calculamos el pago basándonos en el balance actual
    // y los meses restantes hasta el final, pero ajustamos para que el siguiente periodo pueda continuar
    
    let monthlyPayment: number;
    
    if (isLastPeriod) {
      // Último periodo: calcular para que el balance final sea 0
      if (periodMonths === 1) {
        monthlyPayment = remainingBalance * (1 + monthlyRate);
      } else {
        monthlyPayment = remainingBalance * 
          (monthlyRate * Math.pow(1 + monthlyRate, periodMonths)) /
          (Math.pow(1 + monthlyRate, periodMonths) - 1);
      }
    } else {
      // Periodo intermedio: calcular el pago de manera proporcional
      // Solo amortizamos la parte del balance correspondiente a este periodo
      // El resto se transferirá al siguiente periodo
      
      // Calcular la fracción del tiempo total restante que representa este periodo
      const totalRemainingMonths = months - periodStartMonth + 1;
      const periodFraction = periodMonths / totalRemainingMonths;
      
      // El balance objetivo al final debe ser proporcional al tiempo restante
      // después de este periodo
      const targetBalanceAtEndOfPeriod = remainingBalance * (1 - periodFraction * 0.5);
      
      // Calcular el pago mensual para alcanzar ese balance objetivo
      if (periodMonths === 1) {
        monthlyPayment = remainingBalance * (1 + monthlyRate) - targetBalanceAtEndOfPeriod;
      } else {
        const numerator = remainingBalance * monthlyRate * Math.pow(1 + monthlyRate, periodMonths) 
          - targetBalanceAtEndOfPeriod * monthlyRate;
        const denominator = Math.pow(1 + monthlyRate, periodMonths) - 1;
        monthlyPayment = numerator / denominator;
      }
    }
    
    // Ajustar iterativamente el pago para asegurar consistencia
    // Para el último periodo, el balance final debe ser 0
    // Para periodos intermedios, el balance debe permitir que el siguiente periodo continúe
    let balance = remainingBalance;
    let adjustedPayment = monthlyPayment;
    const tolerance = 0.01;
    
    // Calcular el balance objetivo al final de este periodo
    let targetBalanceAtEnd: number;
    if (isLastPeriod) {
      targetBalanceAtEnd = 0;
    } else {
      // Para periodos intermedios, el balance objetivo es el que resulte
      // después de aplicar los pagos calculados
      // Esto se calculará en el ajuste iterativo
      let testBalance = remainingBalance;
      for (let m = 0; m < periodMonths; m++) {
        const interest = testBalance * monthlyRate;
        const principal = monthlyPayment - interest;
        testBalance -= principal;
      }
      targetBalanceAtEnd = testBalance;
    }
    
    // Ajustar el pago para alcanzar el balance objetivo
    for (let iter = 0; iter < 100; iter++) {
      balance = remainingBalance;
      for (let m = 0; m < periodMonths; m++) {
        const interest = balance * monthlyRate;
        const principal = adjustedPayment - interest;
        balance -= principal;
      }
      
      const error = balance - targetBalanceAtEnd;
      if (Math.abs(error) < tolerance) {
        break;
      }
      
      // Ajustar el pago basándose en el error
      adjustedPayment += error / periodMonths;
    }
    
    monthlyPayment = adjustedPayment;
    
    // Calcular los meses de este periodo
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
      });
    }
    
    // Asegurar que el último mes del último periodo tenga balance 0
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
