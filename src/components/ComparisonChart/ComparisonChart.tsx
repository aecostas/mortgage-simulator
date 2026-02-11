import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useMortgageStore } from '../../store/mortgageStore';
import './ComparisonChart.scss';

const COLORS = ['#0066cc', '#2e7d32', '#ed6c02', '#9c27b0', '#00838f', '#c62828'];

/** Colores para el desglose apilado: capital, interés, seguros */
const STACK_COLORS = {
  principal: '#2e7d32',
  interest: '#ed6c02',
  insurance: '#5c6bc0',
};

export function ComparisonChart() {
  const mortgages = useMortgageStore((state) => state.mortgages);
  const withSchedule = mortgages.filter((m) => m.schedule.length > 0);

  if (withSchedule.length === 0) {
    return (
      <div className="comparison-chart comparison-chart--empty">
        <p>Calcula al menos una hipoteca en sus pestañas para ver la comparación.</p>
      </div>
    );
  }

  const maxMonths = Math.max(...withSchedule.map((m) => m.schedule.length));
  const xAxisMonths = Array.from({ length: maxMonths }, (_, i) => i + 1);

  const balanceSeries = withSchedule.map((m, i) => ({
    name: m.name || `Hipoteca ${i + 1}`,
    type: 'line' as const,
    smooth: true,
    data: m.schedule.map((r) => Math.round(r.remainingBalance * 100) / 100),
    lineStyle: { width: 2 },
    itemStyle: { color: COLORS[i % COLORS.length] },
  }));

  const paidSeries = withSchedule.map((m, i) => {
    let total = 0;
    const cumulativePaid = m.schedule.map((row) => {
      total += row.payment + (row.monthlyInsurance ?? 0);
      return Math.round(total * 100) / 100;
    });
    return {
      name: m.name || `Hipoteca ${i + 1}`,
      type: 'line' as const,
      smooth: true,
      data: cumulativePaid,
      lineStyle: { width: 2 },
      itemStyle: { color: COLORS[i % COLORS.length] },
    };
  });

  const balanceOption: EChartsOption = {
    title: { text: 'Capital pendiente', left: 'center' },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: unknown, _dataIndex: number) => `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`,
    },
    legend: { top: 28, type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 60, containLabel: true },
    xAxis: {
      type: 'category',
      name: 'Mes',
      nameLocation: 'middle',
      nameGap: 30,
      data: xAxisMonths,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: '€',
      nameLocation: 'end',
      axisLabel: {
        formatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
      },
    },
    series: balanceSeries,
  };

  const paidOption: EChartsOption = {
    title: { text: 'Total pagado acumulado', left: 'center' },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: unknown, _dataIndex: number) => `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`,
    },
    legend: { top: 28, type: 'scroll' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 60, containLabel: true },
    xAxis: {
      type: 'category',
      name: 'Mes',
      nameLocation: 'middle',
      nameGap: 30,
      data: xAxisMonths,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: '€',
      nameLocation: 'end',
      axisLabel: {
        formatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
      },
    },
    series: paidSeries,
  };

  const stackOptions: EChartsOption[] = withSchedule.map((m) => {
    const months = m.schedule.map((_, i) => i + 1);
    let accPrincipal = 0;
    let accInterest = 0;
    let accInsurance = 0;
    const principalData = m.schedule.map((r) => {
      accPrincipal += r.principalPayment;
      return Math.round(accPrincipal * 100) / 100;
    });
    const interestData = m.schedule.map((r) => {
      accInterest += r.interestPayment;
      return Math.round(accInterest * 100) / 100;
    });
    const insuranceData = m.schedule.map((r) => {
      accInsurance += r.monthlyInsurance ?? 0;
      return Math.round(accInsurance * 100) / 100;
    });
    return {
      title: { text: `Total acumulado — ${m.name || 'Hipoteca'}`, left: 'center' },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown, _dataIndex: number) => `${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`,
      },
      legend: { top: 28, data: ['Capital amortizado', 'Interés', 'Seguros'] },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 60, containLabel: true },
      xAxis: {
        type: 'category',
        name: 'Mes',
        nameLocation: 'middle',
        nameGap: 30,
        data: months,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '€ acumulado',
        nameLocation: 'end',
        axisLabel: {
          formatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
        },
      },
      series: [
        {
          name: 'Capital amortizado',
          type: 'line' as const,
          stack: 'payment',
          areaStyle: { opacity: 0.8 },
          data: principalData,
          lineStyle: { width: 0 },
          itemStyle: { color: STACK_COLORS.principal },
        },
        {
          name: 'Interés',
          type: 'line' as const,
          stack: 'payment',
          areaStyle: { opacity: 0.8 },
          data: interestData,
          lineStyle: { width: 0 },
          itemStyle: { color: STACK_COLORS.interest },
        },
        {
          name: 'Seguros',
          type: 'line' as const,
          stack: 'payment',
          areaStyle: { opacity: 0.8 },
          data: insuranceData,
          lineStyle: { width: 0 },
          itemStyle: { color: STACK_COLORS.insurance },
        },
      ],
    };
  });

  return (
    <div className="comparison-chart">
      <div className="comparison-chart__chart">
        <ReactECharts option={balanceOption} style={{ height: 340 }} notMerge />
      </div>
      <div className="comparison-chart__chart">
        <ReactECharts option={paidOption} style={{ height: 340 }} notMerge />
      </div>
      {stackOptions.map((option, i) => (
        <div key={withSchedule[i].id} className="comparison-chart__chart">
          <ReactECharts option={option} style={{ height: 340 }} notMerge />
        </div>
      ))}
    </div>
  );
}
