import { useMortgageStore } from '../../store/mortgageStore';
import type { InterestType } from '../../utils/amortization';
import './ComparisonTable.scss';

interface ComparisonTableProps {
  onMortgageClick?: (mortgageId: string) => void;
}

export function ComparisonTable({ onMortgageClick }: ComparisonTableProps = {}) {
  const mortgages = useMortgageStore((state) => state.mortgages);
  const withSchedule = mortgages.filter((m) => m.schedule.length > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (withSchedule.length === 0) {
    return (
      <div className="comparison-table comparison-table--empty">
        <p>Calcula al menos una hipoteca para ver la comparación.</p>
      </div>
    );
  }

  const getMortgageSummary = (mortgage: typeof withSchedule[0]) => {
    const { formState, schedule } = mortgage;
    const sortedPeriods = [...formState.periods].sort(
      (a, b) => a.startMonth - b.startMonth
    );
    const firstPeriod = sortedPeriods[0];
    const interestType = firstPeriod.interestType ?? 'fixed';
    
    // Determinar tipo de interés (fijo, variable, o mixto)
    const hasFixed = sortedPeriods.some(p => (p.interestType ?? 'fixed') === 'fixed');
    const hasVariable = sortedPeriods.some(p => (p.interestType ?? 'fixed') === 'variable');
    let typeLabel = '';
    if (hasFixed && hasVariable) {
      typeLabel = 'Mixto';
    } else if (interestType === 'variable') {
      typeLabel = 'Variable';
    } else {
      typeLabel = 'Fijo';
    }

    // Tasa de interés inicial
    let interestRateLabel = '';
    if (interestType === 'fixed') {
      interestRateLabel = `${formatNumber(firstPeriod.annualInterestRate, 2)}%`;
    } else {
      const differential = firstPeriod.euriborDifferential ?? 0;
      interestRateLabel = `Euribor + ${formatNumber(differential, 2)}%`;
    }

    // Cuota de la hipoteca (sin seguros ni gastos adicionales)
    const firstMortgagePayment = schedule.length > 0 ? schedule[0].payment : 0;
    
    // Pago total mensual inicial
    const firstInsurance = schedule.length > 0 ? (schedule[0].monthlyInsurance ?? 0) : 0;
    const firstExtraItems = schedule.length > 0 ? (schedule[0].monthlyExtraItems ?? 0) : 0;
    const firstTotalPayment = firstMortgagePayment + firstInsurance + firstExtraItems;

    // Totales
    const totalInterest = schedule.reduce((sum, row) => sum + row.interestPayment, 0);
    const totalPaid = schedule.reduce((sum, row) => {
      return sum + row.payment + (row.monthlyInsurance ?? 0) + (row.monthlyExtraItems ?? 0);
    }, 0);

    // Seguros mensuales promedio
    const avgInsurance = schedule.length > 0
      ? schedule.reduce((sum, row) => sum + (row.monthlyInsurance ?? 0), 0) / schedule.length
      : 0;

    // Duración en años
    const years = Math.floor(formState.months / 12);
    const remainingMonths = formState.months % 12;
    const durationLabel = remainingMonths > 0 
      ? `${years}a ${remainingMonths}m`
      : `${years}a`;

    return {
      name: formState.name || mortgage.name,
      principal: formState.principal,
      months: formState.months,
      durationLabel,
      interestType: typeLabel,
      interestRate: interestRateLabel,
      firstMortgagePayment,
      firstPayment: firstTotalPayment,
      totalInterest,
      totalPaid,
      avgInsurance,
    };
  };

  const summaries = withSchedule.map(getMortgageSummary);

  return (
    <div className="comparison-table">
      <h2 className="comparison-table__title">Comparación de Hipotecas</h2>
      <div className="comparison-table__wrapper">
        <table className="comparison-table__table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Principal</th>
              <th>Duración</th>
              <th>Tipo de Interés</th>
              <th>Tasa Inicial</th>
              <th>Cuota Hipoteca</th>
              <th>Pago Total Mensual</th>
              <th>Total Intereses</th>
              <th>Total Pagado</th>
              <th>Seguros Mensuales</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary, index) => (
              <tr key={withSchedule[index].id}>
                <td 
                  className={`comparison-table__cell-name ${onMortgageClick ? 'comparison-table__cell-name--clickable' : ''}`}
                  onClick={onMortgageClick ? () => onMortgageClick(withSchedule[index].id) : undefined}
                  style={onMortgageClick ? { cursor: 'pointer' } : undefined}
                >
                  {summary.name}
                </td>
                <td className="comparison-table__cell-number">{formatCurrency(summary.principal)}</td>
                <td className="comparison-table__cell-number">{summary.durationLabel}</td>
                <td className="comparison-table__cell-text">{summary.interestType}</td>
                <td className="comparison-table__cell-text">{summary.interestRate}</td>
                <td className="comparison-table__cell-number">{formatCurrency(summary.firstMortgagePayment)}</td>
                <td className="comparison-table__cell-number">{formatCurrency(summary.firstPayment)}</td>
                <td className="comparison-table__cell-number">{formatCurrency(summary.totalInterest)}</td>
                <td className="comparison-table__cell-number">{formatCurrency(summary.totalPaid)}</td>
                <td className="comparison-table__cell-number">{formatCurrency(summary.avgInsurance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
