import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';
import type { EuriborSeries } from '../../utils/euribor';
import './EuriborChart.scss';

interface EuriborChartProps {
  /** Una serie por periodo variable (ordenadas por startMonth) */
  series: EuriborSeries[];
  /** Ancho del gráfico (por defecto 100% para adaptarse al contenedor) */
  width?: number | string;
  /** Alto del gráfico */
  height?: number;
}

export function EuriborChart({
  series,
  width = '100%',
  height = 95,
}: EuriborChartProps) {
  const option = useMemo<EChartsOption>(() => {
    if (series.length === 0) return {};

    const allMonths: number[] = [];
    for (const s of series) {
      for (let i = 0; i < s.values.length; i++) {
        const m = s.startMonth + i;
        if (!allMonths.includes(m)) allMonths.push(m);
      }
    }
    allMonths.sort((a, b) => a - b);
    if (allMonths.length === 0) return {};

    const totalMonths = allMonths.length;
    const nLabels = Math.min(5, Math.max(3, Math.ceil(totalMonths / 72)));
    const xInterval = totalMonths > 1 ? Math.max(0, Math.floor(totalMonths / nLabels) - 1) : 0;

    const chartSeries = series.map((s) => {
      const data = allMonths.map((month) => {
        const idx = month - s.startMonth;
        if (idx >= 0 && idx < s.values.length) {
          return s.values[idx];
        }
        return null;
      });
      return {
        name: `Periodo ${s.startMonth}-${s.startMonth + s.values.length - 1}`,
        type: 'line' as const,
        smooth: true,
        data,
        lineStyle: { width: 2 },
        itemStyle: { color: '#0066cc' },
        showSymbol: false,
      };
    });

    return {
      title: { text: 'Simulación Euribor', left: 'center', textStyle: { fontSize: 11 } },
      legend: chartSeries.length > 1 ? { top: 22, textStyle: { fontSize: 9 } } : { show: false },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) =>
          value != null ? `${Number(value).toFixed(2)} %` : '—',
      },
      grid: {
        left: 36,
        right: 8,
        bottom: 24,
        top: 36,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: allMonths,
        boundaryGap: false,
        axisLabel: {
          color: 'rgba(90,90,90,0.7)',
          fontSize: 9,
          interval: xInterval,
          formatter: (value: string) => {
            const m = Number(value);
            const year = Math.ceil(m / 12);
            return `Año ${year}`;
          },
        },
        axisTick: { show: true, lineStyle: { color: 'rgba(200,200,200,0.6)' } },
        axisLine: { lineStyle: { color: 'rgba(200,200,200,0.6)' } },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        axisLabel: {
          color: 'rgba(90,90,90,0.7)',
          fontSize: 9,
          formatter: (value: number) => `${value.toFixed(1)}`,
        },
        splitLine: { lineStyle: { color: 'rgba(200,200,200,0.4)' } },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: chartSeries,
    };
  }, [series]);

  if (series.length === 0 || series.every((s) => s.values.length === 0)) {
    return null;
  }

  return (
    <div className="euribor-chart">
      <ReactECharts
        option={option}
        style={{ width, height, minHeight: height }}
        notMerge
      />
    </div>
  );
}
