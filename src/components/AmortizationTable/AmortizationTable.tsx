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
  const totalCuota = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalPartialAmort = schedule.reduce(
    (sum, row) => sum + (row.partialAmortization ?? 0),
    0,
  );
  const hasPartialAmort = totalPartialAmort > 0;
  const insurancePerRow = (row: AmortizationRow) => row.monthlyInsurance ?? monthlyInsurance;
  const extraItemsPerRow = (row: AmortizationRow) => row.monthlyExtraItems ?? 0;
  const totalInsurance = schedule.reduce((sum, row) => sum + insurancePerRow(row), 0);
  const totalExtraItems = schedule.reduce((sum, row) => sum + extraItemsPerRow(row), 0);
  const totalExtraPerRow = (row: AmortizationRow) =>
    row.payment +
    insurancePerRow(row) +
    extraItemsPerRow(row) +
    (row.partialAmortization ?? 0);
  const maxPayment = schedule.length > 0 ? Math.max(...schedule.map((row) => row.payment)) : 0;
  const maxTotalWithExtras =
    schedule.length > 0 ? Math.max(...schedule.map(totalExtraPerRow)) : 0;
  // Total pagado = suma por fila (cuota + seguros + otros + amort. parcial) para incluir siempre las parciales
  const totalPaid = schedule.reduce((sum, row) => sum + totalExtraPerRow(row), 0);

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
            <span className="amortization-summary-label">Total cuota (todas las mensualidades)</span>
            <span className="amortization-summary-value">{formatCurrency(totalCuota)}</span>
          </div>
          {hasPartialAmort && (
            <div className="amortization-summary-item">
              <span className="amortization-summary-label">Total amortizaciones parciales</span>
              <span className="amortization-summary-value">{formatCurrency(totalPartialAmort)}</span>
            </div>
          )}
          {totalInsurance > 0 && (
            <div className="amortization-summary-item">
              <span className="amortization-summary-label">Total seguros</span>
              <span className="amortization-summary-value">{formatCurrency(totalInsurance)}</span>
            </div>
          )}
          {totalExtraItems > 0 && (
            <div className="amortization-summary-item">
              <span className="amortization-summary-label">Total otros (comunidad, IBI, etc.)</span>
              <span className="amortization-summary-value">{formatCurrency(totalExtraItems)}</span>
            </div>
          )}
          <div className="amortization-summary-item amortization-summary-total">
            <span className="amortization-summary-label">
              Total pagado (cuota + amort. parciales + seguros + otros)
            </span>
            <span className="amortization-summary-value">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="amortization-summary-item">
            <span className="amortization-summary-label">Cuota máxima</span>
            <span className="amortization-summary-value">{formatCurrency(maxPayment)}</span>
          </div>
          <div className="amortization-summary-item">
            <span className="amortization-summary-label">Máximo total mensual (cuota + seguros + otros)</span>
            <span className="amortization-summary-value">
              {formatCurrency(maxTotalWithExtras)}
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
                <th>{hasPartialAmort ? 'Total mes (cuota + seguros + amort. parcial)' : 'Total mes (cuota + seguros)'}</th>
                {hasPartialAmort && <th>Amort. parcial</th>}
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
                  <td>{formatCurrency(totalExtraPerRow(row))}</td>
                  {hasPartialAmort && (
                    <td>
                      {row.partialAmortization != null && row.partialAmortization > 0
                        ? formatCurrency(row.partialAmortization)
                        : "—"}
                    </td>
                  )}
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
