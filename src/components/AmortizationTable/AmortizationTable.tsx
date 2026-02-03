import type { AmortizationRow } from '../../utils/amortization';
import './AmortizationTable.scss';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
}

export function AmortizationTable({ schedule }: AmortizationTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="amortization-table-card">
      <h2 className="card-title">Tabla de Amortización</h2>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="amortization-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Periodo</th>
                <th>Pago Mensual</th>
                <th>Pago Principal</th>
                <th>Pago Intereses</th>
                <th>Balance Restante</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{row.period}</td>
                  <td>{formatCurrency(row.payment)}</td>
                  <td>{formatCurrency(row.principalPayment)}</td>
                  <td>{formatCurrency(row.interestPayment)}</td>
                  <td>{formatCurrency(row.remainingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
