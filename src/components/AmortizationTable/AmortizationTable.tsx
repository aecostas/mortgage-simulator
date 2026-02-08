import type { AmortizationRow } from '../../utils/amortization';
import type { EuriborPaths } from '../../utils/amortization';
import { EuriborChart } from '../EuriborChart/EuriborChart';
import './AmortizationTable.scss';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  /** Importe mensual total de seguros (vida + hogar) a sumar a la cuota */
  monthlyInsurance?: number;
  /** Paths de Euribor (%) por periodo variable para la gráfica */
  euriborPaths?: EuriborPaths;
}

export function AmortizationTable({
  schedule,
  monthlyInsurance = 0,
  euriborPaths,
}: AmortizationTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const totalInterest = schedule.reduce((sum, row) => sum + row.interestPayment, 0);
  const maxPayment = schedule.length > 0 ? Math.max(...schedule.map((row) => row.payment)) : 0;
  const insurancePerRow = (row: AmortizationRow) => row.monthlyInsurance ?? monthlyInsurance;
  const maxTotalWithInsurance =
    schedule.length > 0
      ? Math.max(...schedule.map((row) => row.payment + insurancePerRow(row)))
      : 0;

  const euriborSeries =
    euriborPaths && Object.keys(euriborPaths).length > 0
      ? Object.entries(euriborPaths)
          .map(([idx, values]) => ({
            startMonth:
              schedule.find((r) => r.period === Number(idx) + 1)?.month ?? 1,
            values,
          }))
          .sort((a, b) => a.startMonth - b.startMonth)
      : [];

  return (
    <div className="amortization-table-card">
      <h2 className="card-title">Tabla de Amortización</h2>
      <div className="card-body">
        {euriborSeries.length > 0 && (
          <EuriborChart series={euriborSeries} width={640} height={220} />
        )}
        <div className="amortization-summary">
          <div className="amortization-summary-item">
            <span className="amortization-summary-label">Total intereses</span>
            <span className="amortization-summary-value">{formatCurrency(totalInterest)}</span>
          </div>
          <div className="amortization-summary-item">
            <span className="amortization-summary-label">Cuota máxima</span>
            <span className="amortization-summary-value">{formatCurrency(maxPayment)}</span>
          </div>
          <div className="amortization-summary-item">
            <span className="amortization-summary-label">Máximo total (cuota + seguros)</span>
            <span className="amortization-summary-value">
              {formatCurrency(maxTotalWithInsurance)}
            </span>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="amortization-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Periodo</th>
                <th>Pago Mensual</th>
                <th>Total (cuota + seguros)</th>
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
                  <td>{formatCurrency(row.payment + insurancePerRow(row))}</td>
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
